import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "./useWallet";
import { useAuthStore } from "@/stores/authStore";
import { useAuthModalStore } from "@/stores/authModalStore";

/**
 * Combined auth hook.
 * Checks both the email-based auth AND wallet connection.
 */
export const useAuth = () => {
  const { isConnected } = useWallet();
  const {
    isAuthenticated,
    user,
    token,
    clearAuth,
  } = useAuthStore();
  const { openAuthModal } = useAuthModalStore();
  const router = useRouter();

  useEffect(() => {
    // If neither auth system is active, redirect to landing
    if (!isAuthenticated && !isConnected) {
      router.push("/");
    }
  }, [isAuthenticated, isConnected, router]);

  return {
    /** True if the user completed the email OTP flow */
    isAuthenticated,
    /** True if a wallet is connected (via Privy/wagmi) */
    isConnected,
    /** True if either auth or wallet is connected — for backward compat */
    isLoggedIn: isAuthenticated || isConnected,
    /** The authenticated user profile (null if not authed) */
    user,
    /** Access token */
    token,
    /** Open the auth modal (email → OTP → wallet → KYC) */
    login: openAuthModal,
    /** Clear auth state */
    logout: clearAuth,
  };
};
