"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import { Wallet, LinkIcon, Copy, Check, Unplug, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { useDisconnect } from "wagmi";
import { useAuthModalStore } from "@/stores/authModalStore";
import { useAuthStore } from "@/stores/authStore";
import { useAuthSyncStore } from "@/stores/authSyncStore";
import { useWalletStore } from "@/lib/useWallet";
import WalletConnection from "../wallet-connection/wallet-connection";

/** How long to wait for Privy to authenticate before showing fallback options */
const AUTH_TIMEOUT_MS = 12_000;

const WalletStep = () => {
  const setWalletConnecting = useAuthModalStore((s) => s.setWalletConnecting);
  const hideModal = useAuthModalStore((s) => s.hideModal);
  const setModalError = useAuthModalStore((s) => s.setErrorMessage);
  const errorMessage = useAuthModalStore((s) => s.errorMessage);

  const { authenticated, ready, user, logout: privyLogout, linkWallet, login } = usePrivy();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { disconnect: storeDisconnect } = useWalletStore();
  const isOtpVerified = useAuthStore((s) => s.isOtpVerified);
  const walletAddress = user?.wallet?.address ?? null;

  const authSyncStatus = useAuthSyncStore((s) => s.status);

  const [copied, setCopied] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const privyReady = ready && authenticated;

  // Timeout: if Privy doesn't authenticate within AUTH_TIMEOUT_MS, allow fallback
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
    if (authSyncStatus === "failed" && !privyReady) {
      setTimedOut(true);
    }
  }, [authSyncStatus, privyReady]);

  // Whether to show the loading spinner (only while waiting, not timed out)
  const showAuthSpinner = isOtpVerified && !authenticated && !timedOut;

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

  const handleConnect = useCallback(() => {
    setModalError(null);
    setWalletConnecting(true);
    // Hide our modal (keeps walletConnecting=true) so it doesn't conflict
    // with Privy's overlay. PrivyWalletListener will re-open the modal at
    // "wallet-linking" once the API call starts.
    hideModal();
    setTimeout(() => {
      // When already authenticated via custom JWT, use linkWallet().
      // When auth timed out / failed, fall back to login() which
      // opens Privy's own wallet-connect modal (bypassing JWT auth).
      if (authenticated) {
        console.log("[WalletStep] Calling linkWallet() for external wallet connection");
        linkWallet();
      } else {
        console.log("[WalletStep] Privy not authenticated — calling login() for wallet connection");
        login();
      }
    }, 150);
  }, [setWalletConnecting, hideModal, setModalError, linkWallet, login, authenticated]);

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

      {/* Privy is still authenticating via custom JWT — show a loading state */}
      {showAuthSpinner ? (
        <div className="w-full max-w-sm flex flex-col items-center py-6">
          <svg className="animate-spin h-6 w-6 text-[var(--landing-accent)] mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-[var(--landing-muted)]">Preparing wallet connection&hellip;</p>
        </div>
      ) : timedOut && !authenticated ? (
        /* Privy auth timed out — show fallback options so the user isn't stuck */
        <div className="w-full max-w-sm space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/20 px-3 py-2.5 mb-3">
            <RefreshCw className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400 text-left">
              Wallet service is taking longer than expected. You can still connect an external wallet below.
            </p>
          </div>
          <WalletConnection
            isMobile={false}
            isHero={false}
            showDebugBanner={false}
            onConnectWalletClick={() => handleConnect()}
            buttonClassName="
              w-full max-w-sm justify-center
              rounded-lg px-6 py-3.5 text-base font-semibold
              focus:outline-none focus:ring-2 focus:ring-[var(--landing-accent)]/40
            "
          />
        </div>
      ) : walletAlreadyConnected ? (
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
          
          onConnectWalletClick={() => handleConnect()}
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
