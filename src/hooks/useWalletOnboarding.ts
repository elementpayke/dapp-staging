"use client";

import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

/**
 * Wallet onboarding hook — manages the one-time wallet setup flow
 * shown after login when the user has no wallets linked.
 *
 * Two choices:
 *   1. "Create a wallet for me" → Privy embedded wallet (recommended)
 *   2. "I have my own wallet"   → Privy connect modal (MetaMask / WC)
 *
 * After connecting an external wallet, shows a secondary upsell to also
 * create an embedded wallet for gasless/automated transactions.
 */
export function useWalletOnboarding() {
  const { authenticated, createWallet, connectWallet } = usePrivy();
  const { wallets } = useWallets();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showEmbeddedUpsell, setShowEmbeddedUpsell] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (authenticated && wallets.length === 0) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [authenticated, wallets]);

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const externalWallet = wallets.find((w) => w.walletClientType !== "privy");

  async function chooseEmbeddedWallet() {
    setCreating(true);
    try {
      await createWallet();
      setShowOnboarding(false);
    } catch (err) {
      console.error("[WalletOnboarding] Failed to create embedded wallet:", err);
    } finally {
      setCreating(false);
    }
  }

  async function chooseExternalWallet() {
    try {
      connectWallet();
      setShowOnboarding(false);
      // After connecting external wallet, prompt to also add embedded
      setShowEmbeddedUpsell(true);
    } catch (err) {
      console.error("[WalletOnboarding] Failed to connect external wallet:", err);
    }
  }

  async function addEmbeddedWalletAsWell() {
    setCreating(true);
    try {
      await createWallet();
      setShowEmbeddedUpsell(false);
    } catch (err) {
      console.error("[WalletOnboarding] Failed to create additional embedded wallet:", err);
    } finally {
      setCreating(false);
    }
  }

  return {
    showOnboarding,
    showEmbeddedUpsell,
    embeddedWallet,
    externalWallet,
    creating,
    chooseEmbeddedWallet,
    chooseExternalWallet,
    addEmbeddedWalletAsWell,
    dismissUpsell: () => setShowEmbeddedUpsell(false),
  };
}
