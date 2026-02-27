"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

/**
 * Redirects authenticated users (OTP + wallet registered) from the
 * home page to the dashboard. Relies solely on isAuthenticated
 * (which encodes isOtpVerified && isWalletRegistered) to avoid
 * false positives from stale persisted wallet arrays or Privy state.
 */
export default function HomeRedirectGuard() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    router.replace("/dashboard");
  }, [isAuthenticated, router]);

  return null;
}
