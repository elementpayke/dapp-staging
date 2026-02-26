"use client";
import React, { FC, useState, useEffect } from "react";
import { Bell, MoreHorizontal, Wallet } from "lucide-react";
import { useBalance, useAccount } from "wagmi";
import dynamic from "next/dynamic";
import {
  getApiCurrencyFromToken,
  fetchFeeStructureCached,
} from "@/utils/feeStructure";
import { useSelectedToken } from "@/context/TokenContext";
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
  
  // Use shared token context for consistent token selection across modals
  const { selectedToken, selectTokenAndSwitchChain, isCorrectNetwork, isSwitchingChain } = useSelectedToken();

  // Fetch balance for the selected token
  const { data: tokenBalanceData, isLoading: isBalanceLoading } = useBalance({
    address: address,
    token: selectedToken.tokenAddress as `0x${string}`,
    query: {
      enabled: isCorrectNetwork && !!address,
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
    if (isSwitchingChain) return "Switching...";
    if (!isCorrectNetwork) return "Switch network";
    if (isBalanceLoading) return "Loading...";
    if (isLoadingRate || !elementPayRate) return "Loading...";

    const kesAmount = tokenBalance * elementPayRate;
    return kesAmount.toFixed(2);
  };

  return (
    <div>
      {/* ── My Wallet title — outside the card ── */}
      <div className="flex items-center gap-2 mb-3">
        <Wallet size={22} className="text-gray-900" />
        <h2 className="text-2xl font-bold text-gray-900 antialiased">My Wallet</h2>
      </div>

    <div className="p-6 bg-white rounded-2xl border border-gray-200">

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">
            Wallet Balance
          </p>
          <p className="text-3xl font-bold text-gray-900">
            <span>KES </span>
            <span className={`${isCorrectNetwork ? 'text-emerald-600' : 'text-yellow-600'}`}>
              {rawKesBalance()}
            </span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {isCorrectNetwork ? (
              <>
                {tokenBalance.toFixed(6)} {selectedToken.symbol}
              </>
            ) : (
              <span className="text-yellow-600">
                Please switch to {selectedToken.chain} network
              </span>
            )}
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

      {/* Token/Network Selector */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-2">Select Token & Network</label>
        <div className="relative">
          <TokenDropdown
            selected={selectedToken}
            onSelect={selectTokenAndSwitchChain}
          />
          {isSwitchingChain && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
              <span className="text-sm text-blue-600 font-medium animate-pulse">
                Switching network...
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <SendCryptoModal />
        <DepositCryptoModal />
      </div>
    </div>
    </div>
  );
};

export default QuickActions;
