import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { 
  fetchMaxSpendable, 
  getApiCurrencyFromToken 
} from '@/utils/feeStructure';

interface MaxOfframpButtonProps {
  selectedTokenBalance: number;
  exchangeRate: number | null;
  selectedTokenAddress: string;
  selectedTokenSymbol: string;  // Added for API call
  walletAddress: string;
  onMaxAmountCalculated: (maxKESAmount: string) => void;
  disabled?: boolean;
}

/**
 * Max Offramp Button - Calculates maximum offramp amount using fee structure API
 * 
 * Uses the Element Pay fee structure API to accurately calculate
 * the maximum KES amount a user can receive based on their token balance.
 */
const MaxOfframpButton: React.FC<MaxOfframpButtonProps> = ({
  selectedTokenBalance,
  exchangeRate,
  selectedTokenAddress,
  selectedTokenSymbol,
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
    console.log('🚀 Calculating max offramp amount using fee structure API...');

    try {
      // Get the API currency from token symbol
      const apiCurrency = getApiCurrencyFromToken(selectedTokenSymbol);
      
      // Fetch max spendable from the fee structure utility
      const result = await fetchMaxSpendable({
        token: apiCurrency,
        action: "OffRamp",
        tokenBalance: selectedTokenBalance,
        exchangeRate,
      });

      console.log(`📊 Fee structure calculation result:`, {
        maxFiat: result.maxFiat,
        maxTokens: result.maxTokens,
        tokenBalance: selectedTokenBalance,
        exchangeRate,
      });

      // Ensure minimum is 10 KES
      if (result.maxFiat < 10) {
        console.warn('⚠️ Calculated amount below minimum (10 KES)');
        onMaxAmountCalculated('0');
      } else {
        console.log(`✨ Final max amount: ${result.maxFiat} KES`);
        onMaxAmountCalculated(result.maxFiat.toString());
      }

    } catch (error) {
      console.error('❌ Max calculation failed:', error);
      
      // Fallback calculation using simple fee estimation
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

  // Calculate quick estimate for tooltip (without API call)
  const getEstimatedMax = () => {
    if (!exchangeRate || selectedTokenBalance <= 0) return 0;
    const baseMax = selectedTokenBalance * exchangeRate;
    // Simple estimate: free tier < 100, otherwise ~5% fee buffer
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