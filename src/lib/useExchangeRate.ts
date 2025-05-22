import { useState, useEffect } from "react";

export const useExchangeRate = () => {
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const MARKUP_PERCENTAGE = 1.5;

  useEffect(() => {
    const fetchExchangeRate = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          "https://api.coinbase.com/v2/exchange-rates?currency=USDC"
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        if (data?.data?.rates?.KES) {
          const baseRate = parseFloat(data.data.rates.KES);
          const markupRate = baseRate * (1 - MARKUP_PERCENTAGE / 100);
          setExchangeRate(markupRate);
        } else {
          console.error("KES rate not found in API response");
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
    const intervalId = setInterval(fetchExchangeRate, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  return { exchangeRate, isLoading };
};
