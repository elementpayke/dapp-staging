/**
 * AmountInputWithQuickSelect - Amount input with percentage quick-select buttons
 *
 * Features:
 * - KES currency formatting
 * - 25%, 50%, 75%, Max quick-select buttons
 * - Balance display
 * - Dark theme support
 * - Integration with fee structure for accurate max calculation
 */

"use client";

import React, { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { calculateMaxSpendableFiat, type FeeBand } from "@/utils/feeStructure";

export interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Token balance in token units (e.g., USDC amount) */
  tokenBalance: number;
  /** Exchange rate (1 token = X KES) */
  exchangeRate: number | null;
  /** Fee bands for calculating max spendable */
  feeBands: FeeBand[];
  /** Whether fees are still loading */
  isLoadingFees?: boolean;
  /** Currency symbol to display */
  currency?: string;
  /** Minimum amount */
  minAmount?: number;
  /** Token symbol for display */
  tokenSymbol?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

const QUICK_SELECT_PERCENTAGES = [
  { label: "25%", value: 0.25 },
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
  { label: "Max", value: 1.0 },
];

export function AmountInputWithQuickSelect({
  value,
  onChange,
  tokenBalance,
  exchangeRate,
  feeBands,
  isLoadingFees = false,
  currency = "KES",
  minAmount = 10,
  tokenSymbol = "USDC",
  disabled = false,
  className,
  placeholder = "0.00",
}: AmountInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Calculate max spendable fiat using fee structure
  const maxSpendable = useMemo(() => {
    if (!exchangeRate || tokenBalance <= 0 || feeBands.length === 0) {
      // Fallback: simple calculation without fees
      return tokenBalance * (exchangeRate || 0);
    }

    const { maxFiat } = calculateMaxSpendableFiat(
      tokenBalance,
      exchangeRate,
      feeBands,
      "OffRamp",
    );

    return maxFiat;
  }, [tokenBalance, exchangeRate, feeBands]);

  // Handle percentage button click
  const handleQuickSelect = useCallback(
    (percentage: number) => {
      if (!exchangeRate || maxSpendable <= 0) return;

      const amount = Math.floor(maxSpendable * percentage);
      // Ensure it's at least minAmount or the max if max is less than min
      const finalAmount = Math.max(
        Math.min(amount, maxSpendable),
        percentage === 1 ? maxSpendable : minAmount,
      );

      onChange(finalAmount.toString());
    },
    [maxSpendable, exchangeRate, minAmount, onChange],
  );

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Allow empty input
      if (!inputValue) {
        onChange("");
        return;
      }

      // Only allow numbers and one decimal point
      const sanitized = inputValue.replace(/[^0-9.]/g, "");

      // Prevent multiple decimal points
      const parts = sanitized.split(".");
      if (parts.length > 2) return;

      // Limit decimal places to 2
      if (parts[1] && parts[1].length > 2) return;

      onChange(sanitized);
    },
    [onChange],
  );

  // Get validation state
  const getValidationState = () => {
    const amount = parseFloat(value) || 0;

    if (!value) return { isValid: true, message: null };

    if (amount < minAmount) {
      return {
        isValid: false,
        message: `Minimum amount is ${currency} ${minAmount}`,
      };
    }

    if (amount > maxSpendable && maxSpendable > 0) {
      return {
        isValid: false,
        message: `Maximum amount is ${currency} ${Math.floor(maxSpendable).toLocaleString()}`,
      };
    }

    return { isValid: true, message: null };
  };

  const validationState = getValidationState();
  const currentAmount = parseFloat(value) || 0;

  // Calculate token equivalent
  const tokenEquivalent =
    exchangeRate && currentAmount > 0
      ? (currentAmount / exchangeRate).toFixed(6)
      : "0.000000";

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main input */}
      <div
        className={cn(
          "relative rounded-xl border transition-all",
          "bg-gray-50 dark:bg-gray-800",
          isFocused
            ? "border-blue-500 ring-2 ring-blue-500/20"
            : "border-gray-200 dark:border-gray-700",
          !validationState.isValid &&
            value &&
            "border-red-500 dark:border-red-400",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {/* Currency label */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <span className="text-lg font-semibold text-gray-400 dark:text-gray-500">
            {currency}
          </span>
        </div>

        {/* Input field */}
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled || isLoadingFees}
          placeholder={placeholder}
          className={cn(
            "w-full py-4 pl-16 pr-4 bg-transparent",
            "text-2xl font-bold text-right",
            "text-gray-900 dark:text-gray-100",
            "placeholder:text-gray-300 dark:placeholder:text-gray-600",
            "focus:outline-none",
            "disabled:cursor-not-allowed",
          )}
        />
      </div>

      {/* Token equivalent display */}
      <div className="flex justify-between items-center px-1">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ≈ {tokenEquivalent} {tokenSymbol}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Balance: {tokenBalance.toFixed(2)} {tokenSymbol}
        </span>
      </div>

      {/* Quick select buttons */}
      <div className="flex gap-2">
        {QUICK_SELECT_PERCENTAGES.map(({ label, value: percentage }) => {
          const isActive =
            maxSpendable > 0 &&
            Math.abs(currentAmount - maxSpendable * percentage) < 1;

          return (
            <button
              key={label}
              type="button"
              onClick={() => handleQuickSelect(percentage)}
              disabled={
                disabled || isLoadingFees || !exchangeRate || maxSpendable <= 0
              }
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                "border",
                isActive
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700",
                "hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-500",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Validation message */}
      {validationState.message && (
        <p className="text-xs text-red-500 dark:text-red-400 px-1">
          {validationState.message}
        </p>
      )}

      {/* Max spendable info */}
      {maxSpendable > 0 && !isLoadingFees && (
        <p className="text-xs text-gray-400 dark:text-gray-500 px-1">
          Max you can send: {currency}{" "}
          {Math.floor(maxSpendable).toLocaleString()} (after fees)
        </p>
      )}
    </div>
  );
}

export default AmountInputWithQuickSelect;
