import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface MaxOfframpButtonProps {
  selectedTokenBalance: number;
  exchangeRate: number | null;
  selectedTokenAddress: string;
  walletAddress: string;
  onMaxAmountCalculated: (maxKESAmount: string) => void;
  disabled?: boolean;
}

/**
 * Max Offramp Button - Calculates maximum offramp amount
 * 
 * Fee Structure:
 * - Transactions < 100 KES: FREE (no fees)
 * - Transactions >= 100 KES: Apply 5% buffer for fees
 * 
 * Simple calculation:
 * - If balance × rate < 100: max = balance × rate (FREE)
 * - If balance × rate >= 100: max = balance × rate × 0.95 (with fee buffer)
 */
const MaxOfframpButton: React.FC<MaxOfframpButtonProps> = ({
  selectedTokenBalance,
  exchangeRate,
  selectedTokenAddress,
  walletAddress,
  onMaxAmountCalculated,
  disabled = false
}) => {
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateMaxOfframp = async () => {
    if (!exchangeRate || selectedTokenBalance <= 0 || !walletAddress) {
      console.warn('Cannot calculate max: missing required data');
      return;
    }

    setIsCalculating(true);
    console.log('🚀 Calculating max offramp amount...');

    try {
      // Calculate base maximum: balance × exchange rate
      const baseMaxKES = selectedTokenBalance * exchangeRate;
      console.log(`📊 Base calculation: ${selectedTokenBalance.toFixed(6)} tokens × ${exchangeRate} = ${baseMaxKES.toFixed(2)} KES`);
      
      let maxAmount: number;
      
      if (baseMaxKES < 100) {
        // Transactions below 100 KES are FREE - no fees
        maxAmount = baseMaxKES;
        console.log(`✅ Amount < 100 KES (FREE): ${maxAmount.toFixed(2)} KES`);
      } else {
        // Transactions >= 100 KES: Apply 5% buffer for fees
        maxAmount = baseMaxKES * 0.95;
        console.log(`✅ Amount >= 100 KES (with 5% fee buffer): ${maxAmount.toFixed(2)} KES`);
      }

      // Round down to nearest whole number and ensure minimum is 10 KES
      const roundedAmount = Math.floor(maxAmount);
      
      if (roundedAmount < 10) {
        console.warn('⚠️ Calculated amount below minimum (10 KES)');
        onMaxAmountCalculated('0');
      } else {
        console.log(`✨ Final max amount: ${roundedAmount} KES`);
        onMaxAmountCalculated(roundedAmount.toString());
      }

    } catch (error) {
      console.error('❌ Max calculation failed:', error);
      
      // Fallback calculation
      if (exchangeRate) {
        const baseMax = selectedTokenBalance * exchangeRate;
        const fallback = baseMax < 100 
          ? Math.floor(baseMax * 0.90) 
          : Math.floor(baseMax * 0.85);
        console.log(`🔄 Using fallback: ${fallback} KES`);
        onMaxAmountCalculated(fallback >= 10 ? fallback.toString() : '0');
      }
    } finally {
      setIsCalculating(false);
    }
  };

  // Calculate quick estimate for tooltip
  const getEstimatedMax = () => {
    if (!exchangeRate || selectedTokenBalance <= 0) return 0;
    const baseMax = selectedTokenBalance * exchangeRate;
    return baseMax < 100 
      ? Math.floor(baseMax) 
      : Math.floor(baseMax * 0.95);
  };

  return (
    <button
      type="button"
      onClick={calculateMaxOfframp}
      disabled={disabled || isCalculating || !exchangeRate || selectedTokenBalance <= 0 || !walletAddress}
      className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 whitespace-nowrap"
      title={`Calculate maximum offramp amount (estimated ~${getEstimatedMax()} KES)`}
    >
      {isCalculating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Calculating...</span>
        </>
      ) : (
        'Max'
      )}
    </button>
  );
};

export default MaxOfframpButton;