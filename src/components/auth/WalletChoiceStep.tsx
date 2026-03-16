"use client";

import React, { useCallback, useState } from "react";
import { Wallet, Sparkles, ExternalLink, Loader2, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAuthModalStore } from "@/stores/authModalStore";

/**
 * Wallet choice step — shown after OTP verification.
 * Offers two options:
 *   1. Create an embedded wallet (recommended) — no extension needed
 *   2. Connect an external wallet (MetaMask, WalletConnect, etc.)
 *
 * After selecting external and connecting, the PrivyWalletListener
 * picks up the wallet address and handles backend registration.
 */
const WalletChoiceStep = () => {
  const { createWallet, connectWallet } = usePrivy();
  const { wallets } = useWallets();
  const setStep = useAuthModalStore((s) => s.setStep);
  const setWalletConnecting = useAuthModalStore((s) => s.setWalletConnecting);
  const hideModal = useAuthModalStore((s) => s.hideModal);
  const setModalError = useAuthModalStore((s) => s.setErrorMessage);

  const [creating, setCreating] = useState(false);

  const handleCreateEmbedded = useCallback(async () => {
    setCreating(true);
    setModalError(null);
    try {
      await createWallet();
      // Embedded wallet created. Now trigger wallet registration flow.
      setWalletConnecting(true);
    } catch (err: any) {
      console.error("[WalletChoiceStep] Failed to create embedded wallet:", err);
      setModalError(err?.message ?? "Failed to create wallet. Please try again.");
      setCreating(false);
    }
  }, [createWallet, setWalletConnecting, setModalError]);

  const handleConnectExternal = useCallback(() => {
    setModalError(null);
    setWalletConnecting(true);
    // Hide our modal so Privy's connect modal can take over
    hideModal();
    setTimeout(() => {
      connectWallet();
    }, 150);
  }, [connectWallet, setWalletConnecting, hideModal, setModalError]);

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
          disabled={creating}
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
              {creating ? (
                <Loader2 className="w-5 h-5 text-[var(--landing-accent)] animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 text-[var(--landing-accent)]" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--landing-heading)]">
                Create a wallet for me
              </p>
              <p className="text-xs text-[var(--landing-muted)] mt-0.5">
                No app needed. We handle fees and approvals automatically.
              </p>
            </div>
          </div>
        </button>

        {/* Option 2: External wallet */}
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
