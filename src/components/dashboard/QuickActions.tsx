"use client";
import React, { FC, useState, useEffect } from "react";
import SendCryptoModal from "./sendCrypto/SendCryptoModal";
import DepositCryptoModal from "./depositCrypto/DepositCryptoModal";
import { ArrowUpRight, ArrowDown, Wallet } from "lucide-react"; // Import icons
import { useWallet } from "@/context/WalletContext";

const QuickActions: FC = () => {
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
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
    <div className="space-y-6 p-6 bg-white shadow-xl rounded-2xl">
      <h2 className="text-xl font-bold text-gray-900">🚀 Quick Pay</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Send Crypto Button */}
        <SendCryptoModal />

        {/* Deposit Crypto Button */}
        <button
          onClick={() => setIsDepositModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-teal-400 text-white text-lg font-semibold py-4 rounded-xl shadow-lg hover:opacity-90 transition-all"
        >
          <ArrowDown size={24} />
          Deposit Crypto
        </button>

        {/* Fiat Balance Button */}
        <button className="flex items-center justify-center gap-2 bg-gray-100 text-gray-800 text-lg font-semibold py-4 rounded-xl shadow-md hover:bg-gray-200 transition-all">
          <Wallet size={24} />
          Fiat Balance:{" "}
          <span className="text-green-600 font-bold">KES {fiatBalanceKES}</span>
        </button>
      </div>

      {/* Modals */}

      <DepositCryptoModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />
    </div>
  );
};

export default QuickActions;
