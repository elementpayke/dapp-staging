"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
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
import { encryptMessage } from "@/services/encryption"
// import SendCryptoReceipt from "./SendCryptoReciept"
import { useContractEvents } from "@/context/useContractEvents"

interface SendCryptoModalProps {
  isOpen: boolean
  onClose: () => void
}

interface WalletOption {
  id: string
  icon: string
  selected?: boolean
}

const SendCryptoModal: React.FC<SendCryptoModalProps> = ({ isOpen, onClose }) => {
  const [isSendCryptoReciept, setSendCryptoReciept] = useState(false)
  const [selectedToken, setSelectedToken] = useState("USDC")
  const [amount, setAmount] = useState("")
  const [mobileNumber, setMobileNumber] = useState("0703417782")
  const [reason, setReason] = useState("Transport")
  const [favorite, setFavorite] = useState(true)
  const [selectedWallet, setSelectedWallet] = useState<string>("metamask")
  const [isApproving, setIsApproving] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const { usdcBalance } = useWallet()
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const MARKUP_PERCENTAGE = 1.5 // 1.5% markup
  const [orderId, setOrderId] = useState("")
  const [showProcessingPopup, setShowProcessingPopup] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [messageHash, setMessageHash] = useState("")
  const [isBrowser, setIsBrowser] = useState(false)

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

  const calculateUSDCAmount = () => {
    if (!exchangeRate) return 0
    const kesAmount = Number.parseFloat(amount) || 0
    return (kesAmount / exchangeRate).toFixed(6)
  }

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
    //   try {
    //     // const hash = encryptMessage(mobileNumber, "KES", exchangeRate, transactionSummary.totalUSDC)
    //     const hash = encryptMessage(cashout_type: "PHONE", amount_fiat: amount, currency: "KES", 
    //     setMessageHash(hash)
    //   } catch (error) {
    //     console.error("Error encrypting message:", error)
    //   }
    // }
    try {
      const hash = encryptMessage(
        "PHONE",           // cashout_type
        Number.parseFloat(amount), // amount_fiat
        "KES",           // currency
        exchangeRate,    // rate
        mobileNumber,    // phone_number
        "",             // paybill_number
        "",             // account_number
        "",             // till_number
      );
      setMessageHash(hash);
    } catch (error) {
      console.error("Error encrypting message:", error);
    }
  }
  }, [isBrowser, mobileNumber, exchangeRate, transactionSummary.totalUSDC])

  const account = useAccount()
  const { writeContractAsync } = useWriteContract()
  const { contract, address } = useContract()
  const usdcTokenAddress = getUSDCAddress() as `0x${string}`
  const smartcontractaddress = "0x10af11060bC238670520Af7ca15E86a34bC68fe4"

  // Define event handlers
  const handleOrderCreated = (order: any) => {
    console.log("New Order Created:", order)
    // You could update the transaction receipt here if needed
  }

  const handleOrderSettled = (order: any) => {
    console.log("Order Settled:", order)
  }

  const handleOrderRefunded = (order: any) => {
    console.log("Order Refunded:", order)
  }

  // Use the contract events hook ONCE
  useContractEvents(handleOrderCreated, handleOrderSettled, handleOrderRefunded)

  const handleClose = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
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

    try {
      setIsApproving(true)

      const tokenAddress = usdcTokenAddress
      const spenderAddress = smartcontractaddress as `0x${string}`
      if (!spenderAddress) {
        toast.error("Spender address is not defined")
        return
      }
      const orderType = 1

      await writeContractAsync({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [spenderAddress, parseUnits(transactionSummary.totalUSDC.toString(), 6)],
      })

      try {
        if (!contract) throw new Error("Contract is not initialized.")
        
        const tx = await contract.createOrder(
          address,
          parseUnits(transactionSummary.totalUSDC.toString(), 6),
          usdcTokenAddress,
          orderType,
          messageHash,
        )
        
        // Update transaction receipt
        const transactionReceipt = {
          amount: amount || "0.00",
          amountUSDC: Number(amount) * (exchangeRate ?? 1) || 0,
          phoneNumber: mobileNumber || "",
          address: account.address || "",
          status: 1,
          transactionHash: tx.hash || "",
        }
        
        console.log("Transaction hash:", tx.hash)
        toast.info("Transaction submitted. Awaiting confirmation...")

        // Set order ID and show processing popup
        const newOrderId = tx.hash || "pending"
        setOrderId(newOrderId)
        setShowProcessingPopup(true)
      } catch (error: any) {
        console.error("Error creating order:", error)
        toast.error(error?.message || "Transaction failed.")
      } finally {
        setIsApproving(false)
        setIsProcessing(true)
        setSendCryptoReciept(true)
      }
    } catch (error: any) {
      console.error("Approval error:", error)
      toast.error(error?.shortMessage || "Failed to approve token")
      setIsApproving(false)
      setIsProcessing(false)
    }
  }

  const walletOptions: WalletOption[] = [
    { id: "metamask", icon: "🦊", selected: selectedWallet === "metamask" },
    { id: "coinbase", icon: "©️", selected: selectedWallet === "coinbase" },
    { id: "qr", icon: "🔲", selected: selectedWallet === "qr" },
  ]

  // Initialize transaction receipt
  const [transactionReciept] = useState<any>({
    amount: "0.00",
    amountUSDC: 0,
    phoneNumber: "",
    address: "",
    status: 0,
    transactionHash: "",
  })

  // Update transaction receipt when relevant values change
  useEffect(() => {
    if (isBrowser) {
      transactionReciept.amount = amount || "0.00"
      transactionReciept.amountUSDC = Number(amount) * (exchangeRate ?? 1) || 0
      transactionReciept.phoneNumber = mobileNumber || ""
      transactionReciept.address = account.address || ""
    }
  }, [isBrowser, amount, exchangeRate, mobileNumber, account.address, transactionReciept])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start md:items-center justify-center z-50"
      onClick={handleClose}
    >
      {/* <SendCryptoReceipt
        isOpen={isSendCryptoReciept}
        onClose={() => setSendCryptoReciept(false)}
        transactionReciept={transactionReciept}
      /> */}
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

              <div className="mt-3 text-sm text-gray-500">
                We&apos;ll use your available balance when you shop online or send money for goods and services. If you
                don&apos;t have enough money in your balance, we&apos;ll ask you to pick another wallet at checkout.
              </div>
            </div>
          </div>
        </div>

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