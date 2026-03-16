"use client";

import { useWallets } from "@privy-io/react-auth";
import { createPublicClient, http } from "viem";
import { signPermit } from "@/lib/permit";

const NONCES_ABI = [
  {
    name: "nonces",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/**
 * Permit-based transfer hook for external wallet users.
 *
 * Replaces the on-chain `approve()` (which costs gas) with an off-chain
 * EIP-2612 permit signature (free). The backend then relays the permit +
 * transfers tokens in one transaction, paying gas itself.
 *
 * Only works for tokens that implement EIP-2612 (USDC on Base/Scroll).
 */
export function usePermitTransfer() {
  const { wallets } = useWallets();
  const externalWallet = wallets.find((w) => w.walletClientType !== "privy");

  async function collectPermitSignature(params: {
    tokenAddress: `0x${string}`;
    spenderAddress: `0x${string}`;
    amount: string;
    chainId: number;
    rpcUrl: string;
    decimals?: number;
  }) {
    if (!externalWallet) throw new Error("No external wallet connected");

    const publicClient = createPublicClient({
      transport: http(params.rpcUrl),
    });

    // Fetch the current nonce from the token contract
    const nonce = (await publicClient.readContract({
      address: params.tokenAddress,
      abi: NONCES_ABI,
      functionName: "nonces",
      args: [externalWallet.address as `0x${string}`],
    })) as bigint;

    // Collect the permit signature — user sees one small signing popup, no gas
    const permitData = await signPermit({
      wallet: externalWallet,
      tokenAddress: params.tokenAddress,
      spenderAddress: params.spenderAddress,
      amount: params.amount,
      nonce,
      chainId: params.chainId,
      decimals: params.decimals,
    });

    return {
      ownerAddress: externalWallet.address,
      permit: {
        v: permitData.v,
        r: permitData.r,
        s: permitData.s,
        deadline: permitData.deadline.toString(),
        value: permitData.value.toString(),
      },
    };
  }

  /**
   * Send the permit signature to the backend for relay execution.
   * The backend calls permit() + transferFrom() atomically, paying gas.
   */
  async function executePermitTransfer(params: {
    tokenAddress: `0x${string}`;
    spenderAddress: `0x${string}`;
    amount: string;
    chainId: number;
    rpcUrl: string;
    decimals?: number;
  }) {
    const signatureData = await collectPermitSignature(params);

    const response = await fetch("/api/execute-permit-payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerAddress: signatureData.ownerAddress,
        tokenAddress: params.tokenAddress,
        spenderAddress: params.spenderAddress,
        amount: params.amount,
        chainId: params.chainId,
        permit: signatureData.permit,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message ?? "Permit relay failed");
    }

    return response.json();
  }

  return {
    collectPermitSignature,
    executePermitTransfer,
    hasExternalWallet: !!externalWallet,
  };
}
