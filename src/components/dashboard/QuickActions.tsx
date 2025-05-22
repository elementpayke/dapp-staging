"use client";
import React, { FC } from "react";
import { Bell, MoreHorizontal } from "lucide-react"; // Import icons

import SendCryptoModal from "./sendCrypto/SendCryptoModal";
import DepositCryptoModal from "./depositCrypto/DepositCryptoModal";
import { useWallet } from "@/hooks/useWallet";
import { useExchangeRate } from "@/lib/useExchangeRate";

const QuickActions: FC = () => {
  const { usdcBalance } = useWallet();
  const { exchangeRate, isLoading } = useExchangeRate();
  const formattedKesBalance = () => {
    if (isLoading || !exchangeRate) return "Loading...";

    const kesAmount = usdcBalance * exchangeRate;
    return new Intl.NumberFormat("en-KE", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(kesAmount);
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-2xl border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-600 mb-1">Fiat Balance</p>
          <p className="text-3xl font-bold text-gray-900">
            KES{" "}
            <span className="text-emerald-600">{formattedKesBalance()}</span>
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
