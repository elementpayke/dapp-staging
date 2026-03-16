"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import { Wallet, Sparkles, ExternalLink, Loader2, Shield, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthModalStore } from "@/stores/authModalStore";
import { useAuthStore } from "@/stores/authStore";

/** How long to wait for Privy to authenticate before showing an error. */
const AUTH_TIMEOUT_MS = 15_000;

/**
 * Wallet choice step — shown after OTP verification.
 * Offers two options:
 *   1. Create an embedded wallet (recommended) — requires Privy JWT auth
 *   2. Connect an external wallet (MetaMask, WalletConnect, etc.)
 *
 * After selecting external, the user moves to the wallet step.
 * After selecting embedded, createWallet is called directly.
 */
const WalletChoiceStep = () => {
  const { createWallet, authenticated, ready, user } = usePrivy();
  const setStep = useAuthModalStore((s) => s.setStep);
  const setWalletConnecting = useAuthModalStore((s) => s.setWalletConnecting);
  const setModalError = useAuthModalStore((s) => s.setErrorMessage);
  const setWalletPreference = useAuthStore((s) => s.setWalletPreference);

  const [creating, setCreating] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Privy must finish JWT authentication before embedded wallet creation
  const privyReady = ready && authenticated;
  const isWaiting = ready && !authenticated && !timedOut;

  // Check if the user already has an embedded wallet from a previous session
  const hasExistingWallet = !!user?.wallet?.address;

  // Start a timeout when the component mounts. If Privy doesn't authenticate
  // within AUTH_TIMEOUT_MS, show an error state instead of spinning forever.
  useEffect(() => {
    if (privyReady || timedOut) return;
    timerRef.current = setTimeout(() => setTimedOut(true), AUTH_TIMEOUT_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [privyReady, timedOut]);

  // Clear timeout and recover from timedOut state when Privy authenticates
  useEffect(() => {
    if (privyReady) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      // Recover: if timeout already fired but Privy eventually authenticated,
      // flip back so the button becomes usable.
      if (timedOut) setTimedOut(false);
    }
  }, [privyReady, timedOut]);

  const handleCreateEmbedded = useCallback(async () => {
    if (!privyReady) {
      if (timedOut) {
        setModalError("Wallet service failed to connect. Please try again later or use an external wallet.");
      } else {
        setModalError("Wallet service is still connecting. Please wait a moment.");
      }
      return;
    }
    setCreating(true);
    setModalError(null);
    setWalletPreference("embedded");
    try {
      // If the user already has an embedded wallet, just proceed —
      // no need to call createWallet() again.
      if (!hasExistingWallet) {
        await createWallet();
      }
      setWalletConnecting(true);
    } catch (err: any) {
      console.error("[WalletChoiceStep] Failed to set up embedded wallet:", err);
      setModalError(err?.message ?? "Failed to set up wallet. Please try again.");
      setCreating(false);
    }
  }, [privyReady, timedOut, hasExistingWallet, createWallet, setWalletConnecting, setModalError, setWalletPreference]);

  const handleConnectExternal = useCallback(() => {
    setModalError(null);
    setWalletPreference("external");
    setStep("wallet");
  }, [setStep, setModalError, setWalletPreference]);

  // Derive the embedded button label and sublabel
  let embeddedLabel = hasExistingWallet ? "Use my Element wallet" : "Create a wallet for me";
  let embeddedSublabel = hasExistingWallet
    ? "Continue with your existing wallet. No setup needed."
    : "No app needed. We handle fees and approvals automatically.";
  if (creating) {
    embeddedLabel = hasExistingWallet ? "Connecting wallet..." : "Creating wallet...";
    embeddedSublabel = "Please wait while we set up your wallet";
  } else if (isWaiting) {
    embeddedLabel = "Connecting...";
    embeddedSublabel = "Setting up secure wallet service";
  } else if (timedOut && !privyReady) {
    embeddedLabel = "Service unavailable";
    embeddedSublabel = "Wallet service failed to connect — try again later";
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
          disabled={creating || isWaiting}
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
              ) : timedOut && !privyReady ? (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
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
          disabled={creating}
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
