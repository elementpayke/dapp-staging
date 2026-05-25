/**
 * useLiquidityStatus
 *
 * Queries blockchain liquidity directly from each chain’s token contract
 * using standard ERC-20 balanceOf().
 *
 * Determines:
 * 1. isAvailable       — liquidity > minimum threshold
 * 2. isOverThreshold   — requested deposit exceeds escrow liquidity
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPublicClient, http, formatUnits, getAddress } from "viem";

// ── Minimum liquidity threshold ───────────────────────────────────────────────
const MIN_LIQUIDITY_USD = 20;

// ── Cache TTL ────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 60_000;

// ── Standard ERC-20 ABI ─────────────────────────────────────────────────────
const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ── Chain configuration ─────────────────────────────────────────────────────
interface ChainConfig {
  chainId: number;
  rpcUrl: string;
  contractAddress: `0x${string}`; // Escrow wallet
  tokenAddress: `0x${string}`;    // Token contract
  tokenDecimals: number;
}

const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  base: {
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org",
    contractAddress: "0xc535e8838730cfe097a0d3b7c6ef565b45dc74e3",
    tokenAddress: getAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"), // Base USDC
    tokenDecimals: 6,
  },

  lisk: {
    chainId: 1135,
    rpcUrl: "https://rpc.api.lisk.com",
    contractAddress: "0xc535e8838730cfe097a0d3b7c6ef565b45dc74e3",
    tokenAddress: getAddress("0x05D032ac25d322df992303dCa074EE7392C117b9"), // Lisk USDC
    tokenDecimals: 6,
  },

  scroll: {
    chainId: 534352,
    rpcUrl: "https://rpc.scroll.io",
    contractAddress: "0xC535E8838730CfE097A0d3b7C6eF565B45DC74e3",
    tokenAddress: getAddress("0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4"), // Scroll USDC
    tokenDecimals: 6,
  },

  arbitrum: {
    chainId: 42161,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    contractAddress: "0x7E5858f32945B530e4f107D4cB487fedcEDf63a0",
    tokenAddress: getAddress("0xB6093B61544572Ab42A0E43AF08aBaFD41bf25A6"), // WXM
    tokenDecimals: 18,
  },

  "bnb chain": {
    chainId: 56,
    rpcUrl: "https://bsc-dataseed.binance.org",
    contractAddress: "0x80d16606785427cc35617dB43EA64936a5dDEB2f",
    tokenAddress: getAddress("0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"), // BSC USDC
    tokenDecimals: 18,
  },

  polygon: {
    chainId: 137,
    rpcUrl: "https://polygon-bor-rpc.publicnode.com",
    contractAddress: "0x4Ccbe2051708E43bCAa7e182b7Ed2f954775913f",
    tokenAddress: getAddress("0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"), // Polygon USDC
    tokenDecimals: 6,
  },
};

// ── Chain aliases ────────────────────────────────────────────────────────────
const DISPLAY_TO_KEY: Record<string, string> = {
  base: "base",
  lisk: "lisk",
  scroll: "scroll",
  arbitrum: "arbitrum",
  "bnb chain": "bnb chain",
  bnb: "bnb chain",
  bsc: "bnb chain",
  polygon: "polygon",
};

function normaliseChain(displayName: string): string {
  return DISPLAY_TO_KEY[displayName.toLowerCase()] ?? displayName.toLowerCase();
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface ChainLiquidity {
  balanceUsd: number;
  isAvailable: boolean;
  isLoaded: boolean;
}

export type LiquidityMap = Record<string, ChainLiquidity>;

export interface UseLiquidityStatusReturn {
  liquidityMap: LiquidityMap;
  isLoading: boolean;
  error: string | null;
  isChainAvailable: (chainName: string) => boolean;
  isOverThreshold: (chainName: string, amountUsd: number) => boolean;
  refetch: () => void;
}

// ── Cache ────────────────────────────────────────────────────────────────────
let cachedMap: LiquidityMap | null = null;
let cacheTimestamp = 0;

// ── Fetch per-chain liquidity ────────────────────────────────────────────────
async function fetchChainBalance(
  chainKey: string,
  config: ChainConfig,
): Promise<ChainLiquidity> {
  try {
    const client = createPublicClient({
      transport: http(config.rpcUrl, { timeout: 10_000 }),
      chain: { id: config.chainId } as any,
    });

    console.log(`[useLiquidityStatus] Reading balance for ${chainKey}...`);

    const rawBalance = await client.readContract({
      address: config.tokenAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [config.contractAddress],
    });

    const balanceUsd = parseFloat(
      formatUnits(rawBalance as bigint, config.tokenDecimals),
    );

    console.log(
      `[useLiquidityStatus] ${chainKey}: $${balanceUsd.toFixed(2)} available`,
    );

    return {
      balanceUsd,
      isAvailable: balanceUsd >= MIN_LIQUIDITY_USD,
      isLoaded: true,
    };
  } catch (err) {
    console.error(
      `[useLiquidityStatus] Failed to read balance for ${chainKey}:`,
      err,
    );

    return {
      balanceUsd: 0,
      isAvailable: true,
      isLoaded: false,
    };
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useLiquidityStatus(): UseLiquidityStatusReturn {
  const [liquidityMap, setLiquidityMap] = useState<LiquidityMap>(
    cachedMap ?? {},
  );
  const [isLoading, setIsLoading] = useState(!cachedMap);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetchAll = useCallback(async (force = false) => {
    if (!force && cachedMap && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      setLiquidityMap(cachedMap);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const entries = await Promise.all(
        Object.entries(CHAIN_CONFIGS).map(async ([key, config]) => {
          const liquidity = await fetchChainBalance(key, config);
          return [key, liquidity] as [string, ChainLiquidity];
        }),
      );

      const map = Object.fromEntries(entries);

      cachedMap = map;
      cacheTimestamp = Date.now();

      if (isMounted.current) {
        setLiquidityMap(map);
        setError(null);
      }
    } catch (err: any) {
      console.error("[useLiquidityStatus] Error:", err);

      if (isMounted.current) {
        setError(err?.message ?? "Failed to load liquidity data");
        setLiquidityMap(cachedMap ?? {});
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchAll();

    return () => {
      isMounted.current = false;
    };
  }, [fetchAll]);

  const isChainAvailable = useCallback(
    (chainName: string): boolean => {
      const key = normaliseChain(chainName);
      const entry = liquidityMap[key];

      if (!entry) return true;

      return entry.isAvailable;
    },
    [liquidityMap],
  );

     const isOverThreshold = useCallback(
  (chainName: string, amountUsd: number): boolean => {
    const key = normaliseChain(chainName);
    const entry = liquidityMap[key];

    // If balance read failed or hasn't loaded yet, warn conservatively
    // for any amount over $100 — better to warn unnecessarily than miss it
    if (!entry || !entry.isLoaded) {
      return amountUsd > 100;
    }

    if (entry.balanceUsd <= 0) return false;
    return amountUsd > entry.balanceUsd;
  },
  [liquidityMap],
);

  return {
    liquidityMap,
    isLoading,
    error,
    isChainAvailable,
    isOverThreshold,
    refetch: () => fetchAll(true),
  };
}