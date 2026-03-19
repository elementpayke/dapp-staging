"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import { Wallet, Sparkles, ExternalLink, Loader2, Shield, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { useDisconnect } from "wagmi";
import { useAuthModalStore } from "@/stores/authModalStore";
import { useAuthStore } from "@/stores/authStore";
import { hasEmbeddedPrivyWallet } from "@/lib/privy-wallet-selection";
import { useWalletStore } from "@/lib/useWallet";

/** How long to wait for Privy authentication before showing fallback. */
const AUTH_TIMEOUT_MS = 15_000;

/**
 * Wallet choice step — shown after OTP verification.
 * Offers two options:
 *   1. Create an embedded wallet (recommended)
 *   2. Connect an external wallet — triggers Privy's linkWallet() popup directly
 *
 * Both buttons become active once Privy authenticates via custom JWT.
 * If authentication times out, a "Try another way" fallback appears that
 * uses Privy's native login() — only triggered by explicit user click.
 */
const WalletChoiceStep = () => {
  const { createWallet, authenticated, ready, user, login, linkWallet } = usePrivy();
  const setWalletConnecting = useAuthModalStore((s) => s.setWalletConnecting);
  const hideModal = useAuthModalStore((s) => s.hideModal);
  const setModalError = useAuthModalStore((s) => s.setErrorMessage);
  const startExternalWalletSelection = useAuthModalStore((s) => s.startExternalWalletSelection);
  const setWalletPreference = useAuthStore((s) => s.setWalletPreference);
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { disconnect: storeDisconnect } = useWalletStore();
  const hasEmbeddedWallet = hasEmbeddedPrivyWallet(user);
  const hasExistingEmbeddedWallet = hasEmbeddedWallet || Boolean(user?.wallet?.address);

  const [creating, setCreating] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Privy JWT auth succeeded — safe to call createWallet / linkWallet
  const privyReady = ready && authenticated;
  // Still waiting for JWT auth to complete
  const isWaiting = ready && !authenticated && !timedOut;

  // ── Timeout: show fallback if auth doesn't complete ─────────────────
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

  // ── Embedded wallet handler ─────────────────────────────────────────
  const handleCreateEmbedded = useCallback(async () => {
    if (!privyReady) return;
    setModalError(null);
    setWalletPreference("embedded");
    setCreating(true);
    try {
      if (!hasExistingEmbeddedWallet) {
        await createWallet();
      }
      setWalletConnecting(true);
    } catch (err: any) {
      console.error("[WalletChoiceStep] createWallet failed:", err);
      setModalError(err?.message ?? "Failed to create wallet. Please try again.");
      setCreating(false);
    }
  }, [privyReady, hasExistingEmbeddedWallet, createWallet, setWalletConnecting, setModalError, setWalletPreference]);

  // ── External wallet handler ─────────────────────────────────────────
  const handleConnectExternal = useCallback(() => {
    if (!authenticated) return;
    setModalError(null);
    // Clear any stale active wallet transport state before opening Privy's
    // selector so the next external wallet always comes from an explicit
    // choice in this flow, not from a previously active connection.
    wagmiDisconnect();
    storeDisconnect();
    if (typeof window !== "undefined") {
      localStorage.removeItem("wallet-storage");
    }
    startExternalWalletSelection();
    setWalletPreference("external");
    setWalletConnecting(true);
    hideModal();
    setTimeout(() => {
      console.log("[WalletChoiceStep] Calling linkWallet() for external wallet");
      linkWallet();
    }, 150);
  }, [
    authenticated,
    linkWallet,
    setWalletConnecting,
    hideModal,
    setModalError,
    startExternalWalletSelection,
    setWalletPreference,
    wagmiDisconnect,
    storeDisconnect,
  ]);

  // ── Fallback: explicit user action when JWT auth fails ──────────────
  // Only called via the "Try another way" button — NEVER automatically.
  // Opens Privy's native login/wallet-connect flow.
  const handleTryAnotherWay = useCallback(() => {
    setModalError(null);
    setWalletConnecting(true);
    hideModal();
    setTimeout(() => {
      console.log("[WalletChoiceStep] User chose fallback — calling Privy login()");
      login();
    }, 150);
  }, [login, setWalletConnecting, hideModal, setModalError]);

  // ── Button labels ───────────────────────────────────────────────────
  let embeddedLabel = hasEmbeddedWallet ? "Proceed with your Element Wallet" : "Create your Element Wallet";
  let embeddedSublabel = hasEmbeddedWallet
    ? "Use the embedded wallet already linked to your account."
    : "No app needed. We handle fees and approvals automatically.";
  if (creating) {
    embeddedLabel = hasEmbeddedWallet ? "Opening your Element Wallet..." : "Creating your Element Wallet...";
    embeddedSublabel = hasEmbeddedWallet
      ? "Please wait while we open your existing embedded wallet"
      : "Please wait while we set up your wallet";
  } else if (isWaiting) {
    embeddedLabel = "Connecting...";
    embeddedSublabel = hasEmbeddedWallet
      ? "Setting up secure wallet service for your Element Wallet"
      : "Setting up secure wallet service";
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
          disabled={creating || !privyReady}
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
              {creating || isWaiting ? (
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
          disabled={creating || !authenticated}
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
              {isWaiting ? (
                <Loader2 className="w-5 h-5 text-[var(--landing-muted)] animate-spin" />
              ) : (
                <ExternalLink className="w-5 h-5 text-[var(--landing-muted)]" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--landing-heading)]">
                I have my own wallet
              </p>
              <p className="text-xs text-[var(--landing-muted)] mt-0.5">
                {isWaiting
                  ? "Waiting for secure connection..."
                  : "Connect MetaMask, Coinbase Wallet, or any WalletConnect-compatible wallet."}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Fallback — only shown after timeout when auth hasn't completed */}
      {timedOut && !privyReady && (
        <button
          type="button"
          onClick={handleTryAnotherWay}
          className="mt-4 flex items-center gap-1.5 text-xs text-[var(--landing-accent)] hover:underline focus:outline-none"
        >
          <RefreshCw className="w-3 h-3" />
          Taking too long? Try another way
        </button>
      )}

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
