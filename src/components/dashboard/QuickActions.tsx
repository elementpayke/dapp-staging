"use client";
import React, { FC, useState, useEffect } from "react";
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Bell,
  MoreHorizontal,
  Wallet,
} from "lucide-react"; // Import icons
import { useWallet } from "@/context/WalletContext";
import SendCryptoModal from "./sendCrypto/SendCryptoModal";
import DepositCryptoModal from "./depositCrypto/DepositCryptoModal";

const QuickActions: FC = () => {
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const { usdcBalance } = useWallet(); // Fetch USDC balance from wallet context
  const MARKUP_PERCENTAGE = 1.5; // 1.5% markup

  // Fetch exchange rate from Coinbase API
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch(
          "https://api.coinbase.com/v2/exchange-rates?currency=USDC"
        );
        const data = await response.json();
        if (data?.data?.rates?.KES) {
          const baseRate = parseFloat(data.data.rates.KES);
          const markupRate = baseRate * (1 - MARKUP_PERCENTAGE / 100);
          setExchangeRate(markupRate);
        } else {
          console.error("KES rate not found");
          setExchangeRate(null);
        }
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
        setExchangeRate(null);
      }
    };

    fetchExchangeRate();
  }, []);

  // Calculate fiat wallet balance in KES
  const fiatBalanceKES = exchangeRate
    ? (usdcBalance * exchangeRate).toFixed(2)
    : "Loading...";

  return (
    <div className="p-6 bg-white shadow-lg rounded-2xl border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-600 mb-1">Fiat Balance</p>
          <p className="text-3xl font-bold text-gray-900">
            KES <span className="text-emerald-600">{fiatBalanceKES}</span>
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
