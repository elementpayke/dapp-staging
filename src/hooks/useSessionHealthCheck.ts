"use client";

/**
 * useSessionHealthCheck — proactively validates the backend session when
 * the user returns to the app (tab focus / visibility change) or on
 * initial dashboard mount.
 *
 * If the access token is expired, the refresh-token endpoint will
 * transparently rotate it. If BOTH tokens are dead the hook fires
 * `fireAuthExpired()` so the session guard can force a clean logout
 * instead of leaving the user on a broken dashboard.
 *
 * Guards:
 *  - Skips the check entirely if the session was established less than
 *    GRACE_PERIOD_MS ago (prevents nuking freshly-authenticated sessions
 *    due to slow compilation or backend hiccups).
 *  - Only treats HTTP 401 as an auth failure. Other errors (404, 500,
 *    network) are logged but do NOT trigger logout — they indicate
 *    server issues, not invalid credentials.
 */

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { fireAuthExpired } from "@/hooks/useSessionGuard";

/** Minimum interval between health checks (ms). */
const MIN_CHECK_INTERVAL_MS = 60_000; // 1 minute

/** Don't run the health check within this window of a fresh login. */
const GRACE_PERIOD_MS = 30_000; // 30 seconds

export function useSessionHealthCheck() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionEstablishedAt = useAuthStore((s) => s._sessionEstablishedAt);
  const lastCheckRef = useRef<number>(0);
  const checkingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function checkSession() {
      const now = Date.now();

      // Skip if the session was just established — token is still fresh
      if (sessionEstablishedAt && now - sessionEstablishedAt < GRACE_PERIOD_MS) {
        return;
      }

      // Debounce: don't re-check if we checked very recently
      if (now - lastCheckRef.current < MIN_CHECK_INTERVAL_MS) return;
      if (checkingRef.current) return;

      checkingRef.current = true;
      lastCheckRef.current = now;

      try {
        // Hit the refresh-token endpoint; it will:
        //  - Succeed (200) if refresh token is valid → cookies are rotated
        //  - Fail (401) if both tokens are dead
        const res = await fetch("/api/auth/refresh-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (res.status === 401) {
          // Genuine auth failure — tokens are invalid/expired
          console.warn("[SessionHealthCheck] Token refresh returned 401 — session expired.");
          fireAuthExpired();
        } else if (!res.ok) {
          // Server error (404, 500, etc.) — NOT an auth failure.
          // Don't logout; the backend may be temporarily unavailable.
          console.warn("[SessionHealthCheck] Token refresh returned", res.status, "— skipping logout (not an auth error).");
        }
      } catch {
        // Network error — don't force logout, user might just be offline
        console.warn("[SessionHealthCheck] Network error during health check");
      } finally {
        checkingRef.current = false;
      }
    }

    // Check on mount (covers returning to a stale tab)
    checkSession();

    // Check when tab becomes visible again
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    }

    // Check on window focus (covers alt-tabbing back)
    function handleFocus() {
      checkSession();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated, sessionEstablishedAt]);
}
