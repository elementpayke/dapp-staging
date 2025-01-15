import React, { useState } from "react";
import { X, ArrowLeft } from "lucide-react";

interface DepositCryptoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WalletOption {
  id: string;
  icon: string;
  selected?: boolean;
}

const DepositCryptoModal: React.FC<DepositCryptoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedWallet, setSelectedWallet] = useState<string>("metamask");
  const [selectedToken, setSelectedToken] = useState("USDC");
  const [amount, setAmount] = useState("10000.00");
  const [depositFrom, setDepositFrom] = useState("MPESA");
  const [phoneNumber, setPhoneNumber] = useState("0703417782");
  const [reason, setReason] = useState("Crypto deposit");
  const [favorite, setFavorite] = useState(true);
  const [usdcAmount, setUsdcAmount] = useState("9807.90"); // New state for USDC amount

  const handleClose = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const walletOptions: WalletOption[] = [
    {
      id: "metamask",
      icon: "🦊",
      selected: selectedWallet === "metamask",
    },
    {
      id: "coinbase",
      icon: "©️",
      selected: selectedWallet === "coinbase",
    },
    {
      id: "qr",
      icon: "🔲",
      selected: selectedWallet === "qr",
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start md:items-center justify-center z-50"
      onClick={handleClose}
    >
      <div className="bg-white w-full h-full md:h-auto md:rounded-3xl md:max-w-4xl overflow-auto">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="md:hidden p-1" type="button">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                Deposit Crypto
              </h2>
            </div>
            <button
              onClick={onClose}
              className="hidden md:block p-2 hover:bg-gray-100 rounded-full transition-colors"
              type="button"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            {/* Left Column - Form */}
            <div className="md:col-span-3 space-y-6">
              {/* Wallet Selection */}
              <div>
                <label className="block text-gray-600 mb-2">
                  Select wallet to deposit crypto
                </label>
                <div className="flex gap-2">
                  {walletOptions.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => setSelectedWallet(wallet.id)}
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center text-2xl border-2 transition-all ${
                        selectedWallet === wallet.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                      type="button"
                    >
                      {wallet.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Token and Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 mb-2">Token</label>
                  <select
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                    className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
                  >
                    <option value="USDC">USDC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">
                    Amount in KE
                  </label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              {/* Deposit From and USDC Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 mb-2">From</label>
                  <select
                    value={depositFrom}
                    onChange={(e) => setDepositFrom(e.target.value)}
                    className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
                  >
                    <option value="MPESA">MPESA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">
                    USDC to receive
                  </label>
                  <input
                    type="text"
                    value={usdcAmount}
                    onChange={(e) => setUsdcAmount(e.target.value)}
                    className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
                    placeholder="USDC amount"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-2">Phone Number</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
                  placeholder="Enter phone number"
                />
              </div>

              {/* Payment Reason */}
              <div>
                <label className="block text-gray-600 mb-2">
                  Payment reason (Optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
                  placeholder="Enter payment reason"
                />
              </div>

              {/* Favorite Option */}
              <div className="flex items-center gap-2">
                <input
                  id="favorite"
                  type="checkbox"
                  checked={favorite}
                  onChange={(e) => setFavorite(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="favorite" className="text-gray-600 text-sm">
                  Favorite this payment details for future transactions
                </label>
              </div>

              {/* Mobile View Confirm Button */}
              <div className="md:hidden space-y-4">
                <button
                  type="button"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-full font-medium"
                >
                  Confirm Payment
                </button>

                <p className="text-sm text-gray-500 text-center px-4">
                  At the moment, ElementsPay only allow users to deposit USDC to
                  the wallet used at registration. However, we will soon allow
                  the deposit of other tokens.
                </p>
              </div>
            </div>

            {/* Right Column - Transaction Summary (Hidden on Mobile) */}
            <div className="hidden md:block md:col-span-2 bg-gray-50 p-4 rounded-2xl h-fit">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Transaction summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Wallet balance</span>
                  <span className="text-green-600 font-medium">
                    USDC 197.90
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount to send</span>
                  <span className="text-gray-900">USDC 9807.90</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Transaction charge</span>
                  <span className="text-orange-600">KE 0.00</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center font-medium">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">KE 9811.40</span>
                </div>
              </div>

              <button
                type="button"
                className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity"
              >
                Confirm payment
              </button>

              <div className="mt-4 bg-gray-100 p-3 rounded-lg">
                <div className="text-gray-500 mb-1">
                  Crypto Balance after transaction
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">USDC: 18908.00</span>
                  <span className="text-gray-600">KE 10000.40</span>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-500">
                At the moment, ElementsPay only allow users to deposit USDC to
                the wallet used at registration. However, we will soon allow the
                deposit of other tokens.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositCryptoModal;
