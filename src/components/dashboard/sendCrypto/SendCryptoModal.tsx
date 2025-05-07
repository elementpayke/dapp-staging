"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { X, ArrowLeft } from 'lucide-react'
import { toast } from "react-toastify"
import PayToMobileMoney from "./PayToMobileMoney"
import ProcessingPopup from "./processing-popup"

import { parseUnits } from "viem"
import { useAccount, useWriteContract } from "wagmi"
import { erc20Abi } from "@/app/api/abi"
import { getUSDCAddress } from "../../../services/tokens"
import { useContract } from "@/services/useContract"
import { useWallet } from "@/context/WalletContext"
import { encryptMessageDetailed } from "@/services/encryption"
// import SendCryptoReceipt from "./SendCryptoReciept"
import { useContractEvents } from "@/context/useContractEvents"
import { fetchOrderStatus } from "@/app/api/aggregator";
import ConfirmationModal from "./ConfirmationModal"

interface SendCryptoModalProps {
  isOpen: boolean
  onClose: () => void
}

interface TransactionReceipt {
  amount: string;
  amountUSDC: number;
  phoneNumber: string;
  address: string;
  status: number;
  transactionHash: string;
}

const SendCryptoModal: React.FC<SendCryptoModalProps> = ({ isOpen, onClose }) => {
  const [selectedToken, setSelectedToken] = useState("USDC")
  const [amount, setAmount] = useState("")
  const [mobileNumber, setMobileNumber] = useState("0703417782")
  const [reason, setReason] = useState("Transport")
  const [favorite, setFavorite] = useState(true)
  // Keep but don't use these variables to preserve the component's state structure
  const [isApproving, setIsApproving] = useState(false)
  const [, setIsProcessing] = useState(false)
  const { usdcBalance } = useWallet()
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const MARKUP_PERCENTAGE = 1.5 // 1.5% markup
  const [orderId, setOrderId] = useState("")
  const [showProcessingPopup, setShowProcessingPopup] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [messageHash, setMessageHash] = useState("")
  const [isBrowser, setIsBrowser] = useState(false)

  const [paybillNumber, setPaybillNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [tillNumber, setTillNumber] = useState("");

  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validatedAccountInfo, setValidatedAccountInfo] = useState("")
  const [proceedAfterValidation, setProceedAfterValidation] = useState<() => void>(() => () => {})
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/validate-account`, {
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
      });
  
      const result = await response.json();

      if (!response.ok) {
        const message = result?.errors?.[0]?.detail || "Account validation failed";
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
    setIsBrowser(true)
    // Set API key only on the client side
    setApiKey(process.env.NEXT_PUBLIC_API_KEY || "")
  }, [])

  // Fetch exchange rate from Coinbase API
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=USDC")
        const data = await response.json()
        if (data?.data?.rates?.KES) {
          const baseRate = Number.parseFloat(data.data.rates.KES)
          const markupRate = baseRate * (1 - MARKUP_PERCENTAGE / 100)
          setExchangeRate(markupRate)
        } else {
          console.error("KES rate not found")
          setExchangeRate(null)
        }
      } catch (error) {
        console.error("Error fetching exchange rate:", error)
        setExchangeRate(null)
      }
    }

    if (isBrowser) {
      fetchExchangeRate()
    }
  }, [isBrowser])

  const TRANSACTION_FEE_RATE = 0.005 // 0.5%

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
      }
    }

    const kesAmount = Number.parseFloat(amount) || 0
    const usdcAmount = kesAmount / exchangeRate
    const transactionCharge = usdcAmount * TRANSACTION_FEE_RATE
    const totalUSDC = usdcAmount + transactionCharge
    const remainingBalance = usdcBalance - totalUSDC
    const totalKES = usdcBalance * exchangeRate
    const totalKESBalance = totalKES - kesAmount

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
    }
  }, [amount, exchangeRate, usdcBalance])

  // Now we can safely reference transactionSummary in useEffect
  useEffect(() => {
    if (isBrowser && mobileNumber && exchangeRate && transactionSummary.totalUSDC) {
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
  }, [isBrowser, mobileNumber, exchangeRate, transactionSummary.totalUSDC, amount, getCashoutType, paybillNumber, accountNumber, tillNumber])

  const account = useAccount()
  const { writeContractAsync } = useWriteContract()
  const { contract, address } = useContract()
  const usdcTokenAddress = getUSDCAddress() as `0x${string}`
  const smartcontractaddress = "0x10af11060bC238670520Af7ca15E86a34bC68fe4"

  useContractEvents(
    async () => {
      try {
        const response = await fetchOrderStatus(orderId);
        const status = response.data.status;

        setTransactionReciept((prev: any) => ({
          ...prev,
          orderId: orderId,
          status,
          phoneNumber: mobileNumber,
          transactionHash: "pending",
        }));

        setOrderId(orderId);
        setShowProcessingPopup(true);
      } catch {
        toast.error("Failed to fetch order status.");
      }
    },
    () => {
      setTransactionReciept((prev: any) => ({ ...prev, status: "settled" }));
      setShowProcessingPopup(false);
      setSendCryptoReciept(true);
    },
    () => {
      setShowProcessingPopup(false);
      toast.error("Order refunded");
    }
  );

  const handleClose = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const executeTokenApproval = async () => {
    try {
      setIsApproving(true)
      const tokenAddress = usdcTokenAddress
      const spenderAddress = smartcontractaddress as `0x${string}`
      const orderType = 1
  
      await writeContractAsync({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [spenderAddress, parseUnits(transactionSummary.totalUSDC.toString(), 6)],
      })
  
      const tx = await contract!.createOrder(
        address,
        parseUnits(transactionSummary.totalUSDC.toString(), 6),
        usdcTokenAddress,
        orderType,
        messageHash
      )
  
      const transactionReceipt = {
        amount,
        amountUSDC: Number(amount) * (exchangeRate ?? 1),
        phoneNumber: mobileNumber,
        address: account.address || "",
        status: 1,
        transactionHash: tx.hash || "",
      }
  
      setTransactionReciept(transactionReceipt)
      setOrderId(tx.hash || "pending")
      setShowProcessingPopup(true)
    } catch (error: any) {
      toast.error(error?.message || "Transaction failed.")
    } finally {
      setIsApproving(false)
      setIsProcessing(true)
      setSendCryptoReciept(true)
    }
  }

  const handleApproveToken = async () => {
    if (!account.address) {
      toast.error("Please connect your wallet first")
      return
    }

    if (Number.parseFloat(amount) <= 0) {
      toast.error("Amount must be greater than zero")
      return
    }

    if (!messageHash) {
      toast.error("Message encryption failed. Please try again.")
      return
    }
    const cashout_type = getCashoutType()
    console.log("Cashout Type:", cashout_type)
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
  }

  // Initialize transaction receipt
  const [transactionReciept, setTransactionReciept] = useState<TransactionReceipt>({
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
      setTransactionReciept(prev => ({
        ...prev,
        amount: amount || "0.00",
        amountUSDC: Number(amount) * (exchangeRate ?? 1) || 0,
        phoneNumber: mobileNumber || "",
        address: account.address || ""
      }));
    }
  }, [isBrowser, amount, exchangeRate, mobileNumber, account.address]);

  const [sendCryptoReciept, setSendCryptoReciept] = useState(false);

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start md:items-center justify-center z-50"
      onClick={handleClose}
    >
      <div className="bg-white w-full h-full md:h-auto md:rounded-3xl md:max-w-4xl overflow-auto">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="md:hidden p-1" type="button">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Spend Crypto</h2>
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
            <div className="md:col-span-3 space-y-4">
              {/* Payment Type Header */}
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Pay to Mobile Money</h3>
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
              <button
                onClick={Number.parseFloat(amount) >= 20 ? handleApproveToken : undefined}
                disabled={isApproving || transactionSummary.totalUSDC <= 0}
                type="button"
                className="w-full md:hidden mt-4 py-3 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-full font-medium"
              >
                {isApproving ? "Approving..." : "Confirm Payment"}
              </button>
            </div>

            {/* Right Column - Transaction Summary (Hidden on Mobile) */}
            <div className="hidden md:block md:col-span-2 bg-gray-50 p-4 rounded-2xl h-fit">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Transaction summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Wallet balance</span>
                  <span className="text-green-600 font-medium">USDC {transactionSummary.usdcBalance.toFixed(6)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount to send</span>
                  <span className="text-gray-900">KE {transactionSummary.kesAmount.toFixed(2)}</span>
                </div>
                {amount && Math.abs(Number.parseFloat(amount) - transactionSummary.totalKES) <= 0.9 && (
                  <div className="text-red-500 text-sm">
                    <p className="text-red-500 mt-2 text-sm">Opt-In to Hakiba to gain credit</p>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Transaction charge (0.5%)</span>
                  <span className="text-orange-600">KE {transactionSummary.transactionCharge.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center font-medium">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">KE {transactionSummary.kesAmount.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={Number.parseFloat(amount) >= 20 ? handleApproveToken : undefined}
                disabled={isApproving || transactionSummary.totalUSDC <= 0}
                type="button"
                className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isApproving ? "Approving..." : "Confirm payment"}
              </button>

              <div className="mt-4 bg-gray-100 p-3 rounded-lg">
                <div className="text-gray-500 mb-1">Balance after transaction</div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining Balance</span>
                  <span className="text-gray-600">KE {transactionSummary.totalKESBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">USDC Balance</span>
                  <span className="text-gray-600">USDC {transactionSummary.remainingBalance.toFixed(6)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Confirmation Modal */}
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

        {/* Processing Popup */}
        {isBrowser && (
          <ProcessingPopup
            isVisible={showProcessingPopup}
            onClose={() => {
              setShowProcessingPopup(false)
              if (transactionReciept.status === 1) {
                setSendCryptoReciept(true)
              }
            }}
            orderId={orderId}
            apiKey={apiKey}
          />
        )}
      </div>
    </div>
  )
}

export default SendCryptoModal