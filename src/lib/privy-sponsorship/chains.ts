import { arbitrum, base, mainnet, polygon, type Chain } from "wagmi/chains";
import type { Address } from "viem";

import { getTokenConfig } from "@/constants/tokenConfig";
import { SUPPORTED_TOKENS } from "@/constants/supportedTokens";

import type {
  PrivySponsoredWithdrawTokenSummary,
  SponsoredWithdrawChainKey,
} from "@/lib/privy-sponsorship/types";

const buildSupportedTokensForChain = (
  chainName: string,
): PrivySponsoredWithdrawTokenSummary[] => {
  return SUPPORTED_TOKENS.filter((token) => token.chain === chainName)
    .map((token) => {
      const config = getTokenConfig(token.tokenAddress);

      if (!config) {
        return null;
      }

      return {
        address: token.tokenAddress as Address,
        decimals: config.decimals,
        explorerUrl: token.explorerUrl,
        name: token.name,
        symbol: token.symbol,
        tokenLogo: token.tokenLogo,
      };
    })
    .filter((token): token is PrivySponsoredWithdrawTokenSummary => token !== null);
};

const SPONSORED_WITHDRAW_CHAIN_CONFIG = {
  base: {
    chain: base,
    chainId: base.id,
    chainName: base.name,
    rpcUrl:
      process.env.NEXT_PUBLIC_BASE_RPC_URL ??
      base.rpcUrls.default.http[0] ??
      "https://mainnet.base.org",
    supportedTokens: buildSupportedTokensForChain("Base"),
  },
  arbitrum: {
    chain: arbitrum,
    chainId: arbitrum.id,
    chainName: arbitrum.name,
    rpcUrl:
      process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL ??
      arbitrum.rpcUrls.default.http[0] ??
      "https://arb1.arbitrum.io/rpc",
    supportedTokens: buildSupportedTokensForChain("Arbitrum"),
  },
  polygon: {
    chain: polygon,
    chainId: polygon.id,
    chainName: polygon.name,
    rpcUrl:
      process.env.NEXT_PUBLIC_POLYGON_RPC_URL ??
      polygon.rpcUrls.default.http[0] ??
      "https://polygon-bor-rpc.publicnode.com",
    supportedTokens: buildSupportedTokensForChain("Polygon"),
  },
  ethereum: {
    chain: mainnet,
    chainId: mainnet.id,
    chainName: "Ethereum",
    rpcUrl:
      process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL ??
      process.env.NEXT_PUBLIC_MAINNET_RPC_URL ??
      mainnet.rpcUrls.default.http[0] ??
      "https://ethereum-rpc.publicnode.com",
    supportedTokens: buildSupportedTokensForChain("Ethereum"),
  },
} satisfies Record<
  SponsoredWithdrawChainKey,
  {
    chain: Chain;
    chainId: number;
    chainName: string;
    rpcUrl: string;
    supportedTokens: PrivySponsoredWithdrawTokenSummary[];
  }
>;

export const DEFAULT_SPONSORED_WITHDRAW_CHAIN_KEY: SponsoredWithdrawChainKey =
  "base";

const TOKEN_CHAIN_TO_SPONSORED_CHAIN_KEY: Partial<
  Record<string, SponsoredWithdrawChainKey>
> = {
  Arbitrum: "arbitrum",
  Base: "base",
  Ethereum: "ethereum",
  Polygon: "polygon",
};

export const SUPPORTED_SPONSORED_WITHDRAW_CHAINS = Object.keys(
  SPONSORED_WITHDRAW_CHAIN_CONFIG,
) as SponsoredWithdrawChainKey[];

export const getSponsoredWithdrawChainKeyForTokenChain = (
  chainName: string,
): SponsoredWithdrawChainKey | null => {
  return TOKEN_CHAIN_TO_SPONSORED_CHAIN_KEY[chainName] ?? null;
};

export const getPrivySponsoredWithdrawChainConfig = (
  chainKey: SponsoredWithdrawChainKey = DEFAULT_SPONSORED_WITHDRAW_CHAIN_KEY,
) => {
  return SPONSORED_WITHDRAW_CHAIN_CONFIG[chainKey];
};
