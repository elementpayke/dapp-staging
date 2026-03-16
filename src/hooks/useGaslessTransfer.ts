"use client";

import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { encodeFunctionData, parseUnits } from "viem";
import { getTokenConfig } from "@/constants/tokenConfig";

/**
 * Gasless transfer hook for embedded wallet users.
 *
 * Uses Privy's smart wallet client (ERC-4337) so a paymaster covers gas.
 * The user never pays for gas — the `approve()` call is sponsored.
 *
 * After approval, calls the backend to create the order + trigger MPesa payout.
 */

const ERC20_APPROVE_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export function useGaslessTransfer() {
  const { client: smartWalletClient } = useSmartWallets();

  /**
   * Execute a gasless ERC-20 `approve()` via the smart wallet.
   * Gas is paid by the configured paymaster — user sees no gas popup.
   *
   * @returns Transaction hash of the sponsored approve
   */
  async function gaslessApprove(params: {
    tokenAddress: `0x${string}`;
    spenderAddress: `0x${string}`;
    amount: string;
    decimals?: number;
  }): Promise<string> {
    if (!smartWalletClient) {
      throw new Error("Smart wallet not ready. Please try again.");
    }

    const decimals = params.decimals ?? 6;
    const approveCalldata = encodeFunctionData({
      abi: ERC20_APPROVE_ABI,
      functionName: "approve",
      args: [params.spenderAddress, parseUnits(params.amount, decimals)],
    });

    const txHash = await smartWalletClient.sendTransaction({
      to: params.tokenAddress,
      data: approveCalldata,
    });

    return txHash;
  }

  return {
    gaslessApprove,
    smartWalletReady: !!smartWalletClient,
  };
}
