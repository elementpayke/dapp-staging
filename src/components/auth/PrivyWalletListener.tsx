"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useDisconnect } from "wagmi";
import {
  connectWallet,
  isWalletOwnershipConflictError,
  WALLET_OWNERSHIP_CONFLICT_MESSAGE,
} from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";
import { useAuthModalStore } from "@/stores/authModalStore";
import { useWalletStore } from "@/lib/useWallet";
import { toast } from "sonner";

/**
 * Global listener — watches Privy state and calls the backend to register
 * the wallet once all 4 conditions are met:
 *   1. walletConnecting — user clicked "Connect Wallet" in the auth modal
 *   2. token           — OTP verified, we have a JWT
 *   3. authenticated   — Privy says user is logged in
 *   4. walletAddress   — Privy has a wallet address
 *
 * Also detects when the user dismisses the Privy modal without connecting,
 * and re-opens our auth modal at the wallet step so they can retry.
 *
 * Mounted in Providers so it persists across all route changes.
 */
export default function PrivyWalletListener() {
  const { authenticated, user, logout: privyLogout } = usePrivy();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { disconnect: storeDisconnect } = useWalletStore();
  const router = useRouter();

  const token = useAuthStore((s) => s.token);
  const addConnectedWallet = useAuthStore((s) => s.addConnectedWallet);
  const setWalletRegistered = useAuthStore((s) => s.setWalletRegistered);

  const walletConnecting = useAuthModalStore((s) => s.walletConnecting);

  const walletAddress = user?.wallet?.address ?? null;

  // Guard against double-fire
  const calledRef = useRef(false);
  // Track whether the component is still mounted (prevents state updates after unmount)
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Reset the guard when walletConnecting goes back to false
  useEffect(() => {
    if (!walletConnecting) {
      calledRef.current = false;
    }
  }, [walletConnecting]);

  // ── Privy dismiss detection ────────────────────────────────────────────
  // Track whether Privy's `authenticated` was ever true during this
  // walletConnecting session. Only treat it as a "dismiss" when it
  // transitions from true → false (user actually connected then closed).
  const wasAuthenticatedRef = useRef(false);

  useEffect(() => {
    if (!walletConnecting) {
      wasAuthenticatedRef.current = false;
      return;
    }
    if (authenticated) {
      wasAuthenticatedRef.current = true;
      return;
    }
    // walletConnecting=true, authenticated=false
    // Only treat as dismiss if we previously saw authenticated=true
    if (!wasAuthenticatedRef.current) return;

    const id = setTimeout(() => {
      if (!mountedRef.current) return;
      const modal = useAuthModalStore.getState();
      if (!modal.isOpen) {
        console.log("[WALLET-LINK] Privy dismissed after auth — resuming at wallet step");
        modal.setWalletConnecting(false);
        modal.setStep("wallet");
        modal.resumeAuthModal();
      }
    }, 600);

    return () => clearTimeout(id);
  }, [walletConnecting, authenticated]);

  // Main effect: watch all 4 conditions
  useEffect(() => {
    console.log("[WALLET-LINK] CHECKPOINT 2: effect deps changed", {
      walletConnecting,
      hasToken: !!token,
      authenticated,
      walletAddress: walletAddress ?? "null",
      alreadyCalled: calledRef.current,
    });

    // All 4 conditions must be truthy
    if (!walletConnecting) {
      console.log("[WALLET-LINK] ⏳ skipping — walletConnecting is false");
      return;
    }
    if (!token) {
      console.log("[WALLET-LINK] ⏳ skipping — no token");
      return;
    }
    if (!authenticated) {
      console.log("[WALLET-LINK] ⏳ skipping — Privy not authenticated");
      return;
    }
    if (!walletAddress) {
      console.log("[WALLET-LINK] ⏳ skipping — no wallet address yet");
      return;
    }
    if (calledRef.current) {
      console.log("[WALLET-LINK] ⏳ skipping — API already called");
      return;
    }

    // All conditions met — show the linking step, then call the API
    calledRef.current = true;
    console.log("[WALLET-LINK] CHECKPOINT 3: all conditions met, calling API", {
      walletAddress,
    });

    // Open the modal at wallet-linking step to show the spinner.
    // Use direct setters instead of resumeAuthModal to avoid changing
    // walletConnecting (which is in our deps and would trigger cleanup).
    const modal = useAuthModalStore.getState();
    modal.setStep("wallet-linking");
    modal.resumeAuthModal();

    connectWallet(token, walletAddress, "base")
      .then((res) => {
        if (!mountedRef.current) return;

        // If the user cancelled while the API was in-flight, bail out.
        const ms = useAuthModalStore.getState();
        if (!ms.walletConnecting) {
          console.log("[WALLET-LINK] API succeeded but linking was cancelled — ignoring");
          return;
        }

        console.log("[WALLET-LINK] CHECKPOINT 4: API success", res);

        addConnectedWallet(walletAddress);
        setWalletRegistered(true);

        // Success — close modal and go to dashboard
        const m = useAuthModalStore.getState();
        m.setWalletConnecting(false);
        m.closeAuthModal();
        m.reset();

        // Double-check that store reflects fully authenticated before navigating
        const { isAuthenticated: nowAuthed } = useAuthStore.getState();
        if (nowAuthed) {
          router.push("/dashboard");
        } else {
          console.warn("[WALLET-LINK] isAuthenticated still false after setWalletRegistered — not redirecting");
        }
      })
      .catch(async (error) => {
        if (!mountedRef.current) return;

        // If the user cancelled while the API was in-flight, bail out.
        const mState = useAuthModalStore.getState();
        if (!mState.walletConnecting) {
          console.log("[WALLET-LINK] API failed but linking was cancelled — ignoring");
          return;
        }

        console.error("[WALLET-LINK] CHECKPOINT 4: API error", error);

        const m = useAuthModalStore.getState();
        m.setWalletConnecting(false);

        const isConflict = isWalletOwnershipConflictError(error);
        const errorMsg = isConflict
          ? WALLET_OWNERSHIP_CONFLICT_MESSAGE
          : error instanceof Error
            ? error.message
            : "We couldn't link your wallet. Please try again.";

        toast.error(errorMsg);

        // Disconnect Privy + wagmi so the user can pick a different wallet
        try {
          if (authenticated) await privyLogout();
        } catch (logoutErr) {
          console.warn("[WALLET-LINK] Privy logout error (non-fatal):", logoutErr);
        }
        wagmiDisconnect();
        storeDisconnect();
        if (typeof window !== "undefined") {
          localStorage.removeItem("wallet-storage");
        }

        // Keep the user's OTP session intact — only send them back to the
        // wallet step so they can immediately try a different wallet.
        m.setStep("wallet");
        m.setErrorMessage(errorMsg);
        m.resumeAuthModal();
      });

    return () => {
      // No-op: we intentionally do NOT cancel in-flight API calls.
      // The calledRef guard prevents duplicate calls, and mountedRef
      // prevents state updates after unmount.
    };
  }, [
    walletConnecting,
    token,
    authenticated,
    walletAddress,
    addConnectedWallet,
    setWalletRegistered,
    privyLogout,
    wagmiDisconnect,
    storeDisconnect,
    router,
  ]);

  return null;
}
