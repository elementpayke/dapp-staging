"use client";
import React, { FC, useMemo } from "react";
import { Bell, MoreHorizontal } from "lucide-react"; // Import icons
import { useChainId, useBalance } from "wagmi";
import { useAccount } from "wagmi";
import dynamic from "next/dynamic";

import { SUPPORTED_TOKENS, SupportedToken } from "@/constants/supportedTokens";
import { useState, useEffect } from "react";
import {
  getApiCurrencyFromToken,
  fetchFeeStructureCached,
} from "@/utils/feeStructure";
import TokenDropdown from "@/components/ui/TokenDropdown";

// Dynamically import modals with no SSR to prevent wagmi context issues
const SendCryptoModal = dynamic(() => import("./sendCrypto/SendCryptoModal"), {
  ssr: false,
});
const SendCryptoModalV2 = dynamic(
  () => import("./sendCrypto/SendCryptoModalV2"),
  { ssr: false },
);
const DepositCryptoModal = dynamic(
  () => import("./depositCrypto/DepositCryptoModal"),
  { ssr: false },
);

const QuickActions: FC = () => {
  const { address } = useAccount();
  const currentChainId = useChainId();

  // State to manage selected token (similar to modals)
  const [selectedToken, setSelectedToken] = useState<SupportedToken>(
    SUPPORTED_TOKENS[0],
  );

  // Get the current token based on connected chain (for initial value)
  const currentToken = useMemo((): SupportedToken => {
    // Map chain IDs to chain names
    const chainIdToName: Record<number, string> = {
      8453: "Base",
      1135: "Lisk",
      534352: "Scroll",
      42161: "Arbitrum",
    };

    const chainName = chainIdToName[currentChainId];

    // Find a token for the current chain (prefer USDC if available)
    const tokensForChain = SUPPORTED_TOKENS.filter(
      (token) => token.chain === chainName,
    );
    const preferredToken =
      tokensForChain.find((token) => token.symbol === "USDC") ||
      tokensForChain[0];

    // Default to Base USDC if no token found for current chain
    return (
      preferredToken ||
      SUPPORTED_TOKENS.find(
        (token) => token.symbol === "USDC" && token.chain === "Base",
      ) ||
      SUPPORTED_TOKENS[0]
    );
  }, [currentChainId]);

  // Initialize selectedToken with currentToken on mount or chain change
  useEffect(() => {
    setSelectedToken(currentToken);
  }, [currentToken]);

  // Fetch balance for the selected token (not currentToken)
  const { data: tokenBalanceData } = useBalance({
    address: address,
    token: selectedToken.tokenAddress as `0x${string}`,
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

  const tokenBalance = parseFloat(tokenBalanceData?.formatted || "0");

  // Use Element Pay OffRamp rate from fee-structure API (same as SendCryptoModal)
  const [elementPayRate, setElementPayRate] = useState<number | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState<boolean>(true);

  useEffect(() => {
    const fetchElementPayRate = async () => {
      setIsLoadingRate(true);
      try {
        const currency = getApiCurrencyFromToken(selectedToken.symbol);

        // Use fee-structure API which provides base_rate (same as SendCryptoModal)
        const feeData = await fetchFeeStructureCached({
          token: currency,
          action: "OffRamp",
        });

        const rate = feeData.data.base_rate;
        if (rate && rate > 0) {
          console.log(
            "[QuickActions] Fee structure rate:",
            rate,
            "KES per",
            selectedToken.symbol,
          );
          setElementPayRate(rate);
        } else {
          console.warn("[QuickActions] No valid base_rate in fee structure");
          setElementPayRate(null);
        }
      } catch (error) {
        console.error("[QuickActions] Error fetching fee structure:", error);
        setElementPayRate(null);
      } finally {
        setIsLoadingRate(false);
      }
    };

    fetchElementPayRate();
    // Refresh every 2 minutes to stay in sync with modal
    const intervalId = setInterval(fetchElementPayRate, 2 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [selectedToken.symbol]);

  const rawKesBalance = () => {
    if (isLoadingRate || !elementPayRate) return "Loading...";

    const kesAmount = tokenBalance * elementPayRate;
    return kesAmount.toFixed(2);
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-2xl border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-600 mb-1">
            Wallet Balance ({selectedToken.symbol} on {selectedToken.chain})
          </p>
          <p className="text-3xl font-bold text-gray-900">
            <span>KES </span>
            <span className="text-emerald-600">{rawKesBalance()}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {tokenBalance.toFixed(16)} {selectedToken.symbol}
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

      {/* Network/Token Selector */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-2">
          Select Network
        </label>
        <TokenDropdown selected={selectedToken} onSelect={setSelectedToken} />
      </div>

      <div className="flex gap-3 flex-wrap">
        <SendCryptoModal />

        <DepositCryptoModal />
      </div>
    </div>
  );
};

export default QuickActions;
