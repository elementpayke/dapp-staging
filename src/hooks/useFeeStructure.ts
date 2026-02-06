/**
 * React Hook for Fee Structure
 *
 * Provides easy integration of fee structure calculations in React components.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  FeeBand,
  FeeStructureResponse,
  TotalCostResult,
  fetchFeeStructureCached,
  getTotalCost,
  calculateMaxSpendableFiat,
  getApiCurrencyFromToken,
} from "@/utils/feeStructure";

export interface UseFeeStructureParams {
  tokenSymbol: string;
  action: "OffRamp" | "OnRamp";
  enabled?: boolean;
}

export interface UseFeeStructureResult {
  feeBands: FeeBand[];
  baseRate: number | null;
  exchangeRate: number | null; // Alias for baseRate for convenience
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and cache fee structure data
 */
export function useFeeStructure(
  params: UseFeeStructureParams,
): UseFeeStructureResult {
  const { tokenSymbol, action, enabled = true } = params;

  const [feeBands, setFeeBands] = useState<FeeBand[]>([]);
  const [baseRate, setBaseRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchFees = useCallback(async () => {
    if (!enabled || !tokenSymbol) return;

    setIsLoading(true);
    setError(null);

    try {
      const apiCurrency = getApiCurrencyFromToken(tokenSymbol);
      const response = await fetchFeeStructureCached({
        token: apiCurrency,
        action,
      });

      setFeeBands(response.data.fee_bands);
      setBaseRate(response.data.base_rate);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch fee structure"),
      );
      console.error("[useFeeStructure] Error fetching fee structure:", err);
    } finally {
      setIsLoading(false);
    }
  }, [tokenSymbol, action, enabled]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  return {
    feeBands,
    baseRate,
    exchangeRate: baseRate, // Alias for convenience
    isLoading,
    error,
    refetch: fetchFees,
  };
}

export interface UseTotalCostParams {
  tokenSymbol: string;
  action: "OffRamp" | "OnRamp";
  amountFiat: number;
  tokenBalance: number;
  exchangeRate: number;
  enabled?: boolean;
}

export interface UseTotalCostResult extends Partial<TotalCostResult> {
  isLoading: boolean;
  error: Error | null;
  isReady: boolean;
}

/**
 * Hook to calculate total cost for a transaction
 */
export function useTotalCost(params: UseTotalCostParams): UseTotalCostResult {
  const {
    tokenSymbol,
    action,
    amountFiat,
    tokenBalance,
    exchangeRate,
    enabled = true,
  } = params;

  const {
    feeBands,
    isLoading: isLoadingFees,
    error,
  } = useFeeStructure({
    tokenSymbol,
    action,
    enabled,
  });

  const costResult = useMemo(() => {
    if (
      !enabled ||
      feeBands.length === 0 ||
      !exchangeRate ||
      exchangeRate <= 0
    ) {
      return null;
    }

    return getTotalCost({
      amountFiat,
      tokenBalance,
      exchangeRate,
      feeBands,
      orderType: action,
    });
  }, [enabled, feeBands, amountFiat, tokenBalance, exchangeRate, action]);

  return {
    ...costResult,
    isLoading: isLoadingFees,
    error,
    isReady: feeBands.length > 0 && exchangeRate > 0,
  };
}

export interface UseMaxSpendableParams {
  tokenSymbol: string;
  action: "OffRamp" | "OnRamp";
  tokenBalance: number;
  exchangeRate: number;
  enabled?: boolean;
}

export interface UseMaxSpendableResult {
  maxFiat: number;
  maxTokens: number;
  isLoading: boolean;
  error: Error | null;
  isReady: boolean;
}

/**
 * Hook to calculate maximum spendable amount
 */
export function useMaxSpendable(
  params: UseMaxSpendableParams,
): UseMaxSpendableResult {
  const {
    tokenSymbol,
    action,
    tokenBalance,
    exchangeRate,
    enabled = true,
  } = params;

  const {
    feeBands,
    isLoading: isLoadingFees,
    error,
  } = useFeeStructure({
    tokenSymbol,
    action,
    enabled,
  });

  const result = useMemo(() => {
    if (
      !enabled ||
      feeBands.length === 0 ||
      !exchangeRate ||
      exchangeRate <= 0
    ) {
      return { maxFiat: 0, maxTokens: 0 };
    }

    return calculateMaxSpendableFiat(
      tokenBalance,
      exchangeRate,
      feeBands,
      action,
    );
  }, [enabled, feeBands, tokenBalance, exchangeRate, action]);

  return {
    maxFiat: result.maxFiat,
    maxTokens: result.maxTokens,
    isLoading: isLoadingFees,
    error,
    isReady: feeBands.length > 0 && exchangeRate > 0,
  };
}
