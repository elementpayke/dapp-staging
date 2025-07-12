import { useState, useEffect } from 'react';
import { fetchTokenRates } from '../app/api/aggregator';

interface TokenRates {
  currency: string;
  base_rate: number;
  marked_up_rate: number;
  markup_percentage: number;
}

// Legacy hook for QuickActions component - fetches USDC to KES rate
export const useExchangeRate = () => {
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/rates?currency=usdc');
        const data = await response.json();
        if (data?.marked_up_rate) {
          setExchangeRate(Number(data.marked_up_rate));
        } else {
          setExchangeRate(null);
        }
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
        setExchangeRate(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExchangeRate();
    const intervalId = setInterval(fetchExchangeRate, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(intervalId);
  }, []);

  return { exchangeRate, isLoading };
};

export const useTokenRates = (currency: string = 'usdc') => {
  const [rates, setRates] = useState<TokenRates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTokenRates(currency);
      setRates(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch rates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [currency]);

  // Calculate approval amount for offramp transactions
  const calculateApprovalAmount = (amountFiat: number): number => {
    if (!rates) {
      throw new Error('Rates not available');
    }
    // approve_amount = amount_fiat / marked_up_rate
    return amountFiat / rates.marked_up_rate;
  };

  // Calculate how much KES the user will receive
  const calculateFiatAmount = (tokenAmount: number): number => {
    if (!rates) {
      throw new Error('Rates not available');
    }
    return tokenAmount * rates.marked_up_rate;
  };

  return {
    rates,
    loading,
    error,
    refetch: fetchRates,
    calculateApprovalAmount,
    calculateFiatAmount,
  };
};
