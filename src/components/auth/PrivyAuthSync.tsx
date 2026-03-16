"use client";

import { useCallback } from "react";
import { useSubscribeToJwtAuthWithFlag } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/authStore";
import { getPrivyToken } from "@/services/auth";

/**
 * Syncs ElementPay's HTTP-only-cookie auth state with Privy's JWT-based auth.
 *
 * `useSubscribeToJwtAuthWithFlag` watches `isAuthenticated` — when it flips
 * to true, Privy calls `getExternalJwt` to retrieve the access token and
 * authenticate the Privy session. When the user logs out, Privy also logs out.
 *
 * Mount this component once at the top level (in Providers).
 */
export default function PrivyAuthSync() {
  const isOtpVerified = useAuthStore((s) => s.isOtpVerified);

  const getExternalJwt = useCallback(async (): Promise<string | undefined> => {
    if (!isOtpVerified) return undefined;
    try {
      const { token } = await getPrivyToken();
      return token;
    } catch {
      return undefined;
    }
  }, [isOtpVerified]);

  const { state } = useSubscribeToJwtAuthWithFlag({
    isAuthenticated: isOtpVerified,
    getExternalJwt,
    onAuthenticated: ({ user, isNewUser }) => {
      console.log("[PrivyAuthSync] Privy authenticated via custom JWT", {
        userId: user.id,
        isNewUser,
      });
    },
    onUnauthenticated: () => {
      console.log("[PrivyAuthSync] Privy unauthenticated (session ended)");
    },
    onError: (error) => {
      console.warn("[PrivyAuthSync] Privy JWT sync error:", error.message);
    },
  });

  console.log("[PrivyAuthSync] JWT auth flow state:", state);

  return null;
}
