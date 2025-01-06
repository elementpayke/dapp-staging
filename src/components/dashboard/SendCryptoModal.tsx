import React, { useState } from "react";
import { X } from "lucide-react";

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

  const walletBalance = "KE 19807.90";
  const amountToSend = "KE 9807.90";
  const transactionCharge = "KE 3.50";
  const total = "KE 9811.40";
  const cryptoBalance = {
    amount: "0.0000246",
    currency: "ETH",
    value: "KE 10000.40",
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
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

          <div className="grid grid-cols-5 gap-8">
            {/* Left Column - Form */}
            <div className="col-span-3 space-y-6">
              {/* Payment Type Selection */}
              <div className="flex gap-4">
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    paymentType === "bank"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                  onClick={() => setPaymentType("bank")}
                  type="button"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                    {paymentType === "bank" && (
                      <div className="w-2.5 h-2.5 bg-current rounded-full" />
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
                  <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                    {paymentType === "mobile" && (
                      <div className="w-2.5 h-2.5 bg-current rounded-full" />
                    )}
                  </div>
                  Pay to Mobile Money
                </button>
              </div>

              {/* Wallet Selection */}
              <div>
                <label className="block text-gray-600 mb-3">
                  Select wallet to pay from
                </label>
                <div className="flex gap-3">
                  {walletOptions.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => setSelectedWallet(wallet.id)}
                      className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl border-2 transition-all ${
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="token" className="block text-gray-600 mb-3">
                    Token
                  </label>
                  <select
                    id="token"
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-lg border-0 text-gray-900"
                  >
                    <option value="USDC">USDC</option>
                    <option value="ETH">ETH</option>
                    <option value="BTC">BTC</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="amount" className="block text-gray-600 mb-3">
                    Amount in KE
                  </label>
                  <input
                    id="amount"
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-lg border-0 text-gray-900"
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bank" className="block text-gray-600 mb-3">
                    Recipient Bank
                  </label>
                  <select
                    id="bank"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-lg border-0 text-gray-900"
                  >
                    <option value="Equity Bank">Equity Bank</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="accountNumber"
                    className="block text-gray-600 mb-3"
                  >
                    Account Number
                  </label>
                  <input
                    id="accountNumber"
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-lg border-0 text-gray-900"
                  />
                </div>
              </div>

              {/* Payment Reason */}
              <div>
                <label htmlFor="reason" className="block text-gray-600 mb-3">
                  Payment reason (Optional)
                </label>
                <input
                  id="reason"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-lg border-0 text-gray-900"
                  placeholder="Enter payment reason"
                />
              </div>

              {/* Favorite Option */}
              <div className="flex items-center gap-3">
                <input
                  id="favorite"
                  type="checkbox"
                  checked={favorite}
                  onChange={(e) => setFavorite(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="favorite" className="text-gray-600">
                  Favorite this payment details for future transactions
                </label>
              </div>
            </div>

            {/* Right Column - Transaction Summary */}
            <div className="col-span-2 bg-gray-50 p-6 rounded-2xl h-fit">
              <h3 className="text-xl font-semibold mb-6 text-gray-900">
                Transaction summary
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Wallet balance</span>
                  <span className="text-green-600 font-medium">
                    {walletBalance}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount to send</span>
                  <span className="text-gray-900">{amountToSend}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Transaction charge</span>
                  <span className="text-orange-600">{transactionCharge}</span>
                </div>
                <div className="border-t pt-4 flex justify-between items-center font-medium">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">{total}</span>
                </div>
              </div>

              <button
                type="button"
                className="w-full mt-6 py-4 px-6 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity"
              >
                Confirm payment
              </button>

              <div className="mt-6 bg-gray-100 p-4 rounded-lg">
                <div className="text-gray-500 mb-2">
                  Crypto Balance after transaction
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {cryptoBalance.currency}: {cryptoBalance.amount}
                  </span>
                  <span className="text-gray-600">{cryptoBalance.value}</span>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-500">
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
