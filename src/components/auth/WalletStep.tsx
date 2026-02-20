"use client";

import React, { useCallback } from "react";
import { Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthModalStore } from "@/stores/authModalStore";

const WalletStep = () => {
  const { login, ready, authenticated } = usePrivy();
  const closeAuthModal = useAuthModalStore((s) => s.closeAuthModal);
  const setWalletConnecting = useAuthModalStore((s) => s.setWalletConnecting);

  const handleConnect = useCallback(() => {
    if (!ready) {
      console.log("[WalletStep] Privy not ready yet");
      return;
    }
    
    console.log("[WalletStep] Starting wallet connection flow");
    console.log("[WalletStep] Privy authenticated:", authenticated);
    
    // Flag that we're in wallet-connection mode (PrivyWalletListener will pick up the result)
    setWalletConnecting(true);
    // Close our modal so Privy's portal has zero z-index conflicts
    closeAuthModal();
    // Let our modal fully unmount, then trigger Privy's wallet modal
    console.log("[WalletStep] Opening Privy login modal");
    setTimeout(() => {
      login();
    }, 200);
  }, [ready, authenticated, login, closeAuthModal, setWalletConnecting]);

  return (
    <motion.div
      key="wallet-step"
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
        Connect your wallet
      </h2>
      <p className="text-sm text-[var(--landing-muted)] mb-8 max-w-xs">
        Link a crypto wallet to your account. This is how you&apos;ll send and receive funds.
      </p>

      <button
        type="button"
        onClick={handleConnect}
        disabled={!ready}
        className="
          w-full max-w-sm flex items-center justify-center gap-2
          rounded-xl py-3.5 text-base font-semibold
          text-white bg-[var(--landing-accent)] hover:bg-[var(--landing-accent-hover)]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--landing-accent)]/40
        "
      >
        <Wallet className="w-5 h-5" />
        {!ready ? "Loading..." : "Connect Wallet"}
      </button>

      <p className="mt-6 text-xs text-[var(--landing-muted)] max-w-xs">
        We support MetaMask, Coinbase Wallet, Phantom, and other Ethereum-compatible wallets.
      </p>
    </motion.div>
  );
};

export default WalletStep;
