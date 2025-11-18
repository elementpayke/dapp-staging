"use client";
import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import ClientOnly from "@/components/shared/ClientOnly";

const COIN_IDS = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDC: "usd-coin",
} as const;

interface CryptoPriceProps {
  symbol: string;
  price: number;
  change: number;
  image: string;
}

interface CoinGeckoMarketData {
  id: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
}

const CryptoPrice: React.FC<CryptoPriceProps> = ({
  symbol,
  price,
  change,
  image,
}) => {
  const isPositive = change > 0;
  const symbolColors = {
    BTC: "text-orange-500",
    ETH: "text-blue-600",
    USDC: "text-blue-500",
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 min-w-[200px] p-2 sm:p-0">
      {/* Note: To use Next/Image, add the following to next.config.js:
         images: {
           domains: ['assets.coingecko.com', 'coin-images.coingecko.com'],
         }
      */}
      <div className="relative w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={symbol}
          className="w-full h-full object-contain"
        />
      </div>
      <span
        className={`font-medium text-sm sm:text-base ${
          symbolColors[symbol as keyof typeof symbolColors]
        }`}
      >
        {symbol}
      </span>
      <span className="text-gray-900 text-sm sm:text-base">
        $
        {price.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
      <span
        className={`${
          isPositive ? "text-green-500" : "text-red-500"
        } text-sm sm:text-base ml-auto sm:ml-0`}
      >
        {isPositive ? "↑" : "↓"} {Math.abs(change).toFixed(2)}%
      </span>
    </div>
  );
};

const CryptoPrices: React.FC = () => {
  const [prices, setPrices] = useState<CryptoPriceProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        setError(null);

        // Route through our API route which has caching
        const coinIds = Object.values(COIN_IDS).join(',');
        const response = await fetch(
          `/api/coingecko/markets?ids=${coinIds}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch cryptocurrency data");
        }

        const data: CoinGeckoMarketData[] = await response.json();

        const formattedPrices = data.map((coin) => ({
          symbol:
            Object.keys(COIN_IDS).find(
              (key) => COIN_IDS[key as keyof typeof COIN_IDS] === coin.id
            ) || "",
          price: coin.current_price,
          change: coin.price_change_percentage_24h,
          image: coin.image,
        }));

        setPrices(formattedPrices);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    // Update every 5 minutes (reduced from 1 minute to reduce API calls)
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500 py-2 sm:py-4 px-4 sm:px-0">
        <span>⚠️</span> {error}
      </div>
    );
  }

  return (
    <ClientOnly
      fallback={
        <div className="flex items-center gap-2 text-gray-500 py-2 sm:py-4 px-4 sm:px-0">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading prices...
        </div>
      }
    >
      <div className="py-2 sm:py-4 overflow-x-auto">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 px-4 sm:px-0">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading prices...
          </div>
        ) : (
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-8 w-full">
            {prices.map((price) => (
              <CryptoPrice key={price.symbol} {...price} />
            ))}
          </div>
        )}
      </div>
    </ClientOnly>
  );
};

export default CryptoPrices;
