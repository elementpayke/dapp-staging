import { getAddress, type Address } from "viem";

import {
  DEFAULT_SPONSORED_WITHDRAW_CHAIN_KEY,
  SUPPORTED_SPONSORED_WITHDRAW_CHAINS,
  getPrivySponsoredWithdrawChainConfig,
} from "@/lib/privy-sponsorship/chains";
import type {
  PrivySponsoredWithdrawConfigResponse,
  SponsoredWithdrawChainKey,
} from "@/lib/privy-sponsorship/types";

const LIQUIDATION_WALLET_ENV_BY_CHAIN: Record<SponsoredWithdrawChainKey, string[]> =
  {
    base: [
      "LIQUIDATION_WALLET_ADDRESS_BASE",
      "NEXT_PUBLIC_LIQUIDATION_WALLET_ADDRESS_BASE",
      "LIQUIDATION_WALLET_ADDRESS",
      "NEXT_PUBLIC_LIQUIDATION_WALLET_ADDRESS",
      "NEXT_PUBLIC_CONTRACT_ADDRESS_BASE",
    ],
    arbitrum: [
      "LIQUIDATION_WALLET_ADDRESS_ARBITRUM",
      "NEXT_PUBLIC_LIQUIDATION_WALLET_ADDRESS_ARBITRUM",
      "LIQUIDATION_WALLET_ADDRESS",
      "NEXT_PUBLIC_LIQUIDATION_WALLET_ADDRESS",
      "NEXT_PUBLIC_CONTRACT_ADDRESS_ARBITRUM",
    ],
    polygon: [
      "LIQUIDATION_WALLET_ADDRESS_POLYGON",
      "NEXT_PUBLIC_LIQUIDATION_WALLET_ADDRESS_POLYGON",
      "LIQUIDATION_WALLET_ADDRESS",
      "NEXT_PUBLIC_LIQUIDATION_WALLET_ADDRESS",
      "NEXT_PUBLIC_CONTRACT_ADDRESS_POLYGON",
    ],
    ethereum: [
      "LIQUIDATION_WALLET_ADDRESS_ETHEREUM",
      "NEXT_PUBLIC_LIQUIDATION_WALLET_ADDRESS_ETHEREUM",
      "LIQUIDATION_WALLET_ADDRESS_MAINNET",
      "NEXT_PUBLIC_LIQUIDATION_WALLET_ADDRESS_MAINNET",
      "LIQUIDATION_WALLET_ADDRESS",
      "NEXT_PUBLIC_LIQUIDATION_WALLET_ADDRESS",
      "NEXT_PUBLIC_CONTRACT_ADDRESS_ETHEREUM",
      "NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET",
      "NEXT_PUBLIC_CONTRACT_ADDRESS",
    ],
  };

const getPrivyAppSecret = (): string => {
  const secret =
    process.env.NEXT_PRIVATE_PRIVY_APP_SECRET?.trim() ||
    process.env.NEXT_PUBLIC_PRIVY_APP_SECRET?.trim();

  if (!secret) {
    throw new Error(
      "Missing NEXT_PRIVATE_PRIVY_APP_SECRET. Configure the Privy app secret before using sponsored withdrawals.",
    );
  }

  return secret;
};

const resolveLiquidationWalletAddress = (
  chainKey: SponsoredWithdrawChainKey,
): Address => {
  const envNames = LIQUIDATION_WALLET_ENV_BY_CHAIN[chainKey];

  for (const envName of envNames) {
    const rawValue = process.env[envName]?.trim();

    if (!rawValue) {
      continue;
    }

    try {
      return getAddress(rawValue);
    } catch {
      throw new Error(
        `Environment variable ${envName} is not a valid EVM address.`,
      );
    }
  }

  throw new Error(
    `Missing liquidation wallet address for ${chainKey}. Configure one of: ${envNames.join(", ")}.`,
  );
};

export const parseSponsoredWithdrawChainKey = (
  value: string | null | undefined,
): SponsoredWithdrawChainKey => {
  if (!value) {
    return DEFAULT_SPONSORED_WITHDRAW_CHAIN_KEY;
  }

  if (
    !SUPPORTED_SPONSORED_WITHDRAW_CHAINS.includes(
      value as SponsoredWithdrawChainKey,
    )
  ) {
    throw new Error(`Unsupported sponsorship chain: ${value}`);
  }

  return value as SponsoredWithdrawChainKey;
};

export const getPrivySponsoredWithdrawRuntimeConfig = (
  chainKey: SponsoredWithdrawChainKey = DEFAULT_SPONSORED_WITHDRAW_CHAIN_KEY,
): PrivySponsoredWithdrawConfigResponse => {
  getPrivyAppSecret();
  const chainConfig = getPrivySponsoredWithdrawChainConfig(chainKey);

  return {
    chainId: chainConfig.chainId,
    chainKey,
    chainName: chainConfig.chainName,
    liquidationWalletAddress: resolveLiquidationWalletAddress(chainKey),
    supportedTokens: chainConfig.supportedTokens,
  };
};
