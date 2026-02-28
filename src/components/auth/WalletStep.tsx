"use client";

import React, { useCallback, useState } from "react";
import { Wallet, LinkIcon, Copy, Check, Unplug, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { useDisconnect } from "wagmi";
import { useAuthModalStore } from "@/stores/authModalStore";
import { useAuthStore } from "@/stores/authStore";
import { useWalletStore } from "@/lib/useWallet";
import WalletConnection from "../wallet-connection/wallet-connection";

const WalletStep = () => {
  const setWalletConnecting = useAuthModalStore((s) => s.setWalletConnecting);
  const hideModal = useAuthModalStore((s) => s.hideModal);
  const setModalError = useAuthModalStore((s) => s.setErrorMessage);
  const errorMessage = useAuthModalStore((s) => s.errorMessage);

  const { authenticated, user, logout: privyLogout } = usePrivy();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { disconnect: storeDisconnect } = useWalletStore();
  const isOtpVerified = useAuthStore((s) => s.isOtpVerified);
  const walletAddress = user?.wallet?.address ?? null;

  const [copied, setCopied] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // True when Privy already has a connected wallet but we haven't
  // registered it with our backend yet.
  const walletAlreadyConnected = !!(authenticated && walletAddress && isOtpVerified);

  const handleCopyAddress = useCallback(async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for insecure context
      const el = document.createElement("textarea");
      el.value = walletAddress;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [walletAddress]);

  const handleDisconnectWallet = useCallback(async () => {
    setDisconnecting(true);
    setModalError(null);
    try {
      await privyLogout();
    } catch (e) {
      console.warn("[WalletStep] Privy logout error (non-fatal):", e);
    }
    wagmiDisconnect();
    storeDisconnect();
    if (typeof window !== "undefined") {
      localStorage.removeItem("wallet-storage");
    }
    setDisconnecting(false);
  }, [privyLogout, wagmiDisconnect, storeDisconnect, setModalError]);

  const handleConnect = useCallback((login: () => void) => {
    setModalError(null);
    setWalletConnecting(true);
    // Hide our modal (keeps walletConnecting=true) so it doesn't conflict
    // with Privy's overlay. PrivyWalletListener will re-open the modal at
    // "wallet-linking" once the API call starts.
    hideModal();
    setTimeout(() => {
      login();
    }, 150);
  }, [setWalletConnecting, hideModal, setModalError]);

  /** When the wallet is already connected via Privy, just flip the
   *  walletConnecting flag — PrivyWalletListener will pick it up
   *  immediately since all 4 conditions are already met. */
  const handleLinkExistingWallet = useCallback(() => {
    setModalError(null);
    setWalletConnecting(true);
  }, [setWalletConnecting, setModalError]);

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
      <p className="text-sm text-[var(--landing-muted)] mb-4 max-w-xs">
        Link a crypto wallet to your account. This is how you&apos;ll send and receive funds.
      </p>

      {/* Error message */}
      {errorMessage && (
        <div className="w-full max-w-sm mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/20 px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 dark:text-red-400 text-left">{errorMessage}</p>
        </div>
      )}

      {walletAlreadyConnected ? (
        /* Wallet already connected via Privy — just needs backend registration */
        <div className="w-full max-w-sm space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--landing-input-border)] bg-[var(--landing-input-bg)] px-4 py-3">
            <Wallet className="w-4 h-4 text-[var(--landing-accent)] shrink-0" />
            <button
              type="button"
              onClick={handleCopyAddress}
              title="Copy full address"
              className="flex items-center gap-1.5 text-sm text-[var(--landing-heading)] font-mono truncate hover:text-[var(--landing-accent)] transition-colors cursor-pointer"
            >
              {walletAddress!.slice(0, 6)}…{walletAddress!.slice(-4)}
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 opacity-50" />
              )}
            </button>
            <span className="ml-auto text-xs text-green-600 font-medium">Connected</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDisconnectWallet}
              disabled={disconnecting}
              className="
                flex-1 flex items-center justify-center gap-2
                rounded-lg px-4 py-3 text-sm font-medium
                text-[var(--landing-muted)] bg-[var(--landing-input-bg)]
                border border-[var(--landing-input-border)]
                hover:text-red-500 hover:border-red-300 dark:hover:border-red-700
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-red-400/30
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <Unplug className="w-4 h-4" />
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </button>
            <button
              type="button"
              onClick={handleLinkExistingWallet}
              className="
                flex-[2] flex items-center justify-center gap-2
                rounded-lg px-4 py-3 text-sm font-semibold
                text-white bg-[var(--landing-accent)] hover:bg-[var(--landing-accent-hover)]
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-[var(--landing-accent)]/40
              "
            >
              <LinkIcon className="w-4 h-4" />
              Link Wallet
            </button>
          </div>
        </div>
      ) : (
        /* No wallet connected yet — show the standard Privy connect flow */
        <WalletConnection
          isMobile={false}
          isHero={false}
          showDebugBanner={false}
          
          onConnectWalletClick={handleConnect}
          buttonClassName="
            w-full max-w-sm justify-center
            rounded-lg px-6 py-3.5 text-base font-semibold
            focus:outline-none focus:ring-2 focus:ring-[var(--landing-accent)]/40
          "
        />
      )}

      <p className="mt-6 text-xs text-[var(--landing-muted)] max-w-xs">
        We support MetaMask, Coinbase Wallet, Phantom, and other Ethereum-compatible wallets.
      </p>
    </motion.div>
  );
};

export default WalletStep;
