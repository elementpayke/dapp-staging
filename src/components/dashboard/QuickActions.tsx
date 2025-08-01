"use client";
import React, { FC, useMemo } from "react";
import { Bell, MoreHorizontal } from "lucide-react"; // Import icons
import { useChainId, useBalance } from "wagmi";
import { useAccount } from "wagmi";

import SendCryptoModal from "./sendCrypto/SendCryptoModal";
import DepositCryptoModal from "./depositCrypto/DepositCryptoModal";
import { SUPPORTED_TOKENS, SupportedToken } from "@/constants/supportedTokens";
import { useState, useEffect } from "react";

const QuickActions: FC = () => {
  const { address } = useAccount();
  const currentChainId = useChainId();
  
  // Get the current token based on connected chain
  const currentToken = useMemo((): SupportedToken => {
    // Map chain IDs to chain names
    const chainIdToName: Record<number, string> = {
      8453: "Base",
      1135: "Lisk", 
      534352: "Scroll",
      42161: "Arbitrum"
    };
    
    const chainName = chainIdToName[currentChainId];
    
    // Find a token for the current chain (prefer USDC if available)
    const tokensForChain = SUPPORTED_TOKENS.filter(token => token.chain === chainName);
    const preferredToken = tokensForChain.find(token => token.symbol === "USDC") || tokensForChain[0];
    
    // Default to Base USDC if no token found for current chain
    return preferredToken || SUPPORTED_TOKENS.find(token => token.symbol === "USDC" && token.chain === "Base") || SUPPORTED_TOKENS[0];
  }, [currentChainId]);

  // Fetch balance for the current token
  const { data: tokenBalanceData } = useBalance({
    address: address,
    token: currentToken.tokenAddress as `0x${string}`,
    query: {
      staleTime: 30_000,
      refetchInterval: 30_000,
      retry: (failureCount, error: any) => {
        if (error?.code === -32005) return false; 
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  });

  // Map token symbol to CoinGecko API ID
  const getCoinGeckoId = (symbol: string): string => {
    switch (symbol.toLowerCase()) {
      case 'usdc':
        return 'usd-coin';
      case 'wxm':
        return 'weatherxm-network';
      case 'usdt':
        return 'tether';
      case 'eth':
        return 'ethereum';
      default:
        return 'usd-coin'; // fallback to USDC
    }
  };

  // Custom hook for CoinGecko exchange rates
  const [coinGeckoRate, setCoinGeckoRate] = useState<number | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState<boolean>(true);

  useEffect(() => {
    const fetchCoinGeckoRate = async () => {
      setIsLoadingRate(true);
      try {
        const coinId = getCoinGeckoId(currentToken.symbol);
        const response = await fetch(
          `/api/coingecko?coinId=${coinId}&currency=kes`
        );
        const data = await response.json();
        
        if (data[coinId] && data[coinId].kes) {
          setCoinGeckoRate(data[coinId].kes);
        } else {
          setCoinGeckoRate(null);
        }
      } catch (error) {
        console.error("Error fetching CoinGecko rate:", error);
        setCoinGeckoRate(null);
      } finally {
        setIsLoadingRate(false);
      }
    };

    fetchCoinGeckoRate();
    // Refresh every 2 minutes
    const intervalId = setInterval(fetchCoinGeckoRate, 2 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [currentToken.symbol]);
  
  const tokenBalance = parseFloat(tokenBalanceData?.formatted || "0");
  
  const rawKesBalance = () => {
    if (isLoadingRate || !coinGeckoRate) return "Loading...";

    const kesAmount = tokenBalance * coinGeckoRate;
    return kesAmount.toFixed(2);
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-2xl border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-600 mb-1">
            Wallet Balance ({currentToken.symbol} on {currentToken.chain})
          </p>
          <p className="text-3xl font-bold text-gray-900">
            <span>KES </span>
            <span className="text-emerald-600">{rawKesBalance()}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {tokenBalance.toFixed(16)} {currentToken.symbol}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-full border border-gray-200 hover:bg-gray-50">
            <Bell size={18} className="text-gray-600" />
          </button>
          <button className="p-2 rounded-full border border-gray-200 hover:bg-gray-50">
            <MoreHorizontal size={18} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <SendCryptoModal />
        <DepositCryptoModal />
      </div>
    </div>
  );
};

export default QuickActions;
