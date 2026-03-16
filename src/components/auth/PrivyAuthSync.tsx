"use client";

import { useCallback, useRef, useEffect } from "react";
import { useSubscribeToJwtAuthWithFlag } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/authStore";
import { getPrivyToken } from "@/services/auth";

/** Stop retrying HTTP fallback after this many consecutive failures */
const MAX_CONSECUTIVE_FAILURES = 3;

/**
 * Decode JWT payload (middle segment) for logging.
 * Returns null if the token is malformed.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload;
  } catch {
    return null;
  }
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
 * IMPORTANT: `getExternalJwt` must NEVER return `undefined` while the user is
 * still authenticated — Privy interprets that as "user lost auth" and calls
 * its own /sessions/logout, killing the session. Every call must either return
 * a valid token or throw (which Privy handles via onError).
 *
 * Mount this component once at the top level (in Providers).
 */
export default function PrivyAuthSync() {
  const isOtpVerified = useAuthStore((s) => s.isOtpVerified);

  // Track consecutive HTTP fetch failures for circuit-breaking
  const failureCountRef = useRef<number>(0);
  const callCountRef = useRef<number>(0);

  // Reset failure tracking on new login
  useEffect(() => {
    if (isOtpVerified) {
      failureCountRef.current = 0;
      callCountRef.current = 0;
    }
  }, [isOtpVerified]);

  const getExternalJwt = useCallback(async (): Promise<string | undefined> => {
    const callId = ++callCountRef.current;

    if (!isOtpVerified) {
      console.log(`[PrivyAuthSync] getExternalJwt #${callId}: skipped (not OTP verified)`);
      return undefined;
    }

    // 1. Try cached token from verify-otp (zero HTTP calls)
    const cached = useAuthStore.getState().privyToken;
    if (cached) {
      useAuthStore.getState().setPrivyToken(null);
      logTokenDetails(`[PrivyAuthSync] getExternalJwt #${callId}: using cached token`, cached);
      return cached;
    }

    // 2. Circuit breaker: stop after repeated consecutive failures
    if (failureCountRef.current >= MAX_CONSECUTIVE_FAILURES) {
      console.warn(
        `[PrivyAuthSync] getExternalJwt #${callId}: circuit open — ` +
        `${failureCountRef.current} consecutive failures, giving up`
      );
      return undefined;
    }

    // 3. Fetch a fresh RS256 token via HTTP (page-reload or refresh)
    console.log(`[PrivyAuthSync] getExternalJwt #${callId}: fetching via HTTP...`);

    try {
      const { token } = await getPrivyToken();
      failureCountRef.current = 0;
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
  }, [isOtpVerified]);

  const { state } = useSubscribeToJwtAuthWithFlag({
    isAuthenticated: isOtpVerified,
    getExternalJwt,
    onAuthenticated: ({ user, isNewUser }) => {
      console.log("[PrivyAuthSync] ✅ Privy authenticated via custom JWT", {
        userId: user.id,
        isNewUser,
        linkedAccounts: user.linkedAccounts?.length ?? 0,
      });
    },
    onUnauthenticated: () => {
      console.log("[PrivyAuthSync] Privy unauthenticated (session ended)");
    },
    onError: (error) => {
      console.error("[PrivyAuthSync] ❌ Privy JWT sync error:", {
        message: error.message,
        name: error.name,
        stack: error.stack?.split("\n").slice(0, 3).join("\n"),
      });
    },
  });

  // Log hook state for debugging
  useEffect(() => {
    console.log("[PrivyAuthSync] Hook state:", state, "| isOtpVerified:", isOtpVerified);
  }, [state, isOtpVerified]);

  return null;
}
