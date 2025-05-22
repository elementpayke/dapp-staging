"use client";

import type React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowUpRight } from "lucide-react";
import { toast } from "react-toastify";
import PayToMobileMoney from "./PayToMobileMoney";
import ProcessingPopup from "./processing-popup";

import { parseUnits } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { erc20Abi } from "@/app/api/abi";
import { getUSDCAddress } from "../../../services/tokens";
import { useContract } from "@/services/useContract";
import { useWallet } from "@/context/WalletContext";
import { encryptMessageDetailed } from "@/services/encryption";
import { useContractEvents } from "@/context/useContractEvents";
import ConfirmationModal from "./ConfirmationModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TransactionReceipt {
  amount: string;
  amountUSDC: number;
  phoneNumber: string;
  address: string;
  status: number;
  transactionHash: string;
}

const SendCryptoModal: React.FC = () => {
  const [selectedToken, setSelectedToken] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [reason, setReason] = useState("Transport");
  const [favorite, setFavorite] = useState(true);
  // Keep but don't use these variables to preserve the component's state structure
  const [isApproving, setIsApproving] = useState(false);
  const [, setIsProcessing] = useState(false);
  const { usdcBalance } = useWallet();
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const MARKUP_PERCENTAGE = 1.5; // 1.5% markup
  const [orderId, setOrderId] = useState("");
  const [showProcessingPopup, setShowProcessingPopup] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [messageHash, setMessageHash] = useState("");
  const [isBrowser, setIsBrowser] = useState(false);

  const [paybillNumber, setPaybillNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [tillNumber, setTillNumber] = useState("");

  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validatedAccountInfo, setValidatedAccountInfo] = useState("");
  const [proceedAfterValidation, setProceedAfterValidation] = useState<
    () => void
  >(() => () => {});
  const [modalMode, setModalMode] = useState<"confirm" | "error">("confirm");

  // Keep but don't directly use this state to preserve the component structure
  const [, setCashoutType] = useState<"PHONE" | "PAYBILL" | "TILL">("PHONE");

  const getCashoutType = useCallback((): "PHONE" | "PAYBILL" | "TILL" => {
    if (paybillNumber && accountNumber) return "PAYBILL";
    if (tillNumber) return "TILL";
    return "PHONE";
  }, [paybillNumber, accountNumber, tillNumber]);

  const getAccountTypeForIntaSend = (): "TillNumber" | "PayBill" => {
    const type = getCashoutType();
    if (type === "TILL") return "TillNumber";
    if (type === "PAYBILL") return "PayBill";
    return "TillNumber";
  };

  const validateAccount = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/validate-account`,
        {
          method: "POST",
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_AGGR_API_KEY!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            account: tillNumber || paybillNumber,
            provider: "MPESA-B2B",
            account_type: getAccountTypeForIntaSend(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        const message =
          result?.errors?.[0]?.detail || "Account validation failed";
        throw new Error(message);
      }

      setValidatedAccountInfo(result.name || "Unknown Payee");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to validate account.");
      return false;
    }
  };

  // Set isBrowser to true once component mounts (client-side only)
  useEffect(() => {
    setIsBrowser(true);
    // Set API key only on the client side
    setApiKey(process.env.NEXT_PUBLIC_API_KEY || "");
  }, []);

  // Fetch exchange rate from Coinbase API
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch(
          "https://api.coinbase.com/v2/exchange-rates?currency=USDC"
        );
        const data = await response.json();
        if (data?.data?.rates?.KES) {
          const baseRate = Number.parseFloat(data.data.rates.KES);
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

    if (isBrowser) {
      fetchExchangeRate();
    }
  }, [isBrowser]);

  const TRANSACTION_FEE_RATE = 0.005; // 0.5%

  // Define transactionSummary BEFORE any code that references it
  const transactionSummary = useMemo(() => {
    if (!exchangeRate) {
      return {
        kesAmount: 0,
        usdcAmount: 0,
        transactionCharge: 0,
        totalUSDC: 0,
        totalKES: 0,
        totalKESBalance: 0,
        walletBalance: 0,
        remainingBalance: 0,
        usdcBalance: 0,
      };
    }

    const kesAmount = Number.parseFloat(amount) || 0;
    const usdcAmount = kesAmount / exchangeRate;
    const transactionCharge = usdcAmount * TRANSACTION_FEE_RATE;
    const totalUSDC = usdcAmount + transactionCharge;
    const remainingBalance = usdcBalance - totalUSDC;
    const totalKES = usdcBalance * exchangeRate;
    const totalKESBalance = totalKES - kesAmount;

    return {
      kesAmount,
      usdcAmount,
      transactionCharge,
      totalUSDC,
      totalKES,
      totalKESBalance: totalKESBalance,
      walletBalance: Number.parseFloat(amount) || 0,
      remainingBalance: Math.max(remainingBalance, 0),
      usdcBalance: usdcBalance,
    };
  }, [amount, exchangeRate, usdcBalance]);

  // Now we can safely reference transactionSummary in useEffect
  useEffect(() => {
    if (
      isBrowser &&
      mobileNumber &&
      exchangeRate &&
      transactionSummary.totalUSDC
    ) {
      try {
        const hash = encryptMessageDetailed({
          cashout_type: getCashoutType(),
          amount_fiat: Number.parseFloat(amount),
          currency: "KES",
          rate: exchangeRate ?? 0,
          phone_number: getCashoutType() === "PHONE" ? mobileNumber : "",
          paybill_number: getCashoutType() === "PAYBILL" ? paybillNumber : "",
          account_number: getCashoutType() === "PAYBILL" ? accountNumber : "",
          till_number: getCashoutType() === "TILL" ? tillNumber : "",
        });

        setMessageHash(hash);
      } catch (error) {
        console.error("Error encrypting message:", error);
      }
    }
  }, [
    isBrowser,
    mobileNumber,
    exchangeRate,
    transactionSummary.totalUSDC,
    amount,
    getCashoutType,
    paybillNumber,
    accountNumber,
    tillNumber,
  ]);

  const account = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { contract, address } = useContract();
  const usdcTokenAddress = getUSDCAddress() as `0x${string}`;
  const smartcontractaddress = "0xb5616e6f82F274db9DfbA91Fc7B073bf93817148";

  useContractEvents(
    (order: any) => {
      setOrderId(order.orderId);
    },
    (order: any) => {
      // Handle order settled event
      console.log("Order settled:", order);
    },
    (orderId: any) => {
      // Handle order refunded event
      console.log("Order refunded:", orderId);
    }
  );

  // Add cleanup function
  const cleanupOrderStates = useCallback(() => {
    setOrderId("");
    setShowProcessingPopup(false);
    setTransactionReciept({
      amount: "0.00",
      amountUSDC: 0,
      phoneNumber: "",
      address: "",
      status: 0,
      transactionHash: "",
    });
  }, []);

  const executeTokenApproval = async () => {
    try {
      setIsApproving(true);
      const tokenAddress = usdcTokenAddress;
      const spenderAddress = smartcontractaddress as `0x${string}`;
      const orderType = 1;

      await writeContractAsync({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [
          spenderAddress,
          parseUnits(transactionSummary.totalUSDC.toString(), 6),
        ],
      });

      await contract!.createOrder(
        address,
        parseUnits(transactionSummary.totalUSDC.toString(), 6),
        usdcTokenAddress,
        orderType,
        messageHash
      );

      // Reset states before showing processing popup
      cleanupOrderStates();
      setShowProcessingPopup(true);
    } catch (error: any) {
      toast.error(error?.message || "Transaction failed.");
    } finally {
      setIsApproving(false);
      setIsProcessing(true);
    }
  };

  const handleApproveToken = async () => {
    if (!account.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (Number.parseFloat(amount) <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    if (!messageHash) {
      toast.error("Message encryption failed. Please try again.");
      return;
    }
    const cashout_type = getCashoutType();
    console.log("Cashout Type:", cashout_type);
    if (cashout_type === "PAYBILL" || cashout_type === "TILL") {
      const isValid = await validateAccount();
      if (!isValid) {
        setShowValidationModal(true);
        setModalMode("error");
        setValidatedAccountInfo("Invalid account or business number.");
        return;
      }

      setProceedAfterValidation(() => executeTokenApproval);
      setShowValidationModal(true);
      setModalMode("confirm");
      return;
    }
    await executeTokenApproval();
  };

  // Initialize transaction receipt
  const [transactionReciept, setTransactionReciept] =
    useState<TransactionReceipt>({
      amount: "0.00",
      amountUSDC: 0,
      phoneNumber: "",
      address: "",
      status: 0,
      transactionHash: "",
    });

  // Update transaction receipt when relevant values change
  useEffect(() => {
    if (isBrowser) {
      setTransactionReciept((prev) => ({
        ...prev,
        amount: amount || "0.00",
        amountUSDC: Number(amount) * (exchangeRate ?? 1) || 0,
        phoneNumber: mobileNumber || "",
        address: account.address || "",
      }));
    }
  }, [isBrowser, amount, exchangeRate, mobileNumber, account.address]);

  return (
    <Dialog>
      <DialogTrigger className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-500 text-white text-lg font-semibold py-4 rounded-xl shadow-lg hover:opacity-90 transition-all">
        <ArrowUpRight size={24} />
        Spend Crypto
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Spend Crypto</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Payment Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Payment Type Header */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Pay to Mobile Money
              </h3>
            </div>

            <PayToMobileMoney
              selectedToken={selectedToken}
              setSelectedToken={setSelectedToken}
              amount={amount}
              setAmount={setAmount}
              mobileNumber={mobileNumber}
              setMobileNumber={setMobileNumber}
              reason={reason}
              setReason={setReason}
              totalKES={transactionSummary.totalKES}
              tillNumber={tillNumber}
              setTillNumber={setTillNumber}
              paybillNumber={paybillNumber}
              setPaybillNumber={setPaybillNumber}
              accountNumber={accountNumber}
              setAccountNumber={setAccountNumber}
              setCashoutType={setCashoutType}
            />

            {/* Favorite Option */}
            <div className="flex items-center gap-2 pt-2">
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

            {/* Mobile Confirm Button - Only shown on small screens */}
            <div className="lg:hidden pt-4">
              <button
                onClick={
                  Number.parseFloat(amount) >= 10
                    ? handleApproveToken
                    : undefined
                }
                disabled={isApproving || transactionSummary.totalUSDC <= 0}
                type="button"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isApproving ? "Approving..." : "Confirm Payment"}
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
                  <span className="text-gray-600 text-sm">Wallet balance</span>
                  <span className="text-green-600 font-medium text-sm">
                    USDC {transactionSummary.usdcBalance.toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Amount to send</span>
                  <span className="text-gray-900 font-medium">
                    KE {transactionSummary.kesAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">
                    Transaction charge (0.5%)
                  </span>
                  <span className="text-orange-600 text-sm">
                    KE {transactionSummary.transactionCharge.toFixed(2)}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center font-semibold">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">
                    KE {transactionSummary.kesAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Credit Opt-in Warning */}
              {amount &&
                Math.abs(
                  Number.parseFloat(amount) - transactionSummary.totalKES
                ) <= 0.9 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-600 text-xs">
                      Opt-In to Hakiba to gain credit
                    </p>
                  </div>
                )}

              {/* Desktop Confirm Button */}
              <div className="hidden lg:block mb-4">
                <button
                  onClick={
                    Number.parseFloat(amount) >= 10
                      ? handleApproveToken
                      : undefined
                  }
                  disabled={isApproving || transactionSummary.totalUSDC <= 0}
                  type="button"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
                >
                  {isApproving ? "Approving..." : "Confirm Payment"}
                </button>
              </div>

              {/* Balance after transaction */}
              <div className="bg-white border border-gray-200 p-3 rounded-lg">
                <div className="text-gray-600 mb-2 text-xs font-medium uppercase tracking-wider">
                  Balance After Transaction
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Remaining KES</span>
                    <span className="text-gray-900 font-medium text-sm">
                      KE {transactionSummary.totalKESBalance.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">USDC Balance</span>
                    <span className="text-gray-900 font-medium text-sm">
                      {transactionSummary.remainingBalance.toFixed(6)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      <ConfirmationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        onConfirm={proceedAfterValidation}
        accountInfo={validatedAccountInfo}
        amountKES={transactionSummary.kesAmount}
        accountNumber={accountNumber}
        cashoutType={getCashoutType()}
        mode={modalMode}
        errorMessage={validatedAccountInfo}
      />

      {isBrowser && (
        <ProcessingPopup
          isVisible={showProcessingPopup}
          onClose={() => {
            cleanupOrderStates();
          }}
          orderId={orderId}
          apiKey={apiKey}
          transactionDetails={{
            amount: amount,
            currency: "KES",
            recipient: mobileNumber,
            paymentMethod: "Mobile Money",
            transactionHash: "",
            date: new Date().toISOString(),
            receiptNumber: "",
            paymentStatus: "Processing",
            status: 0,
          }}
        />
      )}
    </Dialog>
  );
};

export default SendCryptoModal;
