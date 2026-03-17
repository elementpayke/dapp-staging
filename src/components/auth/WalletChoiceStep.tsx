"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import { Wallet, Sparkles, ExternalLink, Loader2, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { useDisconnect } from "wagmi";
import { useAuthModalStore } from "@/stores/authModalStore";
import { useAuthStore } from "@/stores/authStore";
import { useAuthSyncStore } from "@/stores/authSyncStore";
import { useWalletStore } from "@/lib/useWallet";

/** How long to wait for Privy JWT auth before enabling fallback. */
const AUTH_TIMEOUT_MS = 12_000;

/**
 * Wallet choice step — shown after OTP verification.
 * Offers two options:
 *   1. Create an embedded wallet (recommended)
 *   2. Connect an external wallet — triggers Privy's linkWallet() popup directly
 *
 * Both buttons become fully active once Privy authenticates via custom JWT.
 * If JWT sync fails or times out, both buttons fall back to Privy's native
 * login() flow so the user is never stuck.
 */
const WalletChoiceStep = () => {
  const { createWallet, authenticated, ready, user, login, linkWallet, logout: privyLogout } = usePrivy();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { disconnect: storeDisconnect } = useWalletStore();
  const setWalletConnecting = useAuthModalStore((s) => s.setWalletConnecting);
  const hideModal = useAuthModalStore((s) => s.hideModal);
  const setModalError = useAuthModalStore((s) => s.setErrorMessage);
  const setWalletPreference = useAuthStore((s) => s.setWalletPreference);
  const isWalletRegistered = useAuthStore((s) => s.isWalletRegistered);
  const authSyncStatus = useAuthSyncStore((s) => s.status);

  const [creating, setCreating] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanedRef = useRef(false);

  // Privy JWT auth succeeded
  const privyReady = ready && authenticated;
  // JWT auth failed or timed out — use fallback (login()) instead
  const jwtFailed = timedOut || authSyncStatus === "failed";

  // ── Clear stale Privy session on mount ──────────────────────────────
  // If Privy still has a wallet from a previous session but the user
  // hasn't registered it (they're back at wallet-choice), wipe it so
  // the buttons start fresh and don't show phantom wallet state.
  useEffect(() => {
    if (cleanedRef.current) return;
    if (!ready) return;
    const hasStaleWallet = !!user?.wallet?.address && !isWalletRegistered;
    if (!hasStaleWallet) return;

    cleanedRef.current = true;
    setCleaning(true);
    console.log("[WalletChoiceStep] Clearing stale Privy session (wallet exists but not registered)");

    (async () => {
      try {
        await privyLogout();
      } catch (e) {
        console.warn("[WalletChoiceStep] Privy logout error (non-fatal):", e);
      }
      wagmiDisconnect();
      storeDisconnect();
      if (typeof window !== "undefined") {
        localStorage.removeItem("wallet-storage");
      }
      setCleaning(false);
      console.log("[WalletChoiceStep] Stale session cleared");
    })();
  }, [ready, user?.wallet?.address, isWalletRegistered, privyLogout, wagmiDisconnect, storeDisconnect]);

  // ── Timeout for JWT auth ────────────────────────────────────────────
  useEffect(() => {
    if (privyReady || timedOut) return;
    timerRef.current = setTimeout(() => setTimedOut(true), AUTH_TIMEOUT_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [privyReady, timedOut]);

  // Recover from timeout if Privy eventually authenticates
  useEffect(() => {
    if (privyReady && timedOut) setTimedOut(false);
  }, [privyReady, timedOut]);

  // Fast-track timeout when authSyncStore reports failure
  useEffect(() => {
    if (authSyncStatus === "failed" && !privyReady) setTimedOut(true);
  }, [authSyncStatus, privyReady]);

  // ── Embedded wallet handler ─────────────────────────────────────────
  const handleCreateEmbedded = useCallback(async () => {
    setModalError(null);
    setWalletPreference("embedded");

    // Happy path: Privy is authenticated via custom JWT
    if (privyReady) {
      setCreating(true);
      try {
        if (!user?.wallet?.address) {
          await createWallet();
        }
        setWalletConnecting(true);
      } catch (err: any) {
        console.error("[WalletChoiceStep] createWallet failed:", err);
        setModalError(err?.message ?? "Failed to create wallet. Please try again.");
        setCreating(false);
      }
      return;
    }

    // Fallback: JWT sync failed — use Privy's native login() which
    // handles its own auth and can create an embedded wallet.
    if (jwtFailed) {
      console.log("[WalletChoiceStep] JWT failed — falling back to Privy login() for embedded wallet");
      setCreating(true);
      setWalletConnecting(true);
      hideModal();
      setTimeout(() => login(), 150);
      return;
    }

    // Still waiting for JWT auth
    setModalError("Wallet service is still connecting. Please wait a moment.");
  }, [privyReady, jwtFailed, user?.wallet?.address, createWallet, login, setWalletConnecting, hideModal, setModalError, setWalletPreference]);

  // ── External wallet handler ─────────────────────────────────────────
  const handleConnectExternal = useCallback(() => {
    setModalError(null);
    setWalletPreference("external");
    setWalletConnecting(true);
    hideModal();

    setTimeout(() => {
      if (authenticated) {
        // Privy is authenticated — use linkWallet() to add an external wallet
        console.log("[WalletChoiceStep] Calling linkWallet() for external wallet");
        linkWallet();
      } else {
        // JWT sync failed — use login() which opens Privy's wallet-connect modal
        console.log("[WalletChoiceStep] Privy not authenticated — calling login() for external wallet");
        login();
      }
    }, 150);
  }, [authenticated, linkWallet, login, setWalletConnecting, hideModal, setModalError, setWalletPreference]);

  // ── Button labels ───────────────────────────────────────────────────
  const isWaiting = ready && !authenticated && !timedOut && !cleaning;

  let embeddedLabel = "Create a wallet for me";
  let embeddedSublabel = "No app needed. We handle fees and approvals automatically.";
  if (creating) {
    embeddedLabel = "Creating wallet...";
    embeddedSublabel = "Please wait while we set up your wallet";
  } else if (cleaning) {
    embeddedLabel = "Preparing...";
    embeddedSublabel = "Clearing previous session";
  } else if (isWaiting) {
    embeddedLabel = "Connecting...";
    embeddedSublabel = "Setting up secure wallet service";
  }

  return (
    <motion.div
      key="wallet-choice-step"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col items-center text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-[var(--landing-accent)]/10 flex items-center justify-center mb-6">
        <Wallet className="w-6 h-6 text-[var(--landing-accent)]" />
      </div>

      <h2 className="landing-display text-2xl font-bold text-[var(--landing-heading)] mb-2">
        Set up your wallet
      </h2>
      <p className="text-sm text-[var(--landing-muted)] mb-6 max-w-xs">
        Choose how you want to send and receive payments
      </p>

      <div className="w-full max-w-sm space-y-3">
        {/* Option 1: Embedded wallet (recommended) */}
        <button
          type="button"
          onClick={handleCreateEmbedded}
          disabled={creating || isWaiting || cleaning}
          className="
            relative w-full text-left rounded-xl p-4
            border-2 border-[var(--landing-accent)]/30
            bg-[var(--landing-accent)]/5
            hover:border-[var(--landing-accent)]/60
            hover:bg-[var(--landing-accent)]/10
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[var(--landing-accent)]/40
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          <div className="absolute -top-2.5 left-3 px-2 py-0.5 bg-[var(--landing-accent)] rounded-full">
            <span className="text-[10px] font-semibold text-white uppercase tracking-wider">
              Recommended
            </span>
          </div>

          <div className="flex items-start gap-3 mt-1">
            <div className="w-10 h-10 rounded-lg bg-[var(--landing-accent)]/10 flex items-center justify-center shrink-0">
              {creating || isWaiting || cleaning ? (
                <Loader2 className="w-5 h-5 text-[var(--landing-accent)] animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 text-[var(--landing-accent)]" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--landing-heading)]">
                {embeddedLabel}
              </p>
              <p className="text-xs text-[var(--landing-muted)] mt-0.5">
                {embeddedSublabel}
              </p>
            </div>
          </div>
        </button>

        {/* Option 2: External wallet — always available */}
        <button
          type="button"
          onClick={handleConnectExternal}
          disabled={creating || connecting || cleaning}
          className="
            w-full text-left rounded-xl p-4
            border border-[var(--landing-input-border)]
            bg-[var(--landing-input-bg)]
            hover:border-[var(--landing-accent)]/40
            hover:bg-[var(--landing-card-bg)]
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[var(--landing-accent)]/40
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--landing-input-bg)] border border-[var(--landing-input-border)] flex items-center justify-center shrink-0">
              <ExternalLink className="w-5 h-5 text-[var(--landing-muted)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--landing-heading)]">
                I have my own wallet
              </p>
              <p className="text-xs text-[var(--landing-muted)] mt-0.5">
                Connect MetaMask, Coinbase Wallet, or any WalletConnect-compatible wallet.
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-1.5 mt-5">
        <Shield className="w-3 h-3 text-[var(--landing-muted)]" />
        <p className="text-[11px] text-[var(--landing-muted)]">
          You can always add or change wallets later in settings
        </p>
      </div>
    </motion.div>
  );
};

export default WalletChoiceStep;
