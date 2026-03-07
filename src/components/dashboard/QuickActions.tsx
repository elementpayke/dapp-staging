"use client";
import React, { FC, useState, useEffect } from "react";
import { Bell, MoreHorizontal } from "lucide-react";
import { useBalance, useAccount } from "wagmi";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  getApiCurrencyFromToken,
  fetchFeeStructureCached,
} from "@/utils/feeStructure";
import { useSelectedToken } from "@/context/TokenContext";
import TokenDropdown from "@/components/ui/TokenDropdown";

import ARBITRUM_LOGO from "@/assets/ARBITRUM_LOGO.png";
import BASE_LOGO from "@/assets/BASE_LOGO.png";
import LISK_LOGO from "@/assets/LISK_LOGO.png";
import SCROLL_LOGO from "@/assets/SCROLL_LOGO.png";

const NETWORK_LOGOS: Record<string, typeof ARBITRUM_LOGO> = {
  Arbitrum: ARBITRUM_LOGO,
  Base: BASE_LOGO,
  Lisk: LISK_LOGO,
  Scroll: SCROLL_LOGO,
};

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

  const networkLogo = NETWORK_LOGOS[selectedToken.chain];

  return (
    <div className="p-4 sm:p-5 bg-[var(--ep-bg-card)] shadow-[var(--ep-card-shadow)] rounded-2xl border border-[var(--ep-border)] relative">
      <div className="flex flex-col md:flex-row items-start justify-between mb-0 min-h-[15vh]">
        {/* Left: Balance & Token Selector */}
        <div className="flex-1 min-w-0 h-fit">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ep-muted)] mb-0.5">
            Wallet Balance
          </p>
          <p className="text-2xl font-bold text-[var(--ep-heading)] leading-tight">
            <span>KES </span>
            <span className={`${isCorrectNetwork ? 'text-[var(--ep-accent)]' : 'text-yellow-600'}`}>
              {rawKesBalance()}
            </span>
          </p>
          <p className="text-sm text-[var(--ep-muted)] mt-1">
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

          {/* Token/Network Selector */}
          <div className="mt-3 mb-3">
            <label className="block text-xs font-medium text-[var(--ep-muted)] mb-1.5">Select Token & Network</label>
            <div className="relative">
              <TokenDropdown
                selected={selectedToken}
                onSelect={selectTokenAndSwitchChain}
              />
              {isSwitchingChain && (
                <div className="absolute inset-0 bg-[var(--ep-bg-card)]/50 flex items-center justify-center rounded-lg">
                  <span className="text-sm text-[var(--ep-accent)] font-medium animate-pulse">
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

        {/* Right: Connected Network Indicator & Logo — hidden on mobile */}
        <div className="hidden md:flex flex-col items-end justify-between min-h-[15vh] ml-4 shrink-0">
          {/* Connected Network Badge + Action Buttons */}
          <div className="flex items-center gap-2 ">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--ep-border)] bg-[var(--ep-bg-card)]">
              <span className={`w-2 h-2 rounded-full ${isCorrectNetwork ? 'bg-green-500' : 'bg-yellow-500'} shrink-0`} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ep-muted)] whitespace-nowrap">
                Connected Network : {selectedToken.chain.toUpperCase()}
              </span>
            </div>
            <button className="p-2 rounded-full border border-[var(--ep-border)] hover:bg-[var(--ep-accent-subtle)] transition-colors">
              <Bell size={18} className="text-[var(--ep-muted)]" />
            </button>
            <button className="p-2 rounded-full border border-[var(--ep-border)] hover:bg-[var(--ep-accent-subtle)] transition-colors">
              <MoreHorizontal size={18} className="text-[var(--ep-muted)]" />
            </button>
          </div>

          {/* Network Logo - Moved to bottom right absolute positioning */}
        </div>
      </div>

      {networkLogo && (
        <div className="hidden md:flex flex-col items-end absolute bottom-5 right-5 z-0 opacity-80 pointer-events-none">
          <Image
            src={networkLogo}
            alt={`${selectedToken.chain} logo`}
            width={180}
            height={180}
            className="object-contain"
            priority
          />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--ep-muted)] mt-1 ml-4">
            Proud Partners
          </span>
        </div>
      )}
    </div>
  );
};

export default QuickActions;
