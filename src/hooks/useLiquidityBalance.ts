import { useReadContract } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import { SupportedToken } from "@/constants/supportedTokens";

/**
 * Maps each chain to the Element Pay contract address that holds onramp liquidity.
 * These come from NEXT_PUBLIC_CONTRACT_ADDRESS_* env vars.
 *
 * NOTE: Polygon is intentionally excluded.
 * Polygon onramps are disabled — low USDC demand means we don't hold
 * meaningful liquidity there. Re-add when Polygon onramp is re-enabled.
 */
const LIQUIDITY_CONTRACT: Partial<Record<string, `0x${string}`>> = {
  Base:     process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BASE     as `0x${string}`,
  Scroll:   process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_SCROLL   as `0x${string}`,
  Lisk:     process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_LISK     as `0x${string}`,
  Arbitrum: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ARBITRUM as `0x${string}`,
  // Polygon: "0x..." — omitted, onramp disabled (low USDC liquidity/demand)
};

/**
 * Chain IDs for each supported chain.
 * Polygon is omitted — no onramp support currently.
 */
const CHAIN_ID: Partial<Record<string, number>> = {
  Base:     8453,
  Scroll:   534352,
  Lisk:     1135,
  Arbitrum: 42161,
  // Polygon: 137 — omitted, onramp disabled
};

/**
 * Token decimals per symbol.
 * Used by formatUnits() to convert the raw bigint from balanceOf()
 * into a human-readable number safely (avoids JS number precision issues
 * that can occur with Number(bigint) on large values).
 */
const TOKEN_DECIMALS: Partial<Record<string, number>> = {
  USDC: 6,
  USDT: 6,
  WXM:  18,
};

/**
 * Gas buffer per chain — a small token amount reserved to cover the
 * on-chain transaction cost of sending the token to the user.
 *
 * Added on top of the requested amount AND the minimum floor in all cases.
 * This ensures the contract is never drained to exactly zero.
 */
const GAS_BUFFER_TOKEN: Partial<Record<string, number>> = {
  Base:     0.5,   // Base is cheap — 0.5 USDC buffer is plenty
  Scroll:   0.5,
  Lisk:     0.5,
  Arbitrum: 1.0,   // Arbitrum can be slightly more expensive
};

/**
 * Absolute minimum operational floor per token.
 *
 * This floor is ALWAYS required in addition to whatever the user requests.
 * The contract must hold at least (minimumFloor + gasBuffer + requestedAmount)
 * for an onramp to be allowed.
 *
 * When requestedToken === 0 (user hasn't entered an amount yet), we check:
 *   balance >= minimumFloor + gasBuffer
 * This is an "is the contract operational?" check before the user sizes an order.
 *
 * When requestedToken > 0, we check:
 *   balance >= requestedToken + minimumFloor + gasBuffer
 * The floor stays in place — we never fulfil an order if doing so would
 * drop the contract below the minimum operational reserve.
 */
const MINIMUM_FLOOR_TOKEN: Partial<Record<string, number>> = {
  USDC: 10,
  USDT: 10,
  WXM:  5,
};

export interface UseLiquidityBalanceResult {
  /** Human-readable balance of the token in the liquidity contract */
  balance: number;
  /**
   * Maximum token amount the contract can give out right now after
   * subtracting the gas buffer AND the minimum floor reserve.
   * Used internally — do NOT display this to users (security risk).
   */
  maxAvailableToken: number;
  /**
   * Maximum KES value of maxAvailableToken at the current exchange rate.
   * Used internally — do NOT display this to users (security risk).
   */
  maxAvailableKES: number;
  /**
   * True if the contract can cover the full request:
   *   balance >= requestedToken + minimumFloor + gasBuffer
   */
  hasLiquidity: boolean;
  /**
   * True when:
   *   - onramp is supported for this chain/token
   *   - hasLiquidity is false (this order size is too large)
   *   - user has entered a positive requestedToken amount
   *   - maxAvailableToken >= minimumFloor (pool is not meaningfully empty)
   *
   * "Partial" here means: the pool has enough to process a smaller order,
   * but not this one. It is a prompt to lower the amount — NOT a promise
   * of a partial fill. The deposit button must remain disabled in this state.
   */
  isPartiallyAvailable: boolean;
  /** True if this chain/token combo supports onramp at all */
  isOnrampSupported: boolean;
  /** Whether the RPC call is in flight */
  isLoading: boolean;
}

/**
 * Checks whether the Element Pay liquidity contract holds enough of the
 * given token to safely fulfil the user's specific requested amount.
 *
 * The check is:
 *   balance >= requestedToken + minimumFloor + gasBuffer
 *
 * Both the minimum floor and gas buffer are always required on top of
 * the requested amount, so we never drain the contract below its
 * operational reserve.
 *
 * Uses wagmi's useReadContract — same pattern as useTokenBalance,
 * just pointed at the contract wallet instead of the user's wallet.
 * Uses viem's formatUnits() for safe bigint → number conversion.
 *
 * IMPORTANT — RPC cost:
 * Results are cached for 5 minutes (staleTime + refetchInterval).
 * RPC credits are not free — do not reduce these intervals without good reason.
 *
 * @param token           The currently selected token
 * @param requestedToken  How many tokens the user wants (derived from their KES input)
 * @param exchangeRate    Current KES/token rate, used to compute maxAvailableKES
 */
export function useLiquidityBalance(
  token: SupportedToken,
  requestedToken: number = 0,
  exchangeRate: number = 0,
): UseLiquidityBalanceResult {
  const contractAddress = LIQUIDITY_CONTRACT[token.chain];
  const chainId         = CHAIN_ID[token.chain];
  const decimals        = TOKEN_DECIMALS[token.symbol] ?? 6;
  const gasBuffer       = GAS_BUFFER_TOKEN[token.chain] ?? 1;
  const minimumFloor    = MINIMUM_FLOOR_TOKEN[token.symbol] ?? 10;

  const isOnrampSupported = !!contractAddress && !!chainId;

  const { data: rawBalance, isLoading } = useReadContract({
    address:      token.tokenAddress as `0x${string}`,
    abi:          erc20Abi,
    functionName: "balanceOf",
    args:         contractAddress ? [contractAddress] : undefined,
    chainId,
    query: {
      enabled: isOnrampSupported,
      /**
       * Cache for 5 minutes.
       * Liquidity doesn't move by the second — a 5-minute window is fine
       * and keeps RPC usage low. The backend has its own fresh check anyway.
       */
      staleTime:       5 * 60 * 1000,
      refetchInterval: 5 * 60 * 1000,
      retry:           1,
    },
  });

  // Use viem's formatUnits for safe bigint → number conversion.
  // Number(bigint) can lose precision on very large values — formatUnits
  // handles the decimal shift correctly for all token denominations.
  const balance = rawBalance ? parseFloat(formatUnits(rawBalance, decimals)) : 0;

  // The maximum the contract can give out while keeping the floor reserve intact.
  // Used internally to determine isPartiallyAvailable — never shown to the user.
  const maxAvailableToken = Math.max(balance - gasBuffer - minimumFloor, 0);

  // KES equivalent of maxAvailableToken — internal use only, not shown in UI.
  const maxAvailableKES = exchangeRate > 0
    ? Math.floor(maxAvailableToken * exchangeRate)
    : 0;

  // Full check: balance must cover the request PLUS the floor PLUS gas.
  // When requestedToken === 0 we just check the floor + gas ("is the contract operational?").
  const requiredAmount = requestedToken > 0
    ? requestedToken + minimumFloor + gasBuffer
    : minimumFloor + gasBuffer;

  const hasLiquidity = isOnrampSupported && balance >= requiredAmount;

  /**
   * Partial availability:
   * The pool isn't empty (maxAvailableToken >= minimumFloor) but this specific
   * order is too large. The user should be prompted to lower their amount.
   * The deposit button must remain disabled — this is NOT a partial fill offer.
   */
  const isPartiallyAvailable =
    isOnrampSupported &&
    !hasLiquidity &&
    maxAvailableToken >= minimumFloor &&
    requestedToken > 0;

  return {
    balance,
    maxAvailableToken,
    maxAvailableKES,
    hasLiquidity,
    isPartiallyAvailable,
    isOnrampSupported,
    isLoading,
  };
}