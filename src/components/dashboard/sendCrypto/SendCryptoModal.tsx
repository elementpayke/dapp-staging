"use client";

import type React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowUpRight } from "lucide-react";
import { toast } from "react-toastify";
import PayToMobileMoney from "./PayToMobileMoney";
import ProcessingPopup from "./processing-popup";
import { formatReceiverName } from "@/utils/helpers";

import { parseUnits } from "viem";
import {
  useAccount,
  useWriteContract,
  useSwitchChain,
  useChainId,
  usePublicClient,
} from "wagmi";
import { erc20Abi } from "@/app/api/abi";
import { getUSDCAddress, getContractAddress } from "../../../services/tokens";
import { useContract } from "@/services/useContract";

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
import { useWallet } from "@/hooks/useWallet";
import { SUPPORTED_TOKENS, SupportedToken } from "@/constants/supportedTokens";
import { validateKenyanPhoneNumber, formatKenyanPhoneNumber, validatePhoneWithAPI } from "@/utils/phoneValidation";
import { createOffRampOrder } from "@/app/api/aggregator";

interface TransactionReceipt {
  amount: string;
  amountUSDC: number;
  phoneNumber: string;
  address: string;
  status: number;
  transactionHash: string;
}

const SendCryptoModal: React.FC = () => {
  const [selectedToken, setSelectedToken] = useState<SupportedToken>(
    SUPPORTED_TOKENS[0]
  );
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
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; error?: string }>({ isValid: false });
  const [isValidatingPhone, setIsValidatingPhone] = useState(false);

  // Debug orderId changes
  useEffect(() => {
    console.log("[ORDER ID CHANGE] orderId changed to:", orderId);
    console.log("[ORDER ID CHANGE] showProcessingPopup is:", showProcessingPopup);
  }, [orderId, showProcessingPopup]);
  const [messageHash, setMessageHash] = useState("");
  const [isBrowser, setIsBrowser] = useState(false);

  const [paybillNumber, setPaybillNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [tillNumber, setTillNumber] = useState("");

  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validatedAccountInfo, setValidatedAccountInfo] = useState("");
  const [proceedAfterValidation, setProceedAfterValidation] = useState<
    () => void
  >(() => () => { });
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
    // if (type === "TILL") return "TillNumber";
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
    setApiKey(process.env.NEXT_PUBLIC_AGGR_API_KEY || "");
  }, []);

  // Fetch marked-up exchange rate from Element Pay API
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        // Map token symbols to API currency codes
        const currencyMap: Record<string, string> = {
          'USDT': 'usdt_lisk',
          'USDC': 'usdc',
          'WXM': 'wxm',
          'ETH': 'eth'
        };
        const currency = currencyMap[selectedToken.symbol] || 'usdc';
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/rates?currency=${currency}`
        );
        const data = await response.json();
        if (data?.marked_up_rate) {
          setExchangeRate(Number(data.marked_up_rate));
        } else {
          setExchangeRate(null);
        }
      } catch (error) {
        setExchangeRate(null);
      }
    };
    if (isBrowser) {
      fetchExchangeRate();
    }
  }, [isBrowser, selectedToken]);

  const TRANSACTION_FEE_RATE = 0.005; // 0.5%

  // Validate phone number with backend API
  const validatePhoneWithBackend = async (phoneNumber: string): Promise<boolean> => {
    try {
      setIsValidatingPhone(true);
      
      const result = await validatePhoneWithAPI(
        phoneNumber, 
        process.env.NEXT_PUBLIC_API_URL, 
        process.env.NEXT_PUBLIC_AGGR_API_KEY
      );
      
      setPhoneValidation(result);
      return result.isValid;
    } catch (error) {
      console.error("Phone validation error:", error);
      // Fall back to client-side validation
      const clientValidation = validateKenyanPhoneNumber(phoneNumber);
      setPhoneValidation(clientValidation);
      return clientValidation.isValid;
    } finally {
      setIsValidatingPhone(false);
    }
  };

  // Validate phone number when user stops typing (debounced)
  useEffect(() => {
    if (!mobileNumber) {
      setPhoneValidation({ isValid: false });
      return;
    }

    const timeoutId = setTimeout(() => {
      if (mobileNumber.length >= 12) {
        validatePhoneWithBackend(mobileNumber);
      } else {
        // Do client-side validation for partial numbers
        const validation = validateKenyanPhoneNumber(mobileNumber);
        setPhoneValidation(validation);
      }
    }, 1000); // 1 second delay

    return () => clearTimeout(timeoutId);
  }, [mobileNumber]);

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
  // Map chain names to their contract addresses from env
  const CONTRACT_ADDRESS_MAP: Record<string, string> = {
    Base: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BASE!,
    Lisk: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_LISK!,
    Scroll: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_SCROLL!,
    Arbitrum: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ARBITRUM!,
  };
  const contractAddress = CONTRACT_ADDRESS_MAP[selectedToken.chain];
  const { contract, address } = useContract(contractAddress);
  const usdcTokenAddress = getUSDCAddress() as `0x${string}`;
  // Remove smartcontractaddress, use contractAddress instead if needed

  useContractEvents(
    contractAddress,
    (order: any) => {
      console.log("[CONTRACT EVENT] Order created event received:", order);
      setOrderId(order.orderId);
      console.log("[CONTRACT EVENT] Setting orderId to:", order.orderId);
    },
    (order: any) => {
      // Handle order settled event
      console.log("Order settled:", order);
      // If we get a settled event, we should update the popup to show success
      if (showProcessingPopup && order.orderId) {
        console.log("[CONTRACT EVENT] Order settled, updating popup state");
        // The processing popup should detect this through polling
      }
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

  const publicClient = usePublicClient();

  const { switchChain } = useSwitchChain();
  const currentChainId = useChainId();

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

  // --- ELEMENT PAY API INTEGRATION ---
  // Helper: Approve token if needed (ERC20 approve)
  const approveTokenIfNeeded = async (spender: string, amount: string) => {
    try {
      setIsApproving(true);
      const approveHash = await writeContractAsync({
        address: selectedToken.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [
          spender as `0x${string}`,
          parseUnits(amount, 6), // USDC/USDT are always 6 decimals
        ],
      });
      await publicClient?.waitForTransactionReceipt({ hash: approveHash });
      return approveHash;
    } catch (err: any) {
      toast.error(err?.message || "Token approval failed");
      return null;
    } finally {
      setIsApproving(false);
    }
  };

  // Helper: Poll order status from Element Pay API (by tx_hash)
  const pollOrderStatus = async (txHash: string) => {
    let attempts = 0;
    const maxAttempts = 20;
    const delay = 3000;
    while (attempts < maxAttempts) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/tx/${txHash}`, {
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (data?.data?.status && ["SETTLED", "FAILED", "SETTLED_UNVERIFIED"].includes(data.data.status)) {
          return data.data;
        }
      } catch (e) {
        // ignore, will retry
      }
      await new Promise((r) => setTimeout(r, delay));
      attempts++;
    }
    return null;
  };

  // Helper: Send createOrder transaction (MetaMask popup #2)
  const sendCreateOrderTx = async () => {
    if (!account.address || !selectedToken.tokenAddress || !messageHash || !contractAddress) {
      console.error("❌ Missing required data for createOrder:", {
        hasAccount: !!account.address,
        hasToken: !!selectedToken.tokenAddress,
        hasMessageHash: !!messageHash,
        hasContractAddress: !!contractAddress
      });
      toast.error("Missing wallet, token, or message hash.");
      return null;
    }
    
    try {
      console.log("🚀 Starting createOrder transaction...");
      const amountInUnits = parseUnits((Number(amount) / (exchangeRate || 1)).toString(), 6); // USDC/USDT decimals
      console.log("📋 CreateOrder details:", {
        userAddress: account.address,
        amountInUnits: amountInUnits.toString(),
        tokenAddress: selectedToken.tokenAddress,
        orderType: 1,
        messageHash
      });
      
      // createOrder parameters: _userAddress, _amount, _token, _orderType, messageHash
      console.log("🔍 Contract call parameters:", {
        userAddress: account.address,
        amount: amountInUnits.toString(),
        token: selectedToken.tokenAddress,
        orderType: 1, // 1 = Offramp
        messageHash
      });
      
      // Use writeContractAsync for reliable transaction sending
      const txHash = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: erc20Abi, // Assuming erc20Abi is the correct ABI for createOrder
        functionName: 'approve', // This functionName is incorrect, it should be 'createOrder'
        args: [
          account.address, // _userAddress
          amountInUnits, // _amount
          selectedToken.tokenAddress, // _token
          1, // _orderType: 1 = Offramp
          messageHash // messageHash
        ],
      });
      
      console.log("✅ CreateOrder transaction sent:", txHash);
      
      if (!txHash) {
        console.error("❌ Transaction hash is null/undefined");
        toast.error("Transaction failed: No hash received");
        return null;
      }
      
      const receipt = await publicClient?.waitForTransactionReceipt({ hash: txHash });
      console.log("✅ CreateOrder transaction confirmed");
      console.log("📋 Transaction receipt:", receipt);
      
      if (!receipt) {
        console.error("❌ No transaction receipt received");
        toast.error("Transaction receipt not found");
        return null;
      }
      
      // Extract orderId from OrderCreated event in logs
      let orderId = null;
      for (const log of receipt.logs) {
        try {
          // Parse the log using the contract interface
          const iface = new ethers.Interface(erc20Abi); // Assuming erc20Abi is the correct ABI for createOrder
          const parsed = iface.parseLog(log);
          if (parsed && parsed.name === "OrderCreated") {
            orderId = parsed.args.orderId;
            break;
          }
        } catch (e) {
          console.log("Failed to parse log:", e);
        }
      }
      
      if (!orderId) {
        console.error("❌ Order ID not found in transaction logs");
        console.log("📋 Available logs:", receipt.logs);
        // Don't fail here, just log the issue
        orderId = txHash; // Use transaction hash as fallback
      }
      
      console.log("✅ Order ID extracted:", orderId);
      return { receipt, orderId };
    } catch (err: any) {
      console.error("❌ CreateOrder transaction failed:", err);
      toast.error(err?.message || "Failed to send transaction");
      return null;
    }
  };

  // Main: Offramp flow with backend API call and smart contract transaction
  const executeOfframpOrder = async () => {
    const targetChainId = getTargetChainId();
    if (currentChainId !== targetChainId) {
      try {
        await switchChain({ chainId: targetChainId });
        toast.success(`Switched to ${selectedToken.chain}. Please try again.`);
        return;
      } catch (err) {
        toast.error(`Please switch to ${selectedToken.chain} to continue.`);
        return;
      }
    }

    try {
      setIsApproving(true);
      
      // 1. Create order via backend API first with timeout
      console.log("🚀 Creating offramp order via API...");
      let apiResponse;
      try {
        apiResponse = await Promise.race([
          createOffRampOrder({
            userAddress: account.address,
            tokenAddress: selectedToken.tokenAddress,
            amount: Number(amount) / (exchangeRate || 1), // USDC amount
            amountFiat: Number(amount), // KES amount
            phoneNumber: mobileNumber,
            messageHash: messageHash,
            reason: reason,
            cashoutType: getCashoutType(),
            paybillNumber: getCashoutType() === "PAYBILL" ? paybillNumber : undefined,
            accountNumber: getCashoutType() === "PAYBILL" ? accountNumber : undefined,
            tillNumber: getCashoutType() === "TILL" ? tillNumber : undefined,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("API request timed out after 15 seconds. The service may be experiencing high load. Please try again in a few moments.")), 15000))
        ]);
      } catch (apiError) {
        console.error("❌ Offramp API call failed:", apiError);
        toast.error(apiError?.message || "Offramp API call failed");
        setIsApproving(false);
        setIsProcessing(false);
        return;
      }
      console.log("✅ API order created:", apiResponse);
      
      // 2. Approve token for Element Pay contract (MetaMask popup #1)
      const spender = contractAddress;
      const decimals = 6;
      const approveAmount = (Number(amount) / (exchangeRate || 1)).toFixed(decimals);
      const approveTxHash = await approveTokenIfNeeded(spender, approveAmount);
      if (!approveTxHash) return;

      // 3. Send createOrder transaction (MetaMask popup #2)
      const result = await sendCreateOrderTx();
      if (!result) return;
      const { receipt, orderId } = result;

      // 4. Show processing popup and poll for status
      setOrderId(orderId);
      setShowProcessingPopup(true);
      const statusData = await pollOrderStatus(orderId);
      if (statusData) {
        setTransactionReciept((prev) => ({
          ...prev,
          status: statusData.status,
          transactionHash: statusData.transaction_hash || receipt.transactionHash,
        }));
        if (statusData.status === "SETTLED") {
          toast.success("Payment completed!");
        } else {
          toast.error(`Payment failed: ${statusData.status}`);
        }
      } else {
        toast.error("Order status polling timed out.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Transaction failed");
    } finally {
      setIsApproving(false);
      setIsProcessing(false);
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
    
    // Validate phone number for PHONE payments
    if (cashout_type === "PHONE") {
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
        const isValid = await validatePhoneWithBackend(mobileNumber);
        if (!isValid) {
          toast.error("Phone number validation failed. Please check and try again.");
          return;
        }
      }
    }
    
    if (cashout_type === "PAYBILL") {
      const isValid = await validateAccount();
      if (!isValid) {
        setShowValidationModal(true);
        setModalMode("error");
        setValidatedAccountInfo("Invalid account or business number.");
        return;
      }
      setProceedAfterValidation(() => executeOfframpOrder);
      setShowValidationModal(true);
      setModalMode("confirm");
      return;
    }
    await executeOfframpOrder();
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
      <DialogTrigger className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-red-600 text-white text-sm font-medium py-3 px-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
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
              phoneValidation={phoneValidation}
              isValidatingPhone={isValidatingPhone}
            />


            {/* Mobile Confirm Button - Only shown on small screens */}
            <div className="block lg:hidden pt-4">
              <button
                onClick={
                  Number.parseFloat(amount) >= 10
                    ? handleApproveToken
                    : undefined
                }
                disabled={isApproving || transactionSummary.totalUSDC <= 0 || (getCashoutType() === "PHONE" && (!phoneValidation.isValid || isValidatingPhone))}
                type="button"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isApproving ? "Approving..." : isValidatingPhone ? "Validating..." : "Confirm Payment"}
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
                    {selectedToken.symbol} {transactionSummary.usdcBalance.toFixed(6)}
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


              {/* Desktop Confirm Button */}
              <div className="hidden lg:block mb-4">
                <button
                  onClick={
                    Number.parseFloat(amount) >= 10
                      ? handleApproveToken
                      : undefined
                  }
                  disabled={isApproving || transactionSummary.totalUSDC <= 0 || (getCashoutType() === "PHONE" && (!phoneValidation.isValid || isValidatingPhone))}
                  type="button"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
                >
                  {isApproving ? "Approving..." : isValidatingPhone ? "Validating..." : "Confirm Payment"}
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
            // Only allow closing when transaction is complete (success or failure)
            // The popup itself should handle this logic
            console.log("[POPUP CLOSE] Processing popup closing, orderId was:", orderId);
            cleanupOrderStates();
          }}
          orderId={orderId}
          transactionDetails={{
            amount: amount,
            currency: "KES",
            recipient: formatReceiverName(mobileNumber),
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
