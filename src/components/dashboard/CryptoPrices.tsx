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
    <div className="flex items-center gap-2 sm:gap-3 min-w-[200px] p-2 sm:p-2.5 rounded-xl bg-[var(--ep-bg-card)] border border-[var(--ep-border)] shadow-[var(--ep-card-shadow)]">
      <div className="relative w-6 h-6 flex-shrink-0 rounded-full bg-[var(--ep-accent-subtle)] p-0.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={symbol}
          className="w-full h-full object-contain"
        />
      </div>
      <span
        className={`font-semibold text-sm ${
          symbolColors[symbol as keyof typeof symbolColors]
        }`}
      >
        {symbol}
      </span>
      <span className="text-[var(--ep-heading)] font-medium text-sm">
        $
        {price.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
      <span
        className={`${
          isPositive ? "text-green-500" : "text-red-500"
        } text-xs font-medium ml-auto sm:ml-0 px-1.5 py-0.5 rounded-full ${
          isPositive ? "bg-green-50" : "bg-red-50"
        }`}
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
      <div className="flex items-center gap-2 text-red-500 py-1 px-4 sm:px-0 text-sm">
        <span>⚠️</span> {error}
      </div>
    );
  }

  return (
    <ClientOnly
      fallback={
        <div className="py-1 overflow-x-auto w-full">
           <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:gap-3 w-full">
             {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2 sm:gap-3 min-w-[200px] p-2 sm:p-2.5 rounded-xl bg-[var(--ep-bg-card)] border border-[var(--ep-border)] shadow-sm animate-pulse">
                    <div className="w-6 h-6 rounded-full bg-[var(--ep-accent-subtle)]/50 shrink-0" />
                    <div className="w-10 h-4 rounded bg-[var(--ep-accent-subtle)]/50" />
                    <div className="w-16 h-4 rounded bg-[var(--ep-accent-subtle)]/50" />
                    <div className="w-12 h-4 rounded bg-[var(--ep-accent-subtle)]/50 ml-auto sm:ml-0" />
                </div>
             ))}
           </div>
        </div>
      }
    >
      <div className="py-1 overflow-x-auto w-full">
        {loading ? (
           <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:gap-3 w-full">
             {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2 sm:gap-3 min-w-[200px] p-2 sm:p-2.5 rounded-xl bg-[var(--ep-bg-card)] border border-[var(--ep-border)] shadow-sm animate-[pulse_1.5s_ease-in-out_infinite]">
                    <div className="w-6 h-6 rounded-full bg-[var(--ep-accent-subtle)]/60 shrink-0" />
                    <div className="w-10 h-4 rounded bg-[var(--ep-accent-subtle)]/40" />
                    <div className="w-16 h-4 rounded bg-[var(--ep-accent-subtle)]/40" />
                    <div className="w-12 h-4 rounded bg-[var(--ep-accent-subtle)]/40 ml-auto sm:ml-0" />
                </div>
             ))}
           </div>
        ) : (
          <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:gap-3 w-full">
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
