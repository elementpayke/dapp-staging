import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { parseUnits } from 'ethers';
import { getUSDCAddress } from '../../../services/tokens';
import { useContract } from "@/services/useContract";
import { encryptMessage } from "@/services/encryption";
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
  if (!isOpen) return null;
  const [selectedWallet, setSelectedWallet] = useState<string>("metamask");
  const [selectedToken, setSelectedToken] = useState("USDC");
  const [amount, setAmount] = useState("0.00");
  const [depositFrom, setDepositFrom] = useState("MPESA");
  const [phoneNumber, setPhoneNumber] = useState("0703417782");
  const [reason, setReason] = useState("Transport");
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);


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

  const { contract, address } = useContract();
  
  
  const MARKUP_PERCENTAGE = 1.5;

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch(
        "https://api.coinbase.com/v2/exchange-rates?currency=USDC"
      );
      const data = await response.json();

      if (data?.data?.rates?.KES) {
        const baseRate = parseFloat(data.data.rates.KES);
        const markupRate = baseRate * (1 - MARKUP_PERCENTAGE / 100);
        console.log("Exchange rate:", markupRate);
        console.log("Base rate:", baseRate);
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

  useEffect(() => {
    fetchExchangeRate();
  }, [isOpen]);

  
  
  const handleConfirmPayment = async () => {
    if (!address) {
      // TODO: Show a modal to connect wallet
      toast.error("Please connect your wallet first.");
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error("Amount must be greater than zero.");
      return;
    }

    // if (!/^\d{12}$/.test(phoneNumber)) {
    //   console.error("Invalid phone number");
    //   toast.error("Please enter a valid 12-digit phone number.");
    //   return;
    // }

    setIsLoading(true);

    const orderType = depositFrom === "MPESA" ? 0 : 1;
    const usdcTokenAddress = getUSDCAddress() as `0x${string}`;

    const mpesaAmount = parseFloat(amount) * (exchangeRate ?? 1);

    let messageHash = "";
    try {
      messageHash = encryptMessage(phoneNumber, "USD", exchangeRate ?? 0, mpesaAmount);
    } catch (error) {
      toast.error("Encryption failed.");
      setIsLoading(false);
      return;
    }


    try {
      if (!contract) throw new Error("Contract is not initialized.");

      // Call the createOrder function on your contract
      const tx = await contract.createOrder(
        address,
        parseUnits(amount, 6),
        usdcTokenAddress,
        orderType,
        messageHash
      );
      
      // if (!tx) {
      //   throw new Error("Transaction was not returned.");
      // }
      toast.info("Transaction submitted. Awaiting confirmation...");
      // TODO: Handle transaction confirmation
      const receipt = await tx.wait();
      console.log("Transaction receipt:", receipt);
      toast.success("Order created successfully!");
      onClose();
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast.error(error?.message || "Transaction failed.");
    } finally {
      setIsLoading(false);
    }
  };

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
                  <span className="text-gray-600">KES Equivalent</span>
                  <span className="text-gray-900">
                    {exchangeRate ? (parseFloat(amount) * exchangeRate).toFixed(2) + " KES" : "Fetching..."}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Wallet balance</span>
                  <span className="text-green-600 font-medium">
                    {/* TODO: Use onchainkit to get USDC balance */}
                   Loading...
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount to send</span>
                  <span className="text-gray-900">USDC {amount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Transaction charge</span>
                  {/* TODO: Decide on the charge */}
                  <span className="text-orange-600">KE 0.00</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center font-medium">
                  <span className="text-gray-900">Total:</span>
                  {/* Update Total calculation */}
                  <span className="text-gray-900">KE {amount}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isLoading}
                className={`w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Processing..." : "Confirm payment"}
              </button>

              <div className="mt-4 bg-gray-100 p-3 rounded-lg">
                <div className="text-gray-500 mb-1">
                  Crypto Balance after transaction
                </div>
                <div className="flex justify-between">
                  {/* TODO: Calculate balance after transaction */}
                  <span className="text-gray-600">USDC: Loading....</span>
                  <span className="text-gray-600">KE Loading....</span>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-500">
                At the moment, ElementPay only allow users to deposit USDC to
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
