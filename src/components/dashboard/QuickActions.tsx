"use client";
import React, { FC, useState, useEffect, useRef } from "react";
import { Bell, Eye, EyeOff, MoreHorizontal, Check } from "lucide-react";
import { useBalance } from "wagmi";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  getApiCurrencyFromToken,
  fetchFeeStructureCached,
} from "@/utils/feeStructure";
import { useSelectedToken } from "@/context/TokenContext";
import { useWallet } from "@/hooks/useWallet";
import TokenDropdown from "@/components/ui/TokenDropdown";
import { useAuthStore } from "@/stores/authStore";
import { useBalanceVisibilityStore } from "@/stores/balanceVisibilityStore";

import ARBITRUM_LOGO from "@/assets/ARBITRUM_LOGO.png";
import BASE_LOGO from "@/assets/BASE_LOGO.png";
import LISK_LOGO from "@/assets/LISK_LOGO.png";
import SCROLL_LOGO from "@/assets/SCROLL_LOGO.png";
import POLYGON_LOGO from "@/assets/POLYGON_LOGO.png";
import BNB_LOGO from "@/assets/BNB_LOGO.png";

const NETWORK_LOGOS: Record<string, typeof ARBITRUM_LOGO> = {
  Arbitrum: ARBITRUM_LOGO,
  Base: BASE_LOGO,
  Lisk: LISK_LOGO,
  Scroll: SCROLL_LOGO,
  Polygon: POLYGON_LOGO,
  "BNB Chain": BNB_LOGO,
};

// Dynamically import modals with no SSR to prevent wagmi context issues
const SendCryptoModal = dynamic(() => import("./sendCrypto/SendCryptoModal"), {
  ssr: false,
});
const DepositCryptoModal = dynamic(
  () => import("./depositCrypto/DepositCryptoModal"),
  { ssr: false },
);
const WalletTransferModal = dynamic(
  () => import("./walletTransfer/WalletTransferModal"),
  { ssr: false },
);

const QuickActions: FC = () => {
  const { address } = useWallet();

  const { selectedToken, selectTokenAndSwitchChain, isCorrectNetwork, isSwitchingChain } = useSelectedToken();
  const isEmbeddedWallet = useAuthStore((s) => s.walletPreference) === "embedded";

  const balanceHidden = useBalanceVisibilityStore((s) => s.balanceHidden);
  const hideMode = useBalanceVisibilityStore((s) => s.hideMode);
  const toggleBalanceVisibility = useBalanceVisibilityStore((s) => s.toggleBalanceHidden);
  const setHideMode = useBalanceVisibilityStore((s) => s.setHideMode);

  const [visibilityMenuOpen, setVisibilityMenuOpen] = useState(false);
  const visibilityMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!visibilityMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (visibilityMenuRef.current && !visibilityMenuRef.current.contains(e.target as Node)) {
        setVisibilityMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [visibilityMenuOpen]);

  const isBlurMode = hideMode === "blur";
  const isStarsMode = hideMode === "stars";
  const maskedStars = "••••••";

  const { data: tokenBalanceData, isLoading: isBalanceLoading } = useBalance({
    address: (address ?? undefined) as `0x${string}` | undefined,
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

  const [elementPayRate, setElementPayRate] = useState<number | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState<boolean>(true);

  useEffect(() => {
    const fetchElementPayRate = async () => {
      setIsLoadingRate(true);
      try {
        const currency = getApiCurrencyFromToken(selectedToken.symbol);
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
            <button
              onClick={toggleBalanceVisibility}
              className="ml-2 inline-flex items-center justify-center p-1 rounded-full hover:bg-[var(--ep-accent-muted)] transition-colors duration-150 align-middle"
              aria-label={balanceHidden ? "Show balance" : "Hide balance"}
            >
              {balanceHidden ? (
                <EyeOff size={13} className="text-[var(--ep-muted)] hover:text-[var(--ep-accent)]" />
              ) : (
                <Eye size={13} className="text-[var(--ep-muted)] hover:text-[var(--ep-accent)]" />
              )}
            </button>
          </p>
          <p className="text-2xl font-bold text-[var(--ep-heading)] leading-tight">
            <span>KES </span>
            <span
              className={`${isCorrectNetwork ? "text-[var(--ep-accent)]" : "text-yellow-600"} ${
                balanceHidden && isBlurMode ? "blur-md select-none" : ""
              } transition-all duration-200`}
            >
              {balanceHidden && isStarsMode ? maskedStars : rawKesBalance()}
            </span>
          </p>
          <p
            className={`text-sm text-[var(--ep-muted)] mt-1 ${
              balanceHidden && isBlurMode ? "blur-md select-none" : ""
            } transition-all duration-200`}
          >
            {isCorrectNetwork ? (
              balanceHidden && isStarsMode ? (
                <>
                  {maskedStars} {selectedToken.symbol}
                </>
              ) : (
                <>
                  {tokenBalance.toFixed(6)} {selectedToken.symbol}
                </>
              )
            ) : (
              <span className="text-yellow-600">
                Please switch to {selectedToken.chain} network
              </span>
            )}
          </p>

          {/* Token/Network Selector */}
          <div className="mt-3 mb-3">
            <label className="block text-xs font-medium text-[var(--ep-muted)] mb-1.5">
              Select Token & Network
            </label>
            <div className="relative">
              <TokenDropdown
                selected={selectedToken}
                onSelect={selectTokenAndSwitchChain}
                isEmbeddedWallet={isEmbeddedWallet}
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

          {/* ── Action buttons ─────────────────────────────────────────── */}
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            <SendCryptoModal />
            <DepositCryptoModal />
            <WalletTransferModal />
          </div>
        </div>

        {/* Right: Connected Network Indicator & Logo — hidden on mobile */}
        <div className="hidden md:flex flex-col items-end justify-between min-h-[15vh] ml-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--ep-border)] bg-[var(--ep-bg-card)]">
              <span
                className={`w-2 h-2 rounded-full ${
                  isCorrectNetwork ? "bg-green-500" : "bg-yellow-500"
                } shrink-0`}
              />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ep-muted)] whitespace-nowrap">
                Connected Network : {selectedToken.chain.toUpperCase()}
              </span>
            </div>
            <button className="p-2 rounded-full border border-[var(--ep-border)] hover:bg-[var(--ep-accent-subtle)] transition-colors">
              <Bell size={18} className="text-[var(--ep-muted)]" />
            </button>
            <div className="relative" ref={visibilityMenuRef}>
              <button
                onClick={() => setVisibilityMenuOpen((o) => !o)}
                className="p-2 rounded-full border border-[var(--ep-border)] hover:bg-[var(--ep-accent-subtle)] transition-colors"
                aria-label="Visibility settings"
                aria-haspopup="menu"
                aria-expanded={visibilityMenuOpen}
              >
                <MoreHorizontal size={18} className="text-[var(--ep-muted)]" />
              </button>
              {visibilityMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 z-20 rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-card)] shadow-[var(--ep-card-shadow)] p-2"
                >
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ep-muted)]">
                    Visibility Settings
                  </p>
                  <p className="px-3 pb-2 text-[11px] text-[var(--ep-muted)]">
                    Choose how to hide your balance
                  </p>
                  <button
                    role="menuitemradio"
                    aria-checked={isBlurMode}
                    onClick={() => setHideMode("blur")}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-[var(--ep-accent-subtle)] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded border border-[var(--ep-border)]">
                        {isBlurMode && <Check size={12} className="text-[var(--ep-accent)]" />}
                      </span>
                      <span className="text-sm text-[var(--ep-heading)]">Blur effect</span>
                    </span>
                    <span className="text-xs text-[var(--ep-muted)] blur-[3px] select-none">
                      1234
                    </span>
                  </button>
                  <button
                    role="menuitemradio"
                    aria-checked={isStarsMode}
                    onClick={() => setHideMode("stars")}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-[var(--ep-accent-subtle)] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded border border-[var(--ep-border)]">
                        {isStarsMode && <Check size={12} className="text-[var(--ep-accent)]" />}
                      </span>
                      <span className="text-sm text-[var(--ep-heading)]">Hide with ••••</span>
                    </span>
                    <span className="text-xs text-[var(--ep-muted)]">••••</span>
                  </button>
                </div>
              )}
            </div>
          </div>
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