"use client";

/**
 * useSessionGuard — global hook that detects 401 responses from our API
 * routes and forces a full logout (cookies + Zustand store + Privy).
 *
 * Mount this once at the provider/layout level.
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

// Custom event name fired when our API layer encounters a 401
export const AUTH_EXPIRED_EVENT = "elementpay:auth-expired";

/**
 * Dispatch this event from anywhere (e.g. a fetch wrapper) to trigger
 * a forced logout.  The guard hook will pick it up.
 */
export function fireAuthExpired() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  }
}

export function useSessionGuard() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isOtpVerified = useAuthStore((s) => s.isOtpVerified);
  const loggingOutRef = useRef(false);

  useEffect(() => {
    if (!isOtpVerified) return; // Nothing to guard if not logged in

    const handleAuthExpired = async () => {
      // Prevent multiple simultaneous logouts
      if (loggingOutRef.current) return;
      loggingOutRef.current = true;

      console.warn("[SessionGuard] Auth expired — forcing full logout.");

      try {
        // 1. Call server-side logout to clear HTTP-only cookies
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      } catch {
        // best-effort
      }

      // 2. Clear Zustand auth store
      clearAuth();

      // 3. Clear wallet storage
      if (typeof window !== "undefined") {
        localStorage.removeItem("wallet-storage");
      }

      // 4. Redirect to home
      router.push("/");

      // Reset after a brief delay so future logouts work
      setTimeout(() => {
        loggingOutRef.current = false;
      }, 2000);
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, [isOtpVerified, clearAuth, router]);
}
