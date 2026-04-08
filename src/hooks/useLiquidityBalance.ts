import { useReadContract } from "wagmi";
import { erc20Abi } from "viem";
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
 * Used to convert the raw bigint from balanceOf() into a human-readable number.
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
 * This is an estimate in token units (not KES or USD).
 * We add this to whatever the user needs so the contract doesn't
 * get drained to exactly zero and fail the transfer.
 *
 * These are conservative estimates — adjust if gas costs change.
 */
const GAS_BUFFER_TOKEN: Partial<Record<string, number>> = {
  Base:     0.5,   // Base is cheap — 0.5 USDC buffer is plenty
  Scroll:   0.5,
  Lisk:     0.5,
  Arbitrum: 1.0,   // Arbitrum can be slightly more expensive
};

/**
 * Absolute minimum floor — even if the user requests a tiny amount,
 * we don't allow onramps if the contract holds less than this.
 * Prevents edge cases where the contract is nearly empty.
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
   * Maximum token amount the contract can fulfil right now
   * after subtracting the gas buffer.
   * Use this to cap what the user can request or show a partial offer.
   */
  maxAvailableToken: number;
  /**
   * Maximum KES amount the contract can cover at the current exchange rate.
   * Ready to show directly in the UI e.g. "You can deposit up to KES 6,000"
   */
  maxAvailableKES: number;
  /** True if the contract can cover the user's specific requested amount */
  hasLiquidity: boolean;
  /**
   * True if liquidity exists but is less than what the user wants.
   * Use this to show the partial availability message instead of
   * fully blocking the user.
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
 * Instead of a fixed threshold, this dynamically compares:
 *   contract balance >= requested token amount + gas buffer
 *
 * If the contract can partially cover the request, isPartiallyAvailable
 * is true and maxAvailableKES tells you the maximum we can offer right now.
 *
 * Uses wagmi's useReadContract — same pattern as useTokenBalance,
 * just pointed at the contract wallet instead of the user's wallet.
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

  // Convert raw bigint to human-readable number
  // e.g. 100_000_000n → 100 for USDC (6 decimals)
  const balance = rawBalance ? Number(rawBalance) / 10 ** decimals : 0;

  // How much the contract can actually give out after reserving gas
  // and respecting the absolute minimum floor
  const maxAvailableToken = Math.max(balance - gasBuffer, 0);

  // Convert to KES so we can show the user a friendly number
  // e.g. "You can deposit up to KES 6,240 right now"
  const maxAvailableKES = exchangeRate > 0
    ? Math.floor(maxAvailableToken * exchangeRate)
    : 0;

  // The amount we need the contract to have:
  // what the user wants + gas buffer + minimum floor
  const requiredAmount = requestedToken > 0
    ? requestedToken + gasBuffer
    : minimumFloor + gasBuffer;

  // Full liquidity — contract covers the full request
  const hasLiquidity = isOnrampSupported && balance >= requiredAmount;

  // Partial liquidity — contract has some funds but not enough for the full request.
  // Only meaningful when the user has actually entered an amount.
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