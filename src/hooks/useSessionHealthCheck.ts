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
 */

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { fireAuthExpired } from "@/hooks/useSessionGuard";

/** Minimum interval between health checks (ms). */
const MIN_CHECK_INTERVAL_MS = 60_000; // 1 minute

export function useSessionHealthCheck() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const lastCheckRef = useRef<number>(0);
  const checkingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function checkSession() {
      // Debounce: don't re-check if we checked very recently
      const now = Date.now();
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

        if (!res.ok) {
          console.warn("[SessionHealthCheck] Token refresh failed —", res.status);
          fireAuthExpired();
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
  }, [isAuthenticated]);
}
