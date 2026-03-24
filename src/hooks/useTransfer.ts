"use client";

import { useWallets } from "@privy-io/react-auth";
import { useGaslessTransfer } from "./useGaslessTransfer";
import { usePermitTransfer } from "./usePermitTransfer";

export type WalletPath = "embedded-gasless" | "external-permit" | "external-standard" | null;

/**
 * Unified transfer hook — detects wallet type and routes to the optimal
 * approval path:
 *
 *   1. Embedded wallet  → gasless smart account approve (paymaster pays gas)
 *   2. External wallet + permit-capable token → EIP-2612 permit (no gas for user)
 *   3. External wallet + non-permit token → standard approve (user pays gas)
 *
 * Components use `walletPath` to show contextual UX messaging.
 */
export function useTransfer() {
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const externalWallet = wallets.find((w) => w.walletClientType !== "privy");

  const { gaslessApprove, smartWalletReady } = useGaslessTransfer();
  const { collectPermitSignature, hasExternalWallet } = usePermitTransfer();

  /**
   * Determine the optimal approval path based on wallet type and token support.
   */
  function getWalletPath(supportsPermit: boolean): WalletPath {
    if (embeddedWallet && smartWalletReady) return "embedded-gasless";
    if (externalWallet && supportsPermit) return "external-permit";
    if (externalWallet) return "external-standard";
    return null;
  }

  /**
   * Execute the approve via the optimal path.
   * Returns the txHash for gasless/standard, or permit data for permit path.
   */
  async function approveViaOptimalPath(params: {
    tokenAddress: `0x${string}`;
    spenderAddress: `0x${string}`;
    amount: string;
    decimals?: number;
    supportsPermit: boolean;
    chainId: number;
    rpcUrl: string;
    /** Fallback: standard wagmi approve (existing flow) */
    fallbackApprove: (spender: string, amount: string) => Promise<string | null>;
  }): Promise<{ method: WalletPath; txHash?: string; permitData?: any }> {
    const path = getWalletPath(params.supportsPermit);

    if (path === "embedded-gasless") {
      const txHash = await gaslessApprove({
        tokenAddress: params.tokenAddress,
        spenderAddress: params.spenderAddress,
        amount: params.amount,
        decimals: params.decimals,
      });
      return { method: "embedded-gasless", txHash };
    }

    if (path === "external-permit") {
      const permitData = await collectPermitSignature({
        tokenAddress: params.tokenAddress,
        spenderAddress: params.spenderAddress,
        amount: params.amount,
        chainId: params.chainId,
        rpcUrl: params.rpcUrl,
        decimals: params.decimals,
      });
      return { method: "external-permit", permitData };
    }

    // Standard path — user pays gas via existing wagmi flow
    const txHash = await params.fallbackApprove(
      params.spenderAddress,
      params.amount,
    );
    return { method: "external-standard", txHash: txHash ?? undefined };
  }

  const walletType = embeddedWallet ? "embedded" : externalWallet ? "external" : null;

  return {
    approveViaOptimalPath,
    getWalletPath,
    walletType,
    embeddedWallet,
    externalWallet,
  };
}
