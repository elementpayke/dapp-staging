import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  calculateMaxSpendableFiat,
  MIN_TRANSACTION_AMOUNT_KES,
} from "@/utils/feeStructure";

interface MaxOfframpButtonProps {
  selectedTokenBalance: number;
  exchangeRate: number | null;
  selectedTokenAddress: string;
  selectedTokenSymbol: string;
  walletAddress: string;
  onMaxAmountCalculated: (maxKESAmount: string) => void;
  disabled?: boolean;
  feeBands: Array<{
    min_amount: number;
    max_amount: number | null;
    fee_amount: number;
    description: string;
  }>;
}

/**
 * Max Offramp Button - Calculates maximum offramp amount using fee structure utility
 *
 * Uses the calculateMaxSpendableFiat utility function from feeStructure.ts
 * No direct API calls - follows the architecture pattern
 */
const MaxOfframpButton: React.FC<MaxOfframpButtonProps> = ({
  selectedTokenBalance,
  exchangeRate,
  feeBands,
  onMaxAmountCalculated,
  disabled = false,
}) => {
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateMaxOfframp = () => {
    if (!exchangeRate || selectedTokenBalance <= 0 || feeBands.length === 0) {
      console.warn("Cannot calculate max: missing required data", {
        exchangeRate,
        selectedTokenBalance,
        hasFees: feeBands.length > 0,
      });
      return;
    }

    setIsCalculating(true);
    console.log("💰 Calculating max offramp amount using utility function...");

    try {
      // ✅ Use the utility function from feeStructure.ts
      // No API calls - just pure calculation
      const result = calculateMaxSpendableFiat(
        selectedTokenBalance,
        exchangeRate,
        feeBands,
        "OffRamp",
      );

      console.log(
        "✨ Final max amount:",
        result.maxFiat,
        "KES (from",
        result.maxFiat,
        ")",
      );

      // Ensure minimum is met
      if (result.maxFiat < MIN_TRANSACTION_AMOUNT_KES) {
        console.warn(
          `⚠️ Calculated amount below minimum (${MIN_TRANSACTION_AMOUNT_KES} KES)`,
        );
        onMaxAmountCalculated("0");
      } else {
        // Round down to ensure we don't exceed balance
        const roundedMax = Math.floor(result.maxFiat);
        onMaxAmountCalculated(roundedMax.toString());
      }
    } catch (error) {
      console.error("❌ Max calculation failed:", error);

      // Simple fallback
      if (exchangeRate) {
        const simpleMax = Math.floor(selectedTokenBalance * exchangeRate);
        console.log("🔄 Using simple fallback:", simpleMax, "KES");
        onMaxAmountCalculated(
          simpleMax >= MIN_TRANSACTION_AMOUNT_KES ? simpleMax.toString() : "0",
        );
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const getEstimatedMax = () => {
    if (!exchangeRate || selectedTokenBalance <= 0) return 0;
    return Math.floor(selectedTokenBalance * exchangeRate);
  };

  return (
    <button
      type="button"
      onClick={calculateMaxOfframp}
      disabled={
        disabled ||
        isCalculating ||
        !exchangeRate ||
        selectedTokenBalance <= 0 ||
        feeBands.length === 0
      }
      className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 whitespace-nowrap"
      title={`Calculate maximum offramp amount (estimated ~${getEstimatedMax()} KES)`}
    >
      {isCalculating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Calculating...</span>
        </>
      ) : (
        "Max"
      )}
    </button>
  );
};

export default MaxOfframpButton;
