/**
 * Fee Structure Utility
 *
 * Handles fee calculation based on the Element Pay fee-structure API.
 * Used for both OffRamp and OnRamp transactions.
 */

// ============ Constants ============

/**
 * Default fee bands used when API is unavailable.
 * These match the real API structure for consistency.
 */
export const DEFAULT_FEE_BANDS: FeeBand[] = [
  {
    min_amount: 0,
    max_amount: 100,
    fee_amount: 0,
    description: "0-100 KES: 0 KES fee",
  },
  {
    min_amount: 101,
    max_amount: 500,
    fee_amount: 5,
    description: "101-500 KES: 5 KES fee",
  },
  {
    min_amount: 501,
    max_amount: 1000,
    fee_amount: 8,
    description: "501-1000 KES: 8 KES fee",
  },
  {
    min_amount: 1001,
    max_amount: 2500,
    fee_amount: 12,
    description: "1001-2500 KES: 12 KES fee",
  },
  {
    min_amount: 2501,
    max_amount: 5000,
    fee_amount: 18,
    description: "2501-5000 KES: 18 KES fee",
  },
  {
    min_amount: 5001,
    max_amount: 10000,
    fee_amount: 25,
    description: "5001-10000 KES: 25 KES fee",
  },
  {
    min_amount: 10001,
    max_amount: 25000,
    fee_amount: 40,
    description: "10001-25000 KES: 40 KES fee",
  },
  {
    min_amount: 25001,
    max_amount: 50000,
    fee_amount: 55,
    description: "25001-50000 KES: 55 KES fee",
  },
  {
    min_amount: 50001,
    max_amount: 100000,
    fee_amount: 80,
    description: "50001-100000 KES: 80 KES fee",
  },
  {
    min_amount: 100001,
    max_amount: null,
    fee_amount: 100,
    description: "100001-∞ KES: 100 KES fee",
  },
];

/**
 * Minimum transaction amount in KES
 */
export const MIN_TRANSACTION_AMOUNT_KES = 10;

/**
 * Maximum transaction amount in KES (from API structure)
 */
export const MAX_TRANSACTION_AMOUNT_KES = 500000; // 500k KES limit

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
 * Fetch quote from the API - used for balance validation
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
    },
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
 * Fetch fee structure from the dedicated fee-structure API endpoint
 * Returns real fee bands from the backend
 */
export async function fetchFeeStructure(
  params: FetchFeeStructureParams,
): Promise<FeeStructureResponse> {
  const { token, action } = params;
  const apiCurrency = getApiCurrencyFromToken(token);

  // Use the local API route which proxies to the backend with authentication
  const feeStructureUrl = `/api/fee-structure?token=${apiCurrency}&action=${action}`;

  console.log("[feeStructure] Fetching from:", feeStructureUrl);

  try {
    const response = await fetch(feeStructureUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(
        `Fee structure API failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    console.log("[feeStructure] API response:", data);

    if (data.status !== "success" || !data.data?.fee_bands) {
      throw new Error(data.message || "Invalid fee structure response");
    }

    // Validate and normalize fee bands from API
    const feeBands: FeeBand[] = data.data.fee_bands.map((band: any) => ({
      min_amount: Number(band.min_amount) || 0,
      max_amount: band.max_amount != null ? Number(band.max_amount) : null,
      fee_amount: Number(band.fee_amount) || 0,
      description:
        band.description || `${band.min_amount}-${band.max_amount ?? "∞"} KES`,
    }));

    return {
      status: "success",
      message: data.message || "Fee structure retrieved successfully",
      data: {
        currency: data.data.currency || apiCurrency,
        base_rate: Number(data.data.base_rate) || 129.5,
        order_type: data.data.order_type || action,
        fee_type: data.data.fee_type || "band_based",
        fee_currency: data.data.fee_currency || "KES",
        fee_bands: feeBands,
        notes: data.data.notes || {
          onramp: "User pays fiat amount, receives tokens worth (amount - fee)",
          offramp:
            "User sends tokens worth (amount + fee), merchant receives full fiat amount",
          free_tier: "Transactions 0-100 KES are always free",
        },
      },
    };
  } catch (error) {
    console.warn(
      "[feeStructure] Fee structure API failed, using fallback:",
      error,
    );
    return getFallbackFeeStructure(token, action);
  }
}

/**
 * Fallback fee structure when API is unavailable
 * Uses DEFAULT_FEE_BANDS for consistency
 */
function getFallbackFeeStructure(
  token: string,
  action: "OffRamp" | "OnRamp",
): FeeStructureResponse {
  const fallbackRates: Record<string, number> = {
    usdc: 129.5,
    usdt: 129.5,
    wxm: 0.15,
    usdc_lisk: 129.5,
    usdt_lisk: 129.5,
  };

  console.log("[feeStructure] Using fallback fee bands for", token, action);

  return {
    status: "success",
    message: "Using fallback rates",
    data: {
      currency: token,
      base_rate: fallbackRates[token.toLowerCase()] || 129.5,
      order_type: action,
      fee_type: "band_based",
      fee_currency: "KES",
      fee_bands: DEFAULT_FEE_BANDS, // Use the centralized default
      notes: {
        onramp: "User pays fiat amount, receives tokens worth (amount - fee)",
        offramp:
          "User sends tokens worth (amount + fee), merchant receives full fiat amount",
        free_tier: "Transactions 0-100 KES are always free",
      },
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
 *
 * This algorithm considers fee band boundaries to find the optimal maximum.
 *
 * Key insight: Sometimes staying at a lower fee band boundary yields a higher
 * effective max than paying fees in a higher band.
 *
 * Example: With 104 KES worth of tokens:
 * - At 104 KES → fee is 5 (band 101-500) → needs 109 KES → Can't afford
 * - Binary search → ~99 KES (99 + 5 = 104)
 * - BUT at 100 KES → fee is 0 (band 0-100) → needs 100 KES → CAN afford!
 *
 * The algorithm checks each fee band boundary and finds the best option.
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

    // Sort bands by min_amount
    const sortedBands = [...feeBands].sort(
      (a, b) => a.min_amount - b.min_amount,
    );

    // Strategy: Check multiple candidate amounts:
    // 1. The max_amount of each fee band (band boundaries)
    // 2. Binary search within each band to find the max affordable amount in that band

    let bestMaxFiat = 0;
    let bestMaxTokens = 0;

    for (const band of sortedBands) {
      const bandMaxAmount = band.max_amount ?? maxPossibleFiat;
      const fee = band.fee_amount;

      // Calculate max affordable amount within this band
      // Formula: (fiat_amount + fee) / rate <= tokenBalance
      // => fiat_amount <= tokenBalance * rate - fee
      const maxInBandBeforeFee = tokenBalance * exchangeRate - fee;

      if (maxInBandBeforeFee < band.min_amount) {
        // Can't afford even the minimum in this band
        continue;
      }

      // The max we can afford in this band (capped by band's max_amount)
      const maxAffordableInBand = Math.min(maxInBandBeforeFee, bandMaxAmount);

      // Ensure it's within the band range
      if (maxAffordableInBand >= band.min_amount) {
        // Round down to whole number
        const roundedMax = Math.floor(maxAffordableInBand);

        // Verify this amount is valid (stays within the same band after rounding)
        const { fee: actualFee } = getFeeForAmount(roundedMax, feeBands);
        const tokensRequired = (roundedMax + actualFee) / exchangeRate;

        if (tokensRequired <= tokenBalance && roundedMax > bestMaxFiat) {
          bestMaxFiat = roundedMax;
          bestMaxTokens = tokensRequired;
        }
      }

      // Also check the band boundary (max_amount) as a candidate
      // This is important when the next band has higher fees
      if (band.max_amount !== null && band.max_amount > 0) {
        const boundaryAmount = band.max_amount;
        const boundaryFee = band.fee_amount;
        const boundaryTokensRequired =
          (boundaryAmount + boundaryFee) / exchangeRate;

        if (
          boundaryTokensRequired <= tokenBalance &&
          boundaryAmount > bestMaxFiat
        ) {
          bestMaxFiat = boundaryAmount;
          bestMaxTokens = boundaryTokensRequired;
        }
      }
    }

    // Final verification
    if (bestMaxFiat > 0) {
      const { fee: finalFee } = getFeeForAmount(bestMaxFiat, feeBands);
      const verifiedTokens = (bestMaxFiat + finalFee) / exchangeRate;

      console.log(
        `[MaxSpendable] Best max: ${bestMaxFiat} KES, fee: ${finalFee} KES, tokens needed: ${verifiedTokens.toFixed(6)}, balance: ${tokenBalance.toFixed(6)}`,
      );

      return { maxFiat: bestMaxFiat, maxTokens: verifiedTokens };
    }

    return { maxFiat: 0, maxTokens: 0 };
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

// In-flight request deduplication — prevents concurrent callers from all hitting the API
const inFlightRequests: Map<string, Promise<FeeStructureResponse>> = new Map();

/**
 * Fetch fee structure with caching and in-flight deduplication
 */
export async function fetchFeeStructureCached(
  params: FetchFeeStructureParams,
): Promise<FeeStructureResponse> {
  const cacheKey = `${params.token}-${params.action}`;
  const cached = feeStructureCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // If there's already an in-flight request for the same key, reuse it
  const existing = inFlightRequests.get(cacheKey);
  if (existing) {
    return existing;
  }

  const request = fetchFeeStructure(params)
    .then((data) => {
      feeStructureCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, request);
  return request;
}

/**
 * Clear the fee structure cache
 */
export function clearFeeStructureCache(): void {
  feeStructureCache.clear();
}
