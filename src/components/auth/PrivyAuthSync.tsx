"use client";

import { useCallback, useRef, useEffect } from "react";
import { usePrivy, useSubscribeToJwtAuthWithFlag } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/authStore";
import { useAuthSyncStore } from "@/stores/authSyncStore";
import { getPrivyToken } from "@/services/auth";

/** Stop retrying HTTP fallback after this many consecutive failures */
const MAX_CONSECUTIVE_FAILURES = 3;
/** Refresh margin — fetch a new token 60s before it expires */
const EXPIRY_MARGIN_S = 60;

/**
 * Decode JWT payload (middle segment).
 * Returns null if the token is malformed.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

/** Check if a JWT is still usable (not expired, with margin). */
function isTokenValid(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return false;
  return payload.exp > Math.floor(Date.now() / 1000) + EXPIRY_MARGIN_S;
}

function logTokenDetails(label: string, token: string) {
  const payload = decodeJwtPayload(token);
  let alg = "?";
  try { alg = JSON.parse(atob(token.split(".")[0])).alg; } catch { /* ignore */ }
  console.log(label, { sub: payload?.sub, iss: payload?.iss, exp: payload?.exp, iat: payload?.iat, alg });
}

/**
 * Syncs ElementPay's HTTP-only-cookie auth state with Privy's JWT-based auth.
 *
 * `useSubscribeToJwtAuthWithFlag` watches `isAuthenticated` — when it flips
 * to true, Privy calls `getExternalJwt` to retrieve the access token and
 * authenticate the Privy session.
 *
 * Token caching strategy:
 *   - First call uses the pre-fetched token from verify-otp (zero HTTP)
 *   - Subsequent calls reuse the cached token until it's near expiry
 *   - Only fetches a new token over HTTP when the cache is empty or expired
 *
 * Mount this component once at the top level (in Providers).
 */
export default function PrivyAuthSync() {
  const isOtpVerified = useAuthStore((s) => s.isOtpVerified);
  const { authenticated } = usePrivy();

  // Persistent token cache — survives re-renders, doesn't cause re-renders
  const tokenCacheRef = useRef<string | null>(null);
  const failureCountRef = useRef<number>(0);
  const callCountRef = useRef<number>(0);
  const lastTokenHashRef = useRef<string | null>(null);
  const failureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Once Privy confirms auth, suppress repetitive logging from SDK re-auth cycles
  const authenticatedOnceRef = useRef(false);

  // Reset on new login
  useEffect(() => {
    if (isOtpVerified) {
      tokenCacheRef.current = null;
      failureCountRef.current = 0;
      callCountRef.current = 0;
      lastTokenHashRef.current = null;
      authenticatedOnceRef.current = false;
      if (failureTimerRef.current) clearTimeout(failureTimerRef.current);
      useAuthSyncStore.getState().reset();
    }
  }, [isOtpVerified]);

  // Clear cache on logout
  useEffect(() => {
    if (!isOtpVerified) {
      tokenCacheRef.current = null;
    }
  }, [isOtpVerified]);

  // ── Source of truth: usePrivy().authenticated ───────────────────────
  // When Privy confirms authentication (regardless of hook state timing),
  // update our store immediately. This avoids the race condition where
  // state.status="done" is set before onAuthenticated fires.
  useEffect(() => {
    if (authenticated && isOtpVerified) {
      authenticatedOnceRef.current = true;
      useAuthSyncStore.getState().setStatus("authenticated");
    }
  }, [authenticated, isOtpVerified]);

  /**
   * Stable callback — reads `isOtpVerified` directly from the Zustand store
   * instead of closing over React state.  This avoids a stale-closure bug
   * where Privy's hook calls a previous callback reference that still has
   * the old `isOtpVerified=false` value after the flag transiently flips.
   */
  const getExternalJwt = useCallback(async (): Promise<string | undefined> => {
    const callId = ++callCountRef.current;

    // Read directly from the store — NOT from the React closure — so the
    // value is always current even if Privy holds a stale callback ref.
    const otpVerified = useAuthStore.getState().isOtpVerified;

    if (!otpVerified) {
      console.log(`[PrivyAuthSync] getExternalJwt #${callId}: skipped (not OTP verified)`);
      return undefined;
    }

    // 1. Check local ref cache (set from previous calls)
    if (tokenCacheRef.current && isTokenValid(tokenCacheRef.current)) {
      // After first successful auth, Privy's SDK re-fires every ~2s — suppress spam
      if (!authenticatedOnceRef.current || callId <= 2) {
        console.log(`[PrivyAuthSync] getExternalJwt #${callId}: reusing cached token`);
      }
      return tokenCacheRef.current;
    }

    // 2. Check store cache (set during OTP verification — first call only)
    const storeToken = useAuthStore.getState().privyToken;
    if (storeToken && isTokenValid(storeToken)) {
      useAuthStore.getState().setPrivyToken(null);
      tokenCacheRef.current = storeToken;
      logTokenDetails(`[PrivyAuthSync] getExternalJwt #${callId}: using store token`, storeToken);
      return storeToken;
    }
    // Clear invalid store token
    if (storeToken) useAuthStore.getState().setPrivyToken(null);

    // 3. Circuit breaker
    if (failureCountRef.current >= MAX_CONSECUTIVE_FAILURES) {
      console.warn(
        `[PrivyAuthSync] getExternalJwt #${callId}: circuit open — ` +
        `${failureCountRef.current} consecutive failures, giving up`
      );
      return undefined;
    }

    // 4. Fetch fresh RS256 token via HTTP
    console.log(`[PrivyAuthSync] getExternalJwt #${callId}: fetching via HTTP...`);

    try {
      const { token } = await getPrivyToken();
      failureCountRef.current = 0;
      tokenCacheRef.current = token; // cache for subsequent calls
      logTokenDetails(`[PrivyAuthSync] getExternalJwt #${callId}: HTTP success`, token);
      return token;
    } catch (err) {
      failureCountRef.current++;
      console.error(
        `[PrivyAuthSync] getExternalJwt #${callId}: HTTP failed ` +
        `(${failureCountRef.current}/${MAX_CONSECUTIVE_FAILURES})`,
        err
      );
      return undefined;
    }
  }, []);

  const { state } = useSubscribeToJwtAuthWithFlag({
    isAuthenticated: isOtpVerified,
    getExternalJwt,
    onAuthenticated: ({ user, isNewUser }) => {
      useAuthSyncStore.getState().setStatus("authenticated");
      console.log("[PrivyAuthSync] ✅ Privy authenticated via custom JWT", {
        user,
        isNewUser,
        linkedAccounts: user.linkedAccounts?.length ?? 0,
      });
    },
    onUnauthenticated: () => {
      console.log("[PrivyAuthSync] Privy unauthenticated (session ended)");
      tokenCacheRef.current = null;
    },
    onError: (error) => {
      console.error("[PrivyAuthSync] ❌ Privy JWT sync error:", {
        message: error.message,
        name: error.name,
        stack: error.stack?.split("\n").slice(0, 3).join("\n"),
      });
      // Invalidate cached token so next retry gets a fresh one
      tokenCacheRef.current = null;
      lastTokenHashRef.current = null;
      useAuthSyncStore.getState().setStatus("failed");
    },
  });

  // ── Deferred failure detection with grace period ───────────────────
  // Privy's hook state can go to "done" before authenticated flips to true
  // (race condition in its internal dep array — the same token triggers a
  // fast-path "done" before the prev call's setAuthenticated propagates).
  // Wait 5s after "done" — if authenticated is still false, THEN declare
  // failure. The authenticated watcher above will have long since set
  // status="authenticated" if auth actually succeeded.
  useEffect(() => {
    // Once authenticated, Privy's SDK re-fires hook state every ~2s
    // (done→loading→done). Suppress the spam after first success.
    if (!authenticatedOnceRef.current) {
      console.log("[PrivyAuthSync] Hook state:", state, "| isOtpVerified:", isOtpVerified, "| authenticated:", authenticated);
    }

    // Clear any pending failure timer on re-run
    if (failureTimerRef.current) {
      clearTimeout(failureTimerRef.current);
      failureTimerRef.current = null;
    }

    // Already authenticated — no failure to detect
    if (authenticated || authenticatedOnceRef.current) return;

    if (state?.status === "done" && isOtpVerified && !authenticated) {
      console.log("[PrivyAuthSync] state='done' but authenticated=false — starting 5s grace period");
      failureTimerRef.current = setTimeout(() => {
        const currentStatus = useAuthSyncStore.getState().status;
        if (currentStatus !== "authenticated") {
          console.warn("[PrivyAuthSync] ⚠️ Auth failed — 'done' for 5s without authenticated=true");
          tokenCacheRef.current = null;
          lastTokenHashRef.current = null;
          useAuthSyncStore.getState().setStatus("failed");
        }
      }, 5000);
    }

    return () => {
      if (failureTimerRef.current) {
        clearTimeout(failureTimerRef.current);
        failureTimerRef.current = null;
      }
    };
  }, [state, isOtpVerified, authenticated]);

  return null;
}
