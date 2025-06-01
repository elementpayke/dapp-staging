import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { toast } from "react-toastify";
import { getUSDCAddress } from "../../../services/tokens";
import { useContract } from "@/services/useContract";
import { encryptMessage } from "@/services/encryption";
import { useAccount, useSwitchChain } from "wagmi";
import TransactionInProgressModal from "./TranactionInProgress";
import DepositCryptoReceipt from "./DepositCryptoReciept";
import { createOnRampOrder } from "@/app/api/aggregator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useWallet } from "@/hooks/useWallet";
import { TransactionReceipt } from "@/types/types";

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
  const [selectedToken, setSelectedToken] = useState("USDC");
  const [amount, setAmount] = useState("0.00");
  const [depositFrom, setDepositFrom] = useState("MPESA");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [reason, setReason] = useState("Transport");
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const TRANSACTION_FEE_RATE = 0.005;
  const { contract, address } = useContract();
  const addressOwner = useAccount();
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const TARGET_CHAIN_ID = 8453; // Base
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const continuePollingRef = useRef<boolean>(true);


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
    if (!address) return toast.error("Please connect your wallet first.");
    if (parseFloat(amount) <= 0)
      return toast.error("Amount must be greater than zero.");

    // Check if connected to Base chain
    if (chain?.id !== TARGET_CHAIN_ID) {
      try {
        await switchChain({ chainId: TARGET_CHAIN_ID });
        toast.success("Switched to Base. Please click Confirm again.");
        return; // Exit so user can retry after chain switch
      } catch (error) {
        toast.error("Please switch to Base network to proceed.");
        return;
      }
    }

    setIsLoading(true);
    const orderType = depositFrom === "MPESA" ? 0 : 1;
    const usdcTokenAddress = getUSDCAddress() as `0x${string}`;
    const mpesaAmount = parseFloat(amount) * (exchangeRate ?? 1);

    try {
      if (!isValidKenyanNumber(phoneNumber)) {
        toast.error("Invalid phone number. Must be in format 2547XXXXXXXX and 12 digits long.");
        return;
      }
      const messageHash = encryptMessage(
        phoneNumber,
        "KES",
        exchangeRate ?? 0,
        mpesaAmount
      );
      
      if (!contract) throw new Error("Contract is not initialized.");

      // Reseting transaction state before starting a new transaction
      setTransactionReceipt({
        orderId: "",
        status: "pending",
        reason: "",
        amount: 0,
        amountUSDC: 0,
        transactionHash: "",
        address: "",
        phoneNumber: "",
      });
      setIsReceiptModalOpen(false);
      setIsTransactionModalOpen(true);
      continuePollingRef.current = true;


      const res = await createOnRampOrder({
        userAddress: address,
        tokenAddress: usdcTokenAddress,
        messageHash: messageHash,
      });
      setIsConfirmModalOpen(false);
      setIsTransactionModalOpen(true);

      const txHash = res?.tx_hash;
      console.log("🔁 Starting poll for order created with tx:", txHash);

      // Store tx hash immediately (optional)
      setTransactionReceipt((prev) => ({
        ...prev,
        transactionHash: txHash
      }));

      pollOrderStatusByTxHash(txHash);

    } catch (error: any) {
      console.error("Transaction failed:", error?.message || error);
      toast.error(error?.message || "Transaction failed.");
    }
    finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (number: string) => {
    // Remove any non-digit characters
    const digitsOnly = number.replace(/\D/g, "");

    // If number starts with 0, replace it with 254
    if (digitsOnly.startsWith("0") && digitsOnly.length >= 10) {
      return "254" + digitsOnly.slice(1);
    }

    if (digitsOnly.startsWith("254") && digitsOnly.length === 12) {
      return digitsOnly;
    }


    // If number doesn't start with either, assume it's a complete number
    return digitsOnly;
  };

  const isValidKenyanNumber = (number: string): boolean => {
    const regex = /^254\d{9}$/;
    return regex.test(number);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    setPhoneNumber(formattedNumber);
  };

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
                  <select
                    className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                  >
                    <option value="USDC">USDC</option>
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Amount in USDC
                </label>
                <input
                  type="number"
                  className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
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
                <input
                  type="tel"
                  className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  placeholder="e.g. 0712345678"
                />
                {phoneNumber && !isValidKenyanNumber(phoneNumber) && (
                  <p className="text-red-500 text-sm mt-1">
                    Phone number must start with 2547 and be 12 digits long.
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
            <div className="lg:hidden pt-4">
              <button
                className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-400 text-white rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                onClick={handleConfirmPayment}
                disabled={isLoading || parseFloat(amount) <= 0}
              >
                {isLoading ? "Processing..." : "Confirm Payment"}
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
                  <span className="text-gray-600 text-sm">KES Equivalent</span>
                  <span className="font-medium text-sm">
                    KES{" "}
                    {(
                      parseFloat(amount || "0") * (exchangeRate || 127.3)
                    ).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">
                    Amount to receive
                  </span>
                  <span className="font-medium">
                    USDC {parseFloat(amount || "0").toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">
                    Transaction charge
                  </span>
                  <span className="text-orange-600 text-sm">
                    KE{" "}
                    {(
                      parseFloat(amount || "0") *
                      TRANSACTION_FEE_RATE *
                      (exchangeRate || 127.3)
                    ).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Wallet balance</span>
                  <span className="text-green-600 font-medium text-sm">
                    USDC {transactionSummary.walletBalance.toFixed(2)}
                  </span>
                </div>

                <div className="border-t pt-3 flex justify-between items-center font-semibold">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">
                    KE{" "}
                    {(
                      parseFloat(amount || "0") * (exchangeRate || 127.3)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Desktop Confirm Button */}
              <div className="hidden lg:block mb-4">
                <button
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-400 text-white rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
                  onClick={handleConfirmPayment}
                  disabled={isLoading || parseFloat(amount) <= 0}
                >
                  {isLoading ? "Processing..." : "Confirm Payment"}
                </button>
              </div>

              {/* Balance after transaction */}
              <div className="bg-white border border-gray-200 p-3 rounded-lg mb-4">
                <div className="text-gray-600 mb-2 text-xs font-medium uppercase tracking-wider">
                  Balance After Transaction
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">
                    USDC: {transactionSummary.walletBalance.toFixed(2)}
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
                At the moment, ElementsPay only allows users to deposit USDC to
                the wallet used at registration. However, we will soon allow the
                deposit of other tokens.
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
