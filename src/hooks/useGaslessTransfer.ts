"use client";

import { useMemo } from "react";
import { useSendTransaction, useWallets } from "@privy-io/react-auth";
import { encodeFunctionData, erc20Abi, parseUnits } from "viem";
import { useAuthStore } from "@/stores/authStore";

/**
 * Gasless transfer hook for embedded wallet users.
 *
 * Uses Privy's `useSendTransaction` with `sponsor: true` — the same proven
 * path that the offramp sponsored approval uses. Gas is paid by Privy's
 * built-in sponsorship policy, NOT via the ERC-4337 smart wallet client.
 */

export function useGaslessTransfer() {
  const { sendTransaction } = useSendTransaction();
  const { wallets } = useWallets();
  const walletPreference = useAuthStore((s) => s.walletPreference);

  const embeddedWallet = useMemo(
    () => wallets.find((w) => w.walletClientType === "privy") ?? null,
    [wallets],
  );

  const smartWalletReady = Boolean(
    embeddedWallet && walletPreference === "embedded",
  );

  /**
   * Execute a gasless ERC-20 `approve()` via Privy-sponsored tx.
   * Gas is covered by Privy's sponsorship policy — user pays nothing.
   */
  async function gaslessApprove(params: {
    tokenAddress: `0x${string}`;
    spenderAddress: `0x${string}`;
    amount: string;
    decimals?: number;
    chainId?: number;
  }): Promise<string> {
    if (!embeddedWallet || !smartWalletReady) {
      throw new Error("Embedded wallet not ready. Please try again.");
    }

    const decimals = params.decimals ?? 6;
    const callData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [params.spenderAddress, parseUnits(params.amount, decimals)],
    });

    const { hash } = await sendTransaction(
      {
        to: params.tokenAddress,
        data: callData,
        from: embeddedWallet.address,
        chainId: params.chainId,
        value: 0,
      },
      {
        address: embeddedWallet.address,
        sponsor: true,
        uiOptions: { showWalletUIs: false },
      },
    );

    return hash;
  }

  /**
   * Execute a gasless ERC-20 `transfer()` via Privy-sponsored tx.
   * Gas is covered by Privy's sponsorship policy — user pays nothing.
   */
  async function gaslessTransfer(params: {
    tokenAddress: `0x${string}`;
    recipient: `0x${string}`;
    amount: string;
    decimals?: number;
    chainId?: number;
  }): Promise<string> {
    if (!embeddedWallet || !smartWalletReady) {
      throw new Error("Embedded wallet not ready. Please try again.");
    }

    const decimals = params.decimals ?? 6;
    const callData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [params.recipient, parseUnits(params.amount, decimals)],
    });

    const { hash } = await sendTransaction(
      {
        to: params.tokenAddress,
        data: callData,
        from: embeddedWallet.address,
        chainId: params.chainId,
        value: 0,
      },
      {
        address: embeddedWallet.address,
        sponsor: true,
        uiOptions: { showWalletUIs: false },
      },
    );

    return hash;
  }

  return {
    gaslessApprove,
    gaslessTransfer,
    smartWalletReady,
  };
}
