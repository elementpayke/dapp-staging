/**
 * Fee Structure Utility
 *
 * Handles fee calculation based on the Element Pay API fee structure.
 * Used for both OffRamp and OnRamp transactions.
 */

// ============ Types ============

export interface FeeBand {
  min_amount: number;
  max_amount: number | null;
  fee_amount: number;
  description: string;
}

export interface FeeStructureResponse {
  status: string;
  message: string;
  data: {
    currency: string;
    base_rate: number;
    order_type: "OffRamp" | "OnRamp";
    fee_type: string;
    fee_currency: string;
    fee_bands: FeeBand[];
    notes: {
      onramp: string;
      offramp: string;
      free_tier: string;
    };
  };
}

export interface TotalCostResult {
  // Input values
  inputAmountFiat: number;
  tokenBalance: number;
  exchangeRate: number;

  // Fee calculation
  feeAmountFiat: number;
  feeBand: FeeBand | null;

  // For OffRamp: User sends tokens worth (amountFiat + fee) to receive amountFiat
  // For OnRamp: User pays fiat (amountFiat), receives tokens worth (amountFiat - fee)
  totalFiatCost: number; // Total fiat value including fees
  totalTokenCost: number; // Total tokens required (for offramp) or tokens received (for onramp)

  // Balance checks
  canAfford: boolean; // Whether user has sufficient balance
  maxSpendableFiat: number; // Maximum fiat amount user can transact
  maxSpendableTokens: number; // Maximum tokens user can spend

  // Remaining balance after transaction
  remainingTokenBalance: number;
  remainingFiatValue: number;

  // Order type
  orderType: "OffRamp" | "OnRamp";
}

export interface FetchFeeStructureParams {
  token: string; // Token symbol (e.g., "usdc", "usdt", "wxm")
  action: "OffRamp" | "OnRamp";
}

// ============ API Functions ============

/**
 * Fetch fee structure from the API
 */
export async function fetchFeeStructure(
  params: FetchFeeStructureParams,
): Promise<FeeStructureResponse> {
  const { token, action } = params;

  // Map action to q parameter (1 = OffRamp, 0 = OnRamp based on existing code pattern)
  const q = action === "OffRamp" ? "1" : "0";

  const response = await fetch(
    `/api/fee-structure?token=${token.toLowerCase()}&action=${q}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch fee structure: ${response.statusText}`);
  }

  const data: FeeStructureResponse = await response.json();

  if (data.status !== "success") {
    throw new Error(data.message || "Failed to fetch fee structure");
  }

  return data;
}

// ============ Fee Calculation Functions ============

/**
 * Get the fee for a given fiat amount based on fee bands
 */
export function getFeeForAmount(
  amountFiat: number,
  feeBands: FeeBand[],
): { fee: number; band: FeeBand | null } {
  // Sort bands by min_amount to ensure correct order
  const sortedBands = [...feeBands].sort((a, b) => a.min_amount - b.min_amount);

  for (const band of sortedBands) {
    const maxAmount = band.max_amount ?? Infinity;

    if (amountFiat >= band.min_amount && amountFiat <= maxAmount) {
      return { fee: band.fee_amount, band };
    }
  }

  // If no band found (shouldn't happen with proper fee structure), return last band
  const lastBand = sortedBands[sortedBands.length - 1];
  return { fee: lastBand?.fee_amount ?? 0, band: lastBand ?? null };
}

/**
 * Calculate the maximum fiat amount that can be transacted given a token balance
 * Uses binary search to find the optimal amount considering fees
 */
export function calculateMaxSpendableFiat(
  tokenBalance: number,
  exchangeRate: number,
  feeBands: FeeBand[],
  orderType: "OffRamp" | "OnRamp",
): { maxFiat: number; maxTokens: number } {
  if (tokenBalance <= 0 || exchangeRate <= 0) {
    return { maxFiat: 0, maxTokens: 0 };
  }

  // Maximum possible fiat value from token balance
  const maxPossibleFiat = tokenBalance * exchangeRate;

  if (orderType === "OffRamp") {
    // For OffRamp: User sends tokens worth (fiat_amount + fee) to receive fiat_amount
    // We need to find max fiat_amount where (fiat_amount + fee) / rate <= tokenBalance

    // Binary search for the maximum affordable fiat amount
    let low = 0;
    let high = maxPossibleFiat;
    let maxAffordableFiat = 0;

    while (high - low > 0.01) {
      const mid = (low + high) / 2;
      const { fee } = getFeeForAmount(mid, feeBands);
      const totalFiatCost = mid + fee;
      const tokensRequired = totalFiatCost / exchangeRate;

      if (tokensRequired <= tokenBalance) {
        maxAffordableFiat = mid;
        low = mid;
      } else {
        high = mid;
      }
    }

    // Round down to nearest whole number (KES doesn't use decimals typically)
    const roundedMax = Math.floor(maxAffordableFiat);
    const { fee: finalFee } = getFeeForAmount(roundedMax, feeBands);
    const maxTokens = (roundedMax + finalFee) / exchangeRate;

    return { maxFiat: roundedMax, maxTokens };
  } else {
    // For OnRamp: User pays fiat, receives tokens worth (fiat - fee)
    // Max fiat is simply the fiat equivalent of token balance + any fees they'd pay
    // But typically for onramp, we just return the max fiat they can convert to tokens

    const roundedMax = Math.floor(maxPossibleFiat);
    return { maxFiat: roundedMax, maxTokens: tokenBalance };
  }
}

/**
 * Main utility function: Calculate total cost for a transaction
 */
export function getTotalCost(params: {
  amountFiat: number;
  tokenBalance: number;
  exchangeRate: number;
  feeBands: FeeBand[];
  orderType: "OffRamp" | "OnRamp";
}): TotalCostResult {
  const { amountFiat, tokenBalance, exchangeRate, feeBands, orderType } =
    params;

  // Get fee for the specified amount
  const { fee: feeAmountFiat, band: feeBand } = getFeeForAmount(
    amountFiat,
    feeBands,
  );

  // Calculate max spendable
  const { maxFiat: maxSpendableFiat, maxTokens: maxSpendableTokens } =
    calculateMaxSpendableFiat(tokenBalance, exchangeRate, feeBands, orderType);

  let totalFiatCost: number;
  let totalTokenCost: number;
  let canAfford: boolean;
  let remainingTokenBalance: number;

  if (orderType === "OffRamp") {
    // OffRamp: User sends tokens worth (amountFiat + fee), merchant receives amountFiat
    totalFiatCost = amountFiat + feeAmountFiat;
    totalTokenCost = totalFiatCost / exchangeRate;
    canAfford = totalTokenCost <= tokenBalance;
    remainingTokenBalance = Math.max(0, tokenBalance - totalTokenCost);
  } else {
    // OnRamp: User pays amountFiat, receives tokens worth (amountFiat - fee)
    totalFiatCost = amountFiat;
    const netFiatAfterFee = amountFiat - feeAmountFiat;
    totalTokenCost = netFiatAfterFee / exchangeRate; // Tokens received
    canAfford = true; // For onramp, user pays fiat, so token balance doesn't matter for affordability
    remainingTokenBalance = tokenBalance + totalTokenCost; // Balance increases
  }

  const remainingFiatValue = remainingTokenBalance * exchangeRate;

  return {
    inputAmountFiat: amountFiat,
    tokenBalance,
    exchangeRate,
    feeAmountFiat,
    feeBand,
    totalFiatCost,
    totalTokenCost,
    canAfford,
    maxSpendableFiat,
    maxSpendableTokens,
    remainingTokenBalance,
    remainingFiatValue,
    orderType,
  };
}

// ============ Convenience Functions ============

/**
 * Fetch fee structure and calculate total cost in one call
 */
export async function fetchAndCalculateTotalCost(params: {
  token: string;
  action: "OffRamp" | "OnRamp";
  amountFiat: number;
  tokenBalance: number;
  exchangeRate: number;
}): Promise<TotalCostResult> {
  const { token, action, amountFiat, tokenBalance, exchangeRate } = params;

  const feeStructure = await fetchFeeStructure({ token, action });

  return getTotalCost({
    amountFiat,
    tokenBalance,
    exchangeRate,
    feeBands: feeStructure.data.fee_bands,
    orderType: action,
  });
}

/**
 * Get just the max spendable amount (useful for Max buttons)
 */
export async function fetchMaxSpendable(params: {
  token: string;
  action: "OffRamp" | "OnRamp";
  tokenBalance: number;
  exchangeRate: number;
}): Promise<{ maxFiat: number; maxTokens: number; feeBands: FeeBand[] }> {
  const { token, action, tokenBalance, exchangeRate } = params;

  const feeStructure = await fetchFeeStructure({ token, action });
  const result = calculateMaxSpendableFiat(
    tokenBalance,
    exchangeRate,
    feeStructure.data.fee_bands,
    action,
  );

  return {
    ...result,
    feeBands: feeStructure.data.fee_bands,
  };
}

// ============ Token Symbol Mapping ============

/**
 * Map token symbol to API currency parameter
 */
export function getApiCurrencyFromToken(tokenSymbol: string): string {
  const currencyMap: Record<string, string> = {
    USDT: "usdt_lisk",
    USDC: "usdc",
    WXM: "wxm",
    ETH: "eth",
  };

  return currencyMap[tokenSymbol.toUpperCase()] || tokenSymbol.toLowerCase();
}

// ============ Cache for Fee Structure ============

// Simple in-memory cache for fee structures
const feeStructureCache: Map<
  string,
  { data: FeeStructureResponse; timestamp: number }
> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch fee structure with caching
 */
export async function fetchFeeStructureCached(
  params: FetchFeeStructureParams,
): Promise<FeeStructureResponse> {
  const cacheKey = `${params.token}-${params.action}`;
  const cached = feeStructureCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const data = await fetchFeeStructure(params);
  feeStructureCache.set(cacheKey, { data, timestamp: Date.now() });

  return data;
}

/**
 * Clear the fee structure cache
 */
export function clearFeeStructureCache(): void {
  feeStructureCache.clear();
}
