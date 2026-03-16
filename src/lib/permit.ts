/**
 * EIP-2612 Permit utilities for gasless token approvals.
 *
 * Instead of an on-chain `approve()` transaction (which costs gas),
 * the user signs an off-chain EIP-712 typed message. The signature is
 * sent to the backend, which calls `permit()` + `transferFrom()` in
 * one transaction, paying gas on behalf of the user.
 *
 * Only works for tokens implementing EIP-2612 (USDC on Base, Scroll, etc.).
 * USDT and many older tokens do NOT support this.
 */

import { createWalletClient, custom, parseUnits } from "viem";

const PERMIT_TYPES = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

/**
 * Per-token EIP-712 domain parameters.
 * These MUST match what the token contract returns for `DOMAIN_SEPARATOR`.
 * Verify by reading the contract on the relevant block explorer.
 */
const TOKEN_DOMAINS: Record<string, { name: string; version: string }> = {
  // USDC on Base (Circle)
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913": { name: "USD Coin", version: "2" },
  // USDC on Scroll (Circle)
  "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4": { name: "USD Coin", version: "2" },
};

export interface PermitData {
  v: number;
  r: `0x${string}`;
  s: `0x${string}`;
  deadline: bigint;
  value: bigint;
}

/**
 * Collect an EIP-2612 permit signature from the user's external wallet.
 * This is a free off-chain signature — no gas is consumed.
 */
export async function signPermit(params: {
  wallet: any; // ConnectedWallet from useWallets()
  tokenAddress: `0x${string}`;
  spenderAddress: `0x${string}`;
  amount: string;
  nonce: bigint;
  chainId: number;
  decimals?: number;
}): Promise<PermitData> {
  const decimals = params.decimals ?? 6;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour
  const value = parseUnits(params.amount, decimals);

  const tokenDomain = TOKEN_DOMAINS[params.tokenAddress];
  if (!tokenDomain) {
    throw new Error(
      `Token ${params.tokenAddress} does not have EIP-712 domain configured. ` +
        `Permit is not supported for this token.`,
    );
  }

  const domain = {
    name: tokenDomain.name,
    version: tokenDomain.version,
    chainId: params.chainId,
    verifyingContract: params.tokenAddress,
  };

  const message = {
    owner: params.wallet.address as `0x${string}`,
    spender: params.spenderAddress,
    value,
    nonce: params.nonce,
    deadline,
  };

  // Switch chain if needed
  await params.wallet.switchChain(params.chainId);
  const provider = await params.wallet.getEthereumProvider();

  const walletClient = createWalletClient({
    transport: custom(provider),
  });

  const signature = await walletClient.signTypedData({
    account: params.wallet.address as `0x${string}`,
    domain,
    types: PERMIT_TYPES,
    primaryType: "Permit",
    message,
  });

  // Split signature into v, r, s
  const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
  const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
  const v = parseInt(signature.slice(130, 132), 16);

  return { v, r, s, deadline, value };
}
