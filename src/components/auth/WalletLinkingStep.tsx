"use client";

import React, { useCallback, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { motion } from "framer-motion";
import { useDisconnect } from "wagmi";
import { useAuthModalStore } from "@/stores/authModalStore";
import { useAuthStore } from "@/stores/authStore";
import { useWalletStore } from "@/lib/useWallet";

/**
 * WalletLinkingStep — displayed inside the auth modal while the
 * connect-wallet API call is in-flight.
 *
 * Shows an animated spinner ring, shield icon, and pulsing status dots
 * so the user knows their wallet is being verified on-chain.
 *
 * Users can cancel the linking — this disconnects the wallet and returns
 * to the wallet selection step.
 */
const WalletLinkingStep = () => {
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { disconnect: storeDisconnect } = useWalletStore();
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = useCallback(async () => {
    setCancelling(true);
    const m = useAuthModalStore.getState();

    // Reset walletConnecting first — PrivyWalletListener's .then()/.catch()
    // will check this and bail out, effectively cancelling the operation.
    m.setWalletConnecting(false);
    useAuthStore.getState().setWalletPreference(null);

    // Keep the Privy JWT session intact. We only clear the active wallet
    // attempt so the user can choose a different wallet.
    wagmiDisconnect();
    storeDisconnect();
    if (typeof window !== "undefined") {
      localStorage.removeItem("wallet-storage");
    }

    // Return to wallet-choice step so user can retry
    m.setStep("wallet-choice");
    setCancelling(false);
  }, [wagmiDisconnect, storeDisconnect]);

  return (
    <motion.div
      key="wallet-linking-step"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center text-center py-4"
    >
      {/* Animated spinner ring */}
      <div className="relative w-20 h-20 mb-8">
        {/* Outer spinning ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-[3px] border-transparent"
          style={{
            borderTopColor: "var(--landing-accent)",
            borderRightColor: "var(--landing-accent)",
          }}
        />
        {/* Inner pulsing glow */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-2 rounded-full bg-[var(--landing-accent)]/10"
        />
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-[var(--landing-accent)]" />
        </div>
      </div>

      <h2 className="landing-display text-xl font-bold text-[var(--landing-heading)] mb-2">
        Verifying your wallet
      </h2>
      <p className="text-sm text-[var(--landing-muted)] mb-6 max-w-xs">
        We&apos;re securely linking your wallet to your account. This usually takes just a moment.
      </p>

      {/* Pulsing dots */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
            className="w-2 h-2 rounded-full bg-[var(--landing-accent)]"
          />
        ))}
      </div>

      {/* Cancel button */}
      <button
        type="button"
        onClick={handleCancel}
        disabled={cancelling}
        className="
          mt-6 flex items-center gap-1.5
          text-xs text-[var(--landing-muted)] hover:text-red-500
          transition-colors cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        <X className="w-3.5 h-3.5" />
        {cancelling ? "Cancelling…" : "Cancel linking"}
      </button>
    </motion.div>
  );
};

export default WalletLinkingStep;
