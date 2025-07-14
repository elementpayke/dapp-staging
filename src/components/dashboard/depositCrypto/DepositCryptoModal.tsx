import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { toast } from "react-toastify";
import { useAccount, useSwitchChain } from "wagmi";
import TransactionInProgressModal from "./TranactionInProgress";
import DepositCryptoReceipt from "./DepositCryptoReciept";
import { createOnRampOrder } from "@/app/api/aggregator";
import { validateKenyanPhoneNumber, formatKenyanPhoneNumber } from "@/utils/phoneValidation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useWallet } from "@/hooks/useWallet";
import { TransactionReceipt } from "@/types/types";
import TokenDropdown from "@/components/ui/TokenDropdown";
import { SUPPORTED_TOKENS, SupportedToken } from "@/constants/supportedTokens";

// Import the CreateOrderResponse type
interface CreateOrderResponse {
  tx_hash: string;
  status: string;
}

type OrderStatus =
  | "pending"
  | "processing"
  | "settled"
  | "complete"
  | "completed"
  | "failed";

const DepositCryptoModal: React.FC = () => {
  const { usdcBalance } = useWallet();
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<SupportedToken>(SUPPORTED_TOKENS[0]);
  const [amount, setAmount] = useState("0.00");
  const [depositFrom, setDepositFrom] = useState("MPESA");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [reason, setReason] = useState("Transport");
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; error?: string }>({ isValid: false });
  const [isValidatingPhone, setIsValidatingPhone] = useState(false);
  const TRANSACTION_FEE_RATE = 0.005;
  const addressOwner = useAccount();
  const { chain } = addressOwner;
  const { switchChain } = useSwitchChain();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const continuePollingRef = useRef<boolean>(true);

  // Get target chain ID based on selected token
  const getTargetChainId = () => {
    switch (selectedToken.chain) {
      case "Base":
        return 8453;
      case "Lisk":
        return 1135;
      case "Scroll":
        return 534352;
      case "Arbitrum":
        return 42161;
      default:
        return 8453; // Default to Base
    }
  };

  const MARKUP_PERCENTAGE = 0.5;

  const transactionSummary = useMemo(() => {
    if (!exchangeRate)
      return {
        kesAmount: 0,
        usdcAmount: 0,
        transactionCharge: 0,
        totalUSDC: 0,
        totalKES: 0,
        totalKESBalance: 0,
        walletBalance: usdcBalance ?? 0,
        remainingBalance: 0,
        usdcBalance: usdcBalance ?? 0,
      };

    const kesAmount = parseFloat(amount) * exchangeRate || 0;
    const usdcAmount = parseFloat(amount) || 0;
    const transactionCharge = usdcAmount * TRANSACTION_FEE_RATE;
    const totalUSDC = usdcAmount;
    const remainingBalance = (usdcBalance ?? 0) + totalUSDC;
    const totalKES = (usdcBalance ?? 0) * exchangeRate;
    const totalKESBalance = totalKES + kesAmount;

    return {
      kesAmount,
      usdcAmount,
      transactionCharge,
      totalUSDC,
      totalKES,
      totalKESBalance,
      walletBalance: usdcBalance ?? 0,
      remainingBalance: Math.max(remainingBalance, 0),
      usdcBalance: usdcBalance ?? 0,
    };
  }, [amount, exchangeRate, usdcBalance]);

  const [transactionReceipt, setTransactionReceipt] = useState<TransactionReceipt>({
    orderId: "",
    status: "pending",
    reason: "",
    amount: 0,
    amountUSDC: 0,
    transactionHash: "",
    address: "",
    phoneNumber: "",
  });

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch(
        "https://api.coinbase.com/v2/exchange-rates?currency=USDC"
      );
      const data = await response.json();

      if (data?.data?.rates?.KES) {
        const baseRate = parseFloat(data.data.rates.KES);
        const markupRate = baseRate * (1 + MARKUP_PERCENTAGE / 100);
        setExchangeRate(markupRate);
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      toast.error("Unable to fetch exchange rate");
    }
  };

const pollOrderStatusByTxHash = async (txHash: string) => {
  if (!txHash) return;

  const normalizedHash = txHash.startsWith("0x") ? txHash.slice(2) : txHash;

  try {
    const AGGREGATOR_URL = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${AGGREGATOR_URL}/orders/tx/${normalizedHash}`, {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_AGGR_API_KEY!
      }
    });

    if (response.status === 200) {
      const orderData = (await response.json()).data;

      const status = orderData.status?.toLowerCase();
      const txHashes = orderData.transaction_hashes || {};
      const settlementHash = txHashes.settlement || txHashes.creation || txHash;

      const getUserFriendlyError = (reason: string) => {
      const errorMap: { [key: string]: string } = {
        "Missing CheckoutRequestID in STK response.": "Invalid phone number. Please check and try again.",
        "Rule limited.": "This payment was rejected because a similar one was just sent. Please wait a moment and try again.",
        // Add more mappings here as needed
      };
      return errorMap[reason] || reason;
    };

      setTransactionReceipt({
        orderId: orderData.order_id,
        status,
        reason: status === "failed" ? getUserFriendlyError(orderData.failure_reason || "") : "",
        amount: orderData.amount_fiat,
        amountUSDC: orderData.amount_fiat / (exchangeRate ?? 1),
        transactionHash: settlementHash,
        address: orderData.wallet_address,
        phoneNumber: orderData.phone_number,
      });

      if (status === "settled" || status === "failed") {
        setIsTransactionModalOpen(false);
        setIsReceiptModalOpen(true);
        return;
      }
    }

    setTimeout(() => pollOrderStatusByTxHash(txHash), 3000);
  } catch (err) {
    console.error("Polling order by tx failed", err);
    toast.error("Could not verify order status. Try again.");
  }
};

  useEffect(() => {
    fetchExchangeRate();
  }, []);


  const handleConfirmPayment = async () => {
    if (!addressOwner.address) return toast.error("Please connect your wallet first.");
    if (parseFloat(amount) <= 0)
      return toast.error("Amount must be greater than zero.");

    // Check if connected to the correct chain for the selected token
    const targetChainId = getTargetChainId();
    if (chain?.id !== targetChainId) {
      try {
        await switchChain({ chainId: targetChainId });
        toast.success(`Switched to ${selectedToken.chain}. Please click Confirm again.`);
        return; // Exit so user can retry after chain switch
      } catch (error) {
        toast.error(`Please switch to ${selectedToken.chain} network to proceed.`);
        return;
      }
    }

    // Validate phone number before proceeding
    if (!phoneValidation.isValid) {
      if (phoneValidation.error) {
        toast.error(phoneValidation.error);
      } else {
        toast.error("Please enter a valid phone number");
      }
      return;
    }
    
    // Double-check with API validation if not already validated
    if (!phoneValidation.isValid) {
      const isValid = await validatePhoneWithBackend(phoneNumber);
      if (!isValid) {
        toast.error("Phone number validation failed. Please check and try again.");
        return;
      }
    }

    // Show processing state first
    setIsLoading(true);

    // Handle API call first, then show STK message
    const processOrder = async () => {
      try {
        console.log("🚀 Creating onramp order...");
        if (!addressOwner.address) {
          throw new Error("Wallet address is not available");
        }

        // Log token and chain details for debugging
        console.log("🔍 Token details:", {
          symbol: selectedToken.symbol,
          chain: selectedToken.chain,
          tokenAddress: selectedToken.tokenAddress,
          userAddress: addressOwner.address,
          amount: parseFloat(amount),
          phoneNumber,
          reason
        });

        // Add specific timeout for WXM orders
        const res = await Promise.race([
          createOnRampOrder({
            userAddress: addressOwner.address,
            tokenAddress: String(selectedToken.tokenAddress),
            amount: parseFloat(amount),
            phoneNumber,
            reason,
          }),
          new Promise((_, reject) => 
            setTimeout(() => 
              reject(new Error(`API request timed out after 45 seconds. The Element Pay service may be experiencing high load. Please try again in a few moments or contact support if the issue persists.`)), 
              45000
            )
          )
        ]);

        console.log("📡 API Response:", res);
        const txHash = (res as CreateOrderResponse)?.tx_hash;
        console.log("🔁 Starting poll for order created with tx:", txHash);

        if (!txHash) {
          throw new Error("No transaction hash received from API");
        }

        // Now show STK push message
        setIsConfirmModalOpen(false);
        setIsTransactionModalOpen(true);
        setIsLoading(false);

        // Reset transaction state
        setTransactionReceipt({
          orderId: "",
          status: "pending",
          reason: "",
          amount: 0,
          amountUSDC: 0,
          transactionHash: txHash,
          address: addressOwner.address || "",
          phoneNumber: phoneNumber,
        });
        continuePollingRef.current = true;

        // Start polling for status
        pollOrderStatusByTxHash(txHash);

      } catch (error: any) {
        console.error("Transaction failed:", error?.message || error);
        
        // Reset loading state
        setIsLoading(false);
        
        // Provide more specific error messages based on error type and token
        if (error.message?.includes("timeout") || error.message?.includes("504")) {
          if (selectedToken.symbol === "WXM") {
            toast.error("WXM onramp service is currently experiencing delays. This may be due to high network congestion on Arbitrum. Please try again in a few minutes or contact Element Pay support.");
          } else {
            toast.error("The Element Pay service is currently unavailable. This appears to be a server-side issue. Please try again in a few minutes or contact Element Pay support.");
          }
        } else if (error.message?.includes("temporarily unavailable")) {
          toast.error("Service is temporarily unavailable. Please try again later.");
        } else if (error.message?.includes("Too many requests")) {
          toast.error("Too many requests. Please wait a moment and try again.");
        } else if (error.message?.includes("Network error")) {
          toast.error("Network connectivity issue. Please check your internet connection and try again.");
        } else if (error.message?.includes("Authentication failed")) {
          toast.error("API authentication failed. Please contact support.");
        } else {
          toast.error(error?.message || "Transaction failed. Please try again.");
        }
      }
    };

    // Start the background process
    processOrder();
  };

  // Validate phone number (client-side only)
  const validatePhoneWithBackend = async (phoneNumber: string): Promise<boolean> => {
    setIsValidatingPhone(true);
    
    try {
      const result = validateKenyanPhoneNumber(phoneNumber);
      setPhoneValidation(result);
      return result.isValid;
    } finally {
      setIsValidatingPhone(false);
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedNumber = formatKenyanPhoneNumber(e.target.value);
    setPhoneNumber(formattedNumber);
    
    // Clear validation when user starts typing
    if (formattedNumber !== phoneNumber) {
      setPhoneValidation({ isValid: false });
    }
  };

  // Validate phone number when user stops typing (debounced)
  useEffect(() => {
    if (!phoneNumber) {
      setPhoneValidation({ isValid: false });
      return;
    }

    const timeoutId = setTimeout(() => {
      // Use only client-side validation
      const validation = validateKenyanPhoneNumber(phoneNumber);
      setPhoneValidation(validation);
    }, 1000); // 1 second delay

    return () => clearTimeout(timeoutId);
  }, [phoneNumber]);

  return (
    <>
    <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
      <DialogTrigger className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-400  text-white text-sm font-medium py-3 px-4 rounded-xl hover:bg-purple-700 transition-colors" onClick={() => setIsConfirmModalOpen(true)}>
        <ArrowUpRight size={24} />
        Deposit Crypto
      </DialogTrigger>


      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle> Deposit to Mobile Money</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Deposit Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Token */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Token
                </label>
                <div className="relative">
                  <TokenDropdown
                    selected={selectedToken}
                    onSelect={setSelectedToken}
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Amount in KES
                </label>
                <input
                  type="text"
                  className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={amount}
                  onChange={(e) => {
                    // Allow only numbers and decimal point
                    const newValue = e.target.value.replace(/[^\d.]/g, "");
                    setAmount(newValue);
                  }}
                  placeholder="0.00"
                />
              </div>

              {/* Deposit from */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Deposit from
                </label>
                <div className="relative">
                  <select
                    className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={depositFrom}
                    onChange={(e) => setDepositFrom(e.target.value)}
                  >
                    <option value="MPESA">MPESA</option>
                  </select>
                </div>
              </div>

              {/* Phone number */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Phone number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    className={`w-full p-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      phoneValidation.isValid 
                        ? 'focus:ring-green-500 border-green-200' 
                        : phoneNumber && !phoneValidation.isValid 
                        ? 'focus:ring-red-500 border-red-200' 
                        : 'focus:ring-blue-500'
                    }`}
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    placeholder="e.g. 0712345678"
                  />
                  {isValidatingPhone && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  {phoneValidation.isValid && !isValidatingPhone && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                {phoneNumber && !phoneValidation.isValid && phoneValidation.error && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {phoneValidation.error}
                  </p>
                )}
                {phoneValidation.isValid && (
                  <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Valid phone number
                  </p>
                )}
              </div>
            </div>

            {/* Reason - Full width */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Payment reason (Optional)
              </label>
              <input
                type="text"
                className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Transport"
              />
            </div>

            {/* Favorite checkbox */}
            <div className="flex items-center gap-2 pt-2">
              <input
                id="favorite-deposit"
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <label
                htmlFor="favorite-deposit"
                className="text-gray-600 text-sm"
              >
                Favorite this payment details for future transactions
              </label>
            </div>

            {/* Mobile Confirm Button - Only shown on small screens */}
            <div className="block lg:hidden pt-4">
              <button
                className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-400 text-white rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                onClick={handleConfirmPayment}
                disabled={isLoading || parseFloat(amount) <= 0 || !phoneValidation.isValid || isValidatingPhone}
              >
                {isLoading ? "Processing..." : isValidatingPhone ? "Validating..." : "Confirm Payment"}
              </button>
            </div>
          </div>

          {/* Right Column - Transaction Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 p-4 rounded-xl h-fit sticky top-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Transaction Summary
              </h3>

              {/* Main Summary */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Amount to send</span>
                  <span className="font-medium text-sm">
                    KES {parseFloat(amount || "0").toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">
                    {selectedToken.symbol} to receive
                  </span>
                  <span className="font-medium">
                    {selectedToken.symbol} {(parseFloat(amount || "0") / (exchangeRate || 127.3)).toFixed(6)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">
                    Transaction charge
                  </span>
                  <span className="text-orange-600 text-sm">
                    KES {(parseFloat(amount || "0") * TRANSACTION_FEE_RATE).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Wallet balance</span>
                  <span className="text-green-600 font-medium text-sm">
                    {selectedToken.symbol} {transactionSummary.walletBalance.toFixed(2)}
                  </span>
                </div>

                <div className="border-t pt-3 flex justify-between items-center font-semibold">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">
                    KES {parseFloat(amount || "0").toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Desktop Confirm Button */}
              <div className="hidden lg:block mb-4">
                <button
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-400 text-white rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
                  onClick={handleConfirmPayment}
                  disabled={isLoading || parseFloat(amount) <= 0 || !phoneValidation.isValid || isValidatingPhone}
                >
                  {isLoading ? "Processing..." : isValidatingPhone ? "Validating..." : "Confirm Payment"}
                </button>
              </div>

              {/* Balance after transaction */}
              <div className="bg-white border border-gray-200 p-3 rounded-lg mb-4">
                <div className="text-gray-600 mb-2 text-xs font-medium uppercase tracking-wider">
                  Balance After Transaction
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">
                    {selectedToken.symbol}: {transactionSummary.walletBalance.toFixed(2)}
                  </span>
                  <span className="text-gray-900 font-medium text-sm">
                    KE{" "}
                    {(
                      transactionSummary.walletBalance * (exchangeRate || 127.3)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Information text */}
              <div className="text-gray-500 text-xs leading-relaxed">
                ElementsPay allows you to deposit supported stablecoins on multiple chains. Select your preferred token and chain above.
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    <TransactionInProgressModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        phone_number={phoneNumber}
      />

      <DepositCryptoReceipt
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          continuePollingRef.current = false;
          // setContinuePolling(false); 
          // onClose(); // Remove this line as onClose is not defined in props
        }}
        transactionReciept={transactionReceipt}
      />
      </>
  );
};

export default DepositCryptoModal;
