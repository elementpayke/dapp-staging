"use client";

import { useDelegatedActions, useWallets } from "@privy-io/react-auth";
import { useState } from "react";

/**
 * Delegation hook — allows users with embedded wallets to grant
 * backend signing authority for fully automated transactions.
 *
 * After delegation, the backend can sign and submit transactions
 * on the user's behalf without them needing to be online.
 *
 * One-time opt-in, shown after embedded wallet creation.
 */
export function useDelegation() {
  const { delegateWallet } = useDelegatedActions();
  const { wallets } = useWallets();
  const [delegating, setDelegating] = useState(false);
  const [delegated, setDelegated] = useState(false);

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");

  async function requestDelegation() {
    if (!embeddedWallet) throw new Error("No embedded wallet found");

    setDelegating(true);
    try {
      await delegateWallet({
        address: embeddedWallet.address,
        chainType: "ethereum",
      });

      // Notify our backend that this wallet is now delegated
      await fetch("/api/user/mark-delegated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: embeddedWallet.address }),
      });

      setDelegated(true);
    } catch (err) {
      console.error("[useDelegation] Delegation failed:", err);
      throw err;
    } finally {
      setDelegating(false);
    }
  }

  return {
    requestDelegation,
    embeddedWalletAddress: embeddedWallet?.address,
    hasEmbeddedWallet: !!embeddedWallet,
    delegating,
    delegated,
  };
}
