/**
 * Fee Structure Utility
 *
 * Handles fee calculation based on the Element Pay quote API.
 * Used for both OffRamp and OnRamp transactions.
 */

// ============ Types ============

export interface FeeBand {
  min_amount: number;
  max_amount: number | null;
  fee_amount: number;
  description: string;
}

export interface QuoteResponse {
  status: string;
  message: string;
  data: {
    rate: number;
    token_amount: number;
    fiat_paid: number;
    fee_amount: number;
    symbol: string;
    decimals: number;
    // Alternative field names from existing API
    required_token_amount?: number;
    effective_rate?: number;
  };
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
  inputAmountFiat: number;
  tokenBalance: number;
  exchangeRate: number;
  feeAmountFiat: number;
  feeBand: FeeBand | null;
  totalFiatCost: number;
  totalTokenCost: number;
  canAfford: boolean;
  maxSpendableFiat: number;
  maxSpendableTokens: number;
  remainingTokenBalance: number;
  remainingFiatValue: number;
  orderType: "OffRamp" | "OnRamp";
}

export interface FetchFeeStructureParams {
  token: string;
  action: "OffRamp" | "OnRamp";
}

// ============ Quote API Functions ============

/**
 * Fetch quote from the API - this is the new primary method
 */
export async function fetchQuote(params: {
  amountFiat: number;
  token: string;
  orderType: "OffRamp" | "OnRamp";
}): Promise<QuoteResponse> {
  const { amountFiat, token, orderType } = params;

  const response = await fetch(
    `/api/quote?amount_fiat=${amountFiat}&token=${token.toLowerCase()}&order_type=${orderType}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch quote: ${response.statusText}`);
  }

  const data: QuoteResponse = await response.json();

  if (data.status !== "success") {
    throw new Error(data.message || "Failed to fetch quote");
  }

  return data;
}

/**
 * Fetch fee structure - now uses quote API with a default amount
 * Returns synthetic fee bands for backward compatibility
 */
export async function fetchFeeStructure(
  params: FetchFeeStructureParams
): Promise<FeeStructureResponse> {
  const { token, action } = params;

  try {
    // Fetch quote with a sample amount to get the rate
    const quote = await fetchQuote({
      amountFiat: 1000, // Sample amount to get rate
      token: getApiCurrencyFromToken(token),
      orderType: action,
    });

    const rate = quote.data.rate || quote.data.effective_rate || 129.5;
    const feeAmount = quote.data.fee_amount || 0;

    // Create synthetic fee bands based on quote response
    const feeBands: FeeBand[] = [
      { min_amount: 0, max_amount: 99, fee_amount: 0, description: "Free tier" },
      { min_amount: 100, max_amount: 500, fee_amount: Math.max(feeAmount, 10), description: "Small transactions" },
      { min_amount: 501, max_amount: 2000, fee_amount: Math.max(feeAmount, 15), description: "Medium transactions" },
      { min_amount: 2001, max_amount: null, fee_amount: Math.max(feeAmount, 20), description: "Large transactions" },
    ];

    return {
      status: "success",
      message: "Fee structure from quote",
      data: {
        currency: token,
        base_rate: rate,
        order_type: action,
        fee_type: "flat",
        fee_currency: "KES",
        fee_bands: feeBands,
        notes: { onramp: "", offramp: "", free_tier: "Transactions under KES 100 are free" },
      },
    };
  } catch (error) {
    console.warn("[feeStructure] Quote API failed, using fallback:", error);
    return getFallbackFeeStructure(token, action);
  }
}

/**
 * Fallback fee structure when API is unavailable
 */
function getFallbackFeeStructure(
  token: string,
  action: "OffRamp" | "OnRamp"
): FeeStructureResponse {
  const fallbackRates: Record<string, number> = {
    usdc: 129.5,
    usdt: 129.5,
    wxm: 0.15,
    usdc_lisk: 129.5,
    usdt_lisk: 129.5,
  };

  return {
    status: "success",
    message: "Using fallback rates",
    data: {
      currency: token,
      base_rate: fallbackRates[token.toLowerCase()] || 129.5,
      order_type: action,
      fee_type: "flat",
      fee_currency: "KES",
      fee_bands: [
        { min_amount: 0, max_amount: 99, fee_amount: 0, description: "Free tier" },
        { min_amount: 100, max_amount: 500, fee_amount: 10, description: "Small" },
        { min_amount: 501, max_amount: 2000, fee_amount: 15, description: "Medium" },
        { min_amount: 2001, max_amount: null, fee_amount: 20, description: "Large" },
      ],
      notes: { onramp: "", offramp: "", free_tier: "" },
    },
  };
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
