"use client";

import { FC, useState } from "react";
import SendCryptoModal from "./sendCrypto/SendCryptoModal";
import DepositCryptoModal from "./depositCrypto/DepositCryptoModal";
import { ArrowUpRight, ArrowDown, Wallet } from "lucide-react"; // Import icons

const QuickActions: FC = () => {
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  return (
    <div className="space-y-6 p-6 bg-white shadow-xl rounded-2xl">
      <h2 className="text-xl font-bold text-gray-900">🚀 Quick Pay</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Send Crypto Button */}
        <button
          onClick={() => setIsSendModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-500 text-white text-lg font-semibold py-4 rounded-xl shadow-lg hover:opacity-90 transition-all"
        >
          <ArrowUpRight size={24} />
          Send Crypto
        </button>

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
          Fiat Balance: <span className="text-green-600 font-bold">KES 89,899.87</span>
        </button>
      </div>

      {/* Modals */}
      <SendCryptoModal isOpen={isSendModalOpen} onClose={() => setIsSendModalOpen(false)} />
      <DepositCryptoModal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} />
    </div>
  );
};

export default QuickActions;
