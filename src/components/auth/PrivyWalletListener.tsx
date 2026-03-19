"use client";

import { useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePrivy, useModalStatus, useWallets } from "@privy-io/react-auth";
import { useDisconnect } from "wagmi";
import { useAccount } from "wagmi";
import {
  connectWallet,
  isWalletOwnershipConflictError,
  WALLET_OWNERSHIP_CONFLICT_MESSAGE,
} from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";
import { useAuthModalStore } from "@/stores/authModalStore";
import { useWalletStore } from "@/lib/useWallet";
import { getExplicitSelectedWalletAddress } from "@/lib/privy-wallet-selection";
import { toast } from "sonner";

/**
 * Global listener — watches Privy state and calls the backend to register
 * the wallet once all 4 conditions are met:
 *   1. walletConnecting — user clicked "Connect Wallet" in the auth modal
 *   2. isOtpVerified  — OTP verified, user has a valid session
 *   3. authenticated   — Privy says user is logged in (now happens after custom JWT)
 *   4. walletAddress   — Privy has a wallet address (embedded or external)
 *
 * After the custom-JWT login in OTPStep, Privy `authenticated` becomes true
 * immediately. The wallet address appears after the user picks embedded (create)
 * or external (connect) on the wallet-choice step. At that point this listener
 * fires and calls the backend to link the wallet.
 *
 * Also detects when the user dismisses the Privy modal without connecting,
 * and re-opens our auth modal at the wallet step so they can retry.
 *
 * Mounted in Providers so it persists across all route changes.
 */
export default function PrivyWalletListener() {
  const { authenticated } = usePrivy();
  const { isOpen: privyModalOpen } = useModalStatus();
  const { address: wagmiAddress } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { disconnect: storeDisconnect } = useWalletStore();
  const router = useRouter();

  const isOtpVerified = useAuthStore((s) => s.isOtpVerified);
  const addConnectedWallet = useAuthStore((s) => s.addConnectedWallet);
  const setWalletRegistered = useAuthStore((s) => s.setWalletRegistered);

  const walletConnecting = useAuthModalStore((s) => s.walletConnecting);
  const externalWalletSelectionPending = useAuthModalStore((s) => s.externalWalletSelectionPending);
  const externalWalletSelectionModalOpened = useAuthModalStore((s) => s.externalWalletSelectionModalOpened);
  const markExternalWalletSelectionModalOpened = useAuthModalStore((s) => s.markExternalWalletSelectionModalOpened);
  const clearExternalWalletSelection = useAuthModalStore((s) => s.clearExternalWalletSelection);
  const walletPreference = useAuthStore((s) => s.walletPreference);
  const { wallets } = useWallets();

  // Resolve the correct wallet based on user's preference so we
  // register the right address with the backend.
  const resolvedWalletAddress = useMemo(() => {
    return getExplicitSelectedWalletAddress({
      walletPreference,
      wallets,
      wagmiAddress,
    });
  }, [walletPreference, wallets, wagmiAddress]);

  const walletAddress = useMemo(() => {
    if (walletPreference !== "external") {
      return resolvedWalletAddress;
    }

    if (!externalWalletSelectionPending) {
      return resolvedWalletAddress;
    }

    if (!externalWalletSelectionModalOpened) {
      return null;
    }

    return resolvedWalletAddress;
  }, [
    walletPreference,
    resolvedWalletAddress,
    externalWalletSelectionPending,
    externalWalletSelectionModalOpened,
  ]);

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
      if (externalWalletSelectionPending) {
        clearExternalWalletSelection();
      }
    }
  }, [walletConnecting, externalWalletSelectionPending, clearExternalWalletSelection]);

  useEffect(() => {
    if (
      walletConnecting &&
      walletPreference === "external" &&
      externalWalletSelectionPending &&
      privyModalOpen
    ) {
      markExternalWalletSelectionModalOpened();
    }
  }, [
    walletConnecting,
    walletPreference,
    externalWalletSelectionPending,
    privyModalOpen,
    markExternalWalletSelectionModalOpened,
  ]);

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
        console.log("[WALLET-LINK] Privy dismissed after auth — resuming at wallet-choice step");
        modal.setWalletConnecting(false);
        modal.clearExternalWalletSelection();
        modal.setStep("wallet-choice");
        modal.resumeAuthModal();
      }
    }, 600);

    return () => clearTimeout(id);
  }, [walletConnecting, authenticated]);

  // ── Privy linkWallet modal dismiss detection ────────────────────────────
  // When using linkWallet() (user already authenticated), Privy's modal
  // opens for wallet selection. If dismissed, `authenticated` stays true
  // and `walletAddress` stays null — the old dismiss detection won't fire.
  // Watch privyModalOpen: when it goes from open → closed while we're
  // still waiting for a wallet, treat it as a dismiss.
  const privyModalWasOpenRef = useRef(false);

  useEffect(() => {
    if (!walletConnecting) {
      privyModalWasOpenRef.current = false;
      return;
    }

    if (privyModalOpen) {
      privyModalWasOpenRef.current = true;
      return;
    }

    // Modal just closed (was open → now closed), walletConnecting still true
    if (!privyModalWasOpenRef.current) return;
    privyModalWasOpenRef.current = false;

    // If a wallet address appeared, the main effect will handle registration
    if (walletAddress) return;
    // If the API call already fired, don't interfere
    if (calledRef.current) return;

    const id = setTimeout(() => {
      if (!mountedRef.current) return;
      const modal = useAuthModalStore.getState();
      // Only act if our modal is still hidden (Privy was showing instead)
      if (!modal.isOpen && modal.walletConnecting) {
        console.log("[WALLET-LINK] Privy linkWallet modal dismissed — resuming at wallet-choice step");
        modal.setWalletConnecting(false);
        modal.clearExternalWalletSelection();
        modal.setStep("wallet-choice");
        modal.resumeAuthModal();
      }
    }, 400);

    return () => clearTimeout(id);
  }, [walletConnecting, privyModalOpen, walletAddress]);

  // Main effect: watch all 4 conditions
  useEffect(() => {
    // Only log when walletConnecting is true (active linking) to avoid
    // spamming on every Privy re-auth cycle (~every 2s after login)
    if (walletConnecting) {
      console.log("[WALLET-LINK] effect deps changed", {
        walletConnecting,
        isOtpVerified,
        authenticated,
        walletAddress: walletAddress ?? "null",
        alreadyCalled: calledRef.current,
      });
    }

    // All 4 conditions must be truthy
    if (!walletConnecting) {
      return;
    }
    if (!isOtpVerified) {
      console.log("[WALLET-LINK] ⏳ skipping — OTP not verified");
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

    connectWallet(walletAddress, "base")
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
        m.clearExternalWalletSelection();
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
        m.clearExternalWalletSelection();

        const isConflict = isWalletOwnershipConflictError(error);
        const errorMsg = isConflict
          ? WALLET_OWNERSHIP_CONFLICT_MESSAGE
          : error instanceof Error
            ? error.message
            : "We couldn't link your wallet. Please try again.";

        toast.error(errorMsg);

        // Preserve the Privy JWT session. We only clear the wallet attempt so
        // the user can retry with a different wallet selection.
        useAuthStore.getState().setWalletPreference(null);
        wagmiDisconnect();
        storeDisconnect();
        if (typeof window !== "undefined") {
          localStorage.removeItem("wallet-storage");
        }

        // Keep the user's OTP session intact — only send them back to the
        // wallet-choice step so they can immediately try a different wallet.
        m.setStep("wallet-choice");
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
    isOtpVerified,
    authenticated,
    walletAddress,
    addConnectedWallet,
    setWalletRegistered,
    wagmiDisconnect,
    storeDisconnect,
    router,
  ]);

  return null;
}
