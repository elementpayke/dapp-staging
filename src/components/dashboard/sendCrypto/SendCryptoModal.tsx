import React, { useState } from "react";
import { X } from "lucide-react";
import PayToBank from "./PayToBank";
import PayToMobileMoney from "./PayToMobileMoney";

interface SendCryptoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WalletOption {
  id: string;
  icon: string;
  selected?: boolean;
}

const SendCryptoModal: React.FC<SendCryptoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [paymentType, setPaymentType] = useState<"bank" | "mobile">("bank");
  const [selectedToken, setSelectedToken] = useState("USDC");
  const [amount, setAmount] = useState("100");
  const [bank, setBank] = useState("Equity Bank");
  const [accountNumber, setAccountNumber] = useState("1170398667889");
  const [mobileNumber, setMobileNumber] = useState("0703417782");
  const [reason, setReason] = useState("Transport");
  const [favorite, setFavorite] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState<string>("metamask");

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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Spend Crypto
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              type="button"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-5 gap-6">
            {/* Left Column - Form */}
            <div className="col-span-3 space-y-4">
              {/* Payment Type Selection */}
              <div className="flex gap-3">
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    paymentType === "bank"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                  onClick={() => setPaymentType("bank")}
                  type="button"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                    {paymentType === "bank" && (
                      <div className="w-2 h-2 bg-current rounded-full" />
                    )}
                  </div>
                  Pay to Bank
                </button>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    paymentType === "mobile"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                  onClick={() => setPaymentType("mobile")}
                  type="button"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                    {paymentType === "mobile" && (
                      <div className="w-2 h-2 bg-current rounded-full" />
                    )}
                  </div>
                  Pay to Mobile Money
                </button>
              </div>

              {/* Wallet Selection */}
              {paymentType === "bank" && (
                <div>
                  <label className="block text-gray-600 mb-2">
                    Select wallet to pay from
                  </label>
                  <div className="flex gap-2">
                    {walletOptions.map((wallet) => (
                      <button
                        key={wallet.id}
                        onClick={() => setSelectedWallet(wallet.id)}
                        className={`w-14 h-14 rounded-lg flex items-center justify-center text-2xl border-2 transition-all ${
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
              )}

              {/* Payment Form */}
              {paymentType === "bank" ? (
                <PayToBank
                  selectedToken={selectedToken}
                  setSelectedToken={setSelectedToken}
                  amount={amount}
                  setAmount={setAmount}
                  bank={bank}
                  setBank={setBank}
                  accountNumber={accountNumber}
                  setAccountNumber={setAccountNumber}
                  reason={reason}
                  setReason={setReason}
                />
              ) : (
                <PayToMobileMoney
                  selectedToken={selectedToken}
                  setSelectedToken={setSelectedToken}
                  amount={amount}
                  setAmount={setAmount}
                  mobileNumber={mobileNumber}
                  setMobileNumber={setMobileNumber}
                  reason={reason}
                  setReason={setReason}
                />
              )}

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
            </div>

            {/* Right Column - Transaction Summary */}
            <div className="col-span-2 bg-gray-50 p-4 rounded-2xl h-fit">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Transaction summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Wallet balance</span>
                  <span className="text-green-600 font-medium">
                    KE 19807.90
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount to send</span>
                  <span className="text-gray-900">KE 9807.90</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Transaction charge</span>
                  <span className="text-orange-600">KE 3.50</span>
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
                  <span className="text-gray-600">ETH: 0.0000246</span>
                  <span className="text-gray-600">KE 10000.40</span>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-500">
                We&apos;ll use your available balance when you shop online or
                send money for goods and services. If you don&apos;t have enough
                money in your balance, we&apos;ll ask you to pick another wallet
                at checkout.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendCryptoModal;
