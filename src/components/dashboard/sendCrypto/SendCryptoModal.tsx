"use client";

import type React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowUpRight } from "lucide-react";
import { toast } from "react-toastify";
import PayToMobileMoney from "./PayToMobileMoney";
import ProcessingPopup from "./processing-popup";
import NetworkSwitchNotification from "@/components/ui/NetworkSwitchNotification";
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
import { getUSDCAddress } from "../../../services/tokens";
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
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { SUPPORTED_TOKENS, SupportedToken } from "@/constants/supportedTokens";
import { validateKenyanPhoneNumber, validatePhoneWithAPI } from "@/utils/phoneValidation";
import { createOffRampOrder } from "@/app/api/aggregator";
import { ethers } from "ethers";

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
  // Keep but don't use these variables to preserve the component's state structure
  const [isApproving, setIsApproving] = useState(false);
  const [, setIsProcessing] = useState(false);
  
  // Get balance for the selected token dynamically
  const { balance: selectedTokenBalance } = useTokenBalance({ 
    token: selectedToken 
  });
  
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [rateMeta, setRateMeta] = useState<{
    base: number | null;
    marked: number | null;
    markupPct: number | null;
    mode: 'OffRamp' | 'OnRamp' | 'Unknown';
    source: string; // which URL succeeded
    fallbackUsed: boolean;
  }>({ base: null, marked: null, markupPct: null, mode: 'Unknown', source: '', fallbackUsed: false });
  const [orderId, setOrderId] = useState("");
  const [showProcessingPopup, setShowProcessingPopup] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; error?: string }>({ isValid: false });
  const [isValidatingPhone, setIsValidatingPhone] = useState(false);
  const [finalTransactionData, setFinalTransactionData] = useState<any>(null); // Store complete transaction data from API
  const [isPollingComplete, setIsPollingComplete] = useState(false); // Flag to indicate polling is done

  // Network switch notification state
  const [networkSwitchNotification, setNetworkSwitchNotification] = useState({
    isVisible: false,
    networkName: '',
    status: 'switching' as 'switching' | 'success' | 'error'
  });

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
  const [isMainDialogOpen, setIsMainDialogOpen] = useState(false);

  // Keep but don't directly use this state to preserve the component structure
  const [, setCashoutType] = useState<"PHONE" | "PAYBILL" | "TILL">("PHONE");

  // Network switch notification helper functions
  const showNetworkSwitchNotification = (networkName: string, status: 'switching' | 'success' | 'error') => {
    console.log(`🔔 Network notification: ${status} for ${networkName}`);
    setNetworkSwitchNotification({
      isVisible: true,
      networkName,
      status
    });
  };

  const hideNetworkSwitchNotification = () => {
    setNetworkSwitchNotification(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  const getCashoutType = useCallback((): "PHONE" | "PAYBILL" | "TILL" => {
    if (paybillNumber && accountNumber) return "PAYBILL";
    if (tillNumber) return "TILL";
    return "PHONE";
  }, [paybillNumber, accountNumber, tillNumber]);

  const validateAccount = async () => {
    // Element Pay API doesn't have a separate validation endpoint
    // Validation will happen during order creation
    console.log("� Skipping pre-validation - Element Pay will validate during order creation");
    
    const cashoutType = getCashoutType();
    if (cashoutType === "PAYBILL") {
      // Just set a placeholder name since we can't pre-validate
      setValidatedAccountInfo(`PayBill ${paybillNumber}`);
    } else if (cashoutType === "TILL") {
      setValidatedAccountInfo(`Till ${tillNumber}`);
    }
    
    return true; // Always return true since we can't pre-validate
  };

  // Set isBrowser to true once component mounts (client-side only)
  useEffect(() => {
    setIsBrowser(true);
    // Set API key only on the client side
    setApiKey(process.env.NEXT_PUBLIC_AGGR_API_KEY || "");
  }, []);

  // Fetch marked-up (or adjusted) exchange rate from Element Pay API
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const currencyMap: Record<string, string> = {
          'USDT': 'usdt_lisk',
          'USDC': 'usdc',
          'WXM': 'wxm',
          'ETH': 'eth'
        };
        const currency = currencyMap[selectedToken.symbol] || 'usdc';
        // q=1 => OffRamp (markup subtracted). We are in an OffRamp flow.
        const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/rates?currency=${currency}`;
        const offRampUrl = `${baseUrl}&q=1`;
        const legacyOffRampUrl = `${baseUrl}&order_type=OffRamp`; // legacy/textual variant

        let usedUrl = offRampUrl;
        let response: Response | null = null;
        let fallbackUsed = false;

        // 1. Try primary OffRamp param q=1
        try {
          response = await fetch(offRampUrl);
          if (!response.ok) throw new Error(`Primary q=1 request failed (${response.status})`);
        } catch (e) {
          console.warn('[RATES] Primary OffRamp (q=1) failed:', e);
          // 2. Try legacy textual param
            try {
              response = await fetch(legacyOffRampUrl);
              usedUrl = legacyOffRampUrl;
              if (!response.ok) throw new Error(`Legacy order_type=OffRamp failed (${response.status})`);
              fallbackUsed = true;
            } catch (e2) {
              console.warn('[RATES] Legacy OffRamp (order_type=OffRamp) failed:', e2);
              // 3. FINAL FALLBACK: Base URL (OnRamp) - log a HARD warning
              response = await fetch(baseUrl);
              usedUrl = baseUrl;
              fallbackUsed = true;
              if (!response.ok) {
                throw new Error(`Base URL fallback also failed (${response.status})`);
              }
            }
        }

        const data = await response.json();
        console.log('[RATES] Raw response from', usedUrl, ':', data);

        const base_rate = typeof data?.base_rate === 'number' ? data.base_rate : null;
        const marked_up_rate = typeof data?.marked_up_rate === 'number' ? data.marked_up_rate : (typeof data?.rate === 'number' ? data.rate : null);
        const markup_percentage = typeof data?.markup_percentage === 'number' ? data.markup_percentage : null;

        if (marked_up_rate == null) {
          console.error('[RATES] No usable rate field (marked_up_rate/rate) in response, setting exchangeRate = null');
          setExchangeRate(null);
          setRateMeta({ base: base_rate, marked: null, markupPct: markup_percentage, mode: 'Unknown', source: usedUrl, fallbackUsed });
          return;
        }

        // Heuristic mode detection
        let detectedMode: 'OffRamp' | 'OnRamp' | 'Unknown' = 'Unknown';
        if (usedUrl.includes('q=1') || usedUrl.includes('order_type=OffRamp')) {
          detectedMode = 'OffRamp';
        } else if (!usedUrl.includes('q=')) {
          detectedMode = 'OnRamp';
        }
        // Cross-check with numeric relationship if both rates exist
        if (base_rate != null) {
          if (marked_up_rate < base_rate && detectedMode === 'OnRamp') {
            console.warn('[RATES] Relationship (marked_up < base_rate) suggests OffRamp but URL indicates OnRamp. Possible fallback mismatch.');
            detectedMode = 'OffRamp';
          }
          if (marked_up_rate > base_rate && detectedMode === 'OffRamp') {
            console.warn('[RATES] Relationship (marked_up > base_rate) suggests OnRamp but URL indicates OffRamp. Backend may be returning OnRamp despite q=1.');
            detectedMode = 'OnRamp';
          }
        }

        // Log summary
        console.log('[RATES] Summary:', {
          usedUrl,
          fallbackUsed,
            base_rate,
          marked_up_rate,
          markup_percentage,
          detectedMode,
          expectation: 'OffRamp',
          interpretation: detectedMode === 'OffRamp' ? 'Using adjusted (customer receives lower rate)' : detectedMode === 'OnRamp' ? 'Using marked-up buy rate (UNEXPECTED for offramp)' : 'Unknown'
        });

        if (detectedMode !== 'OffRamp') {
          console.warn('[RATES] WARNING: Using a rate not confidently identified as OffRamp. Check backend support for q=1 or investigate fallbacks.');
        }

        setExchangeRate(marked_up_rate);
        setRateMeta({
          base: base_rate,
          marked: marked_up_rate,
          markupPct: markup_percentage,
          mode: detectedMode,
          source: usedUrl,
          fallbackUsed
        });
      } catch (e) {
        console.error('[RATES] Failed to fetch exchange rate:', e);
        setExchangeRate(null);
        setRateMeta({ base: null, marked: null, markupPct: null, mode: 'Unknown', source: '', fallbackUsed: false });
      }
    };
    if (isBrowser) {
      fetchExchangeRate();
    }
  }, [isBrowser, selectedToken]);
  console.log("[RATES] Exchange rate fetched:", exchangeRate, rateMeta);
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
    const remainingBalance = selectedTokenBalance - totalUSDC;
    const totalKES = selectedTokenBalance * exchangeRate;
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
      usdcBalance: selectedTokenBalance,
    };
  }, [amount, exchangeRate, selectedTokenBalance]);

  // Helper function to check if the form is valid for the current payment method
  const isFormValid = useCallback(() => {
    const cashoutType = getCashoutType();
    
    // Common validations
    if (!amount || Number.parseFloat(amount) < 10) return false;
    if (transactionSummary.totalUSDC <= 0) return false;
    
    // Payment method specific validations
    switch (cashoutType) {
      case "PHONE":
        return phoneValidation.isValid && !isValidatingPhone && mobileNumber;
      case "PAYBILL":
        return paybillNumber && accountNumber;
      case "TILL":
        return tillNumber;
      default:
        return false;
    }
  }, [getCashoutType, amount, transactionSummary.totalUSDC, phoneValidation.isValid, isValidatingPhone, mobileNumber, paybillNumber, accountNumber, tillNumber]);

  // Now we can safely reference transactionSummary in useEffect
  useEffect(() => {
    if (
      isBrowser &&
      exchangeRate &&
      transactionSummary.totalUSDC &&
      amount
    ) {
      const cashoutType = getCashoutType();
      
      // Check if we have the required fields for the current payment method
      let hasRequiredFields = false;
      switch (cashoutType) {
        case "PHONE":
          hasRequiredFields = !!mobileNumber;
          break;
        case "PAYBILL":
          hasRequiredFields = !!paybillNumber && !!accountNumber;
          break;
        case "TILL":
          hasRequiredFields = !!tillNumber;
          break;
      }
      
      if (hasRequiredFields) {
        try {
          const hash = encryptMessageDetailed({
            cashout_type: cashoutType,
            amount_fiat: Number.parseFloat(amount),
            currency: "KES",
            rate: exchangeRate ?? 0,
            phone_number: cashoutType === "PHONE" ? mobileNumber : "",
            paybill_number: cashoutType === "PAYBILL" ? paybillNumber : "",
            account_number: cashoutType === "PAYBILL" ? accountNumber : "",
            till_number: cashoutType === "TILL" ? tillNumber : "",
          });

          setMessageHash(hash);
        } catch (error) {
          console.error("Error encrypting message:", error);
        }
      } else {
        // Clear message hash if required fields are missing
        setMessageHash("");
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
  // Remove unused contract variables
  // const { contract, address } = useContract(contractAddress);
  // const usdcTokenAddress = getUSDCAddress() as `0x${string}`;

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
    setFinalTransactionData(null);
    setIsPollingComplete(false);
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
    const maxAttempts = 30; // Increased from 20 to give more time for M-Pesa receipt
    const delay = 3000;
    console.log("🔄 Starting order status polling for:", txHash);
    
    while (attempts < maxAttempts) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/tx/${txHash}`, {
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        console.log(`📋 Poll attempt ${attempts + 1}/${maxAttempts} - Order status response:`, data);
        
        // Check if we have order data
        if (data?.data) {
          const orderData = data.data;
          console.log("📋 Order data found:", orderData);
          
          // Check for final states (settled or failed)
          const isFinalState = orderData.status && ["SETTLED", "FAILED", "SETTLED_UNVERIFIED", "COMPLETED"].includes(orderData.status);
          
          // Also consider it successful if we have important receipt indicators
          const hasReceiptNumber = !!(orderData.receipt_number || orderData.mpesa_receipt_number || orderData.file_id);
          const hasTransactionHash = !!(orderData.transaction_hashes?.settlement || orderData.transaction_hashes?.creation);
          
          console.log("📋 Status check:", {
            status: orderData.status,
            isFinalState,
            hasReceiptNumber,
            hasTransactionHash,
            receiptNumber: orderData.receipt_number,
            mpesaReceiptNumber: orderData.mpesa_receipt_number,
            fileId: orderData.file_id
          });
          
          if (isFinalState || (attempts > 10 && (hasReceiptNumber || hasTransactionHash))) {
            console.log("✅ Final order status received:", orderData);
            
            // More intelligent status determination
            let normalizedStatus = "SETTLED"; // Default to settled if we have receipts/hashes
            
            // Only mark as failed if explicitly failed
            if (orderData.status === "FAILED" || orderData.status === "REJECTED" || orderData.status === "CANCELLED") {
              normalizedStatus = "FAILED";
            }
            // Consider it settled if we have receipt indicators or success statuses
            else if (
              orderData.status === "SETTLED" || 
              orderData.status === "COMPLETED" || 
              orderData.status === "SETTLED_UNVERIFIED" ||
              hasReceiptNumber || 
              hasTransactionHash
            ) {
              normalizedStatus = "SETTLED";
            }
            
            console.log("📋 Status normalization:", {
              originalStatus: orderData.status,
              normalizedStatus,
              hasReceiptNumber,
              hasTransactionHash
            });
            
            return {
              ...orderData,
              // Use the more intelligent status determination
              status: normalizedStatus,
              transaction_hash: orderData.transaction_hashes?.settlement || orderData.transaction_hashes?.creation || txHash,
              receipt_number: orderData.mpesa_receipt_number || orderData.receipt_number || orderData.file_id || "",
              receiver_name: orderData.receiver_name || "",
              mpesa_receipt_number: orderData.mpesa_receipt_number || "",
              created_at: orderData.created_at || new Date().toISOString(),
              amount_fiat: orderData.amount_fiat
            };
          }
        }
      } catch (e) {
        console.log(`⚠️ Poll attempt ${attempts + 1} failed:`, e);
        // ignore, will retry
      }
      await new Promise((r) => setTimeout(r, delay));
      attempts++;
    }
    console.log("❌ Order status polling timed out after", maxAttempts, "attempts");
    return null;
  };

  // Main: Offramp flow with backend API call and smart contract transaction
  const executeOfframpOrder = async () => {
    const targetChainId = getTargetChainId();
    if (currentChainId !== targetChainId) {
      console.log(`🔄 Network switch needed: ${currentChainId} -> ${targetChainId} (${selectedToken.chain})`);
      
      // Show switching notification
      showNetworkSwitchNotification(selectedToken.chain, 'switching');
      
      try {
        await switchChain({ chainId: targetChainId });
        
        // Wait a moment for the network to switch
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Show success notification
        showNetworkSwitchNotification(selectedToken.chain, 'success');
        
        console.log(`✅ Successfully switched to ${selectedToken.chain} network`);
        toast.success(`Switched to ${selectedToken.chain}. Please try again.`);
        return;
      } catch (err) {
        console.error("❌ Network switch failed:", err);
        
        // Show error notification
        showNetworkSwitchNotification(selectedToken.chain, 'error');
        
        toast.error(`Please switch to ${selectedToken.chain} to continue.`);
        return;
      }
    }

    try {
      setIsApproving(true);

      // Validate all required fields before proceeding
      const cashoutType = getCashoutType();
      let validationError = '';
      
      if (!account.address || !selectedToken.tokenAddress || !amount || !messageHash) {
        validationError = 'Missing required order details. Please fill all fields and connect your wallet.';
      } else if (cashoutType === "PHONE" && !mobileNumber) {
        validationError = 'Phone number is required for Send Money.';
      } else if (cashoutType === "PAYBILL" && (!paybillNumber || !accountNumber)) {
        validationError = 'Business number and account number are required for Pay Bill.';
      } else if (cashoutType === "TILL" && !tillNumber) {
        validationError = 'Till number is required for Buy Goods.';
      }
      
      if (validationError) {
        console.error('Missing required order details:', {
          user_address: account.address,
          token: selectedToken.tokenAddress,
          amount,
          mobileNumber,
          messageHash,
          cashoutType,
          paybillNumber,
          accountNumber,
          tillNumber,
          error: validationError
        });
        toast.error(validationError);
        setIsApproving(false);
        setIsProcessing(false);
        return;
      }

      // Show processing popup immediately when we start processing
      setShowProcessingPopup(true);
      
      // Update initial transaction receipt data
      const initialReceiptData = {
        amount: amount,
        amountUSDC: transactionSummary.usdcAmount,
        phoneNumber: getCashoutType() === "PHONE" ? mobileNumber : (getCashoutType() === "PAYBILL" ? `${paybillNumber} - ${accountNumber}` : tillNumber),
        address: account.address || "",
        transactionHash: "",
        status: 0, // Processing initially
      };
      
      console.log("📋 Initial transaction receipt data:", initialReceiptData);
      setTransactionReciept((prev) => ({
        ...prev,
        ...initialReceiptData
      }));

      // 1. Approve token for Element Pay contract (MetaMask popup #1)
      const spender = contractAddress;
      const decimals = 6;
      const approveAmount = (Number(amount) / (exchangeRate || 1)).toFixed(decimals);
      const approveTxHash = await approveTokenIfNeeded(spender, approveAmount);
      if (!approveTxHash) {
        // Handle approval error - close popup and show error
        setShowProcessingPopup(false);
        setIsApproving(false);
        setIsProcessing(false);
        return;
      }

      // Debug log all order details before signing
      console.log('DEBUG orderDetails:', {
        user_address: account.address,
        token: selectedToken.tokenAddress,
        amount,
        mobileNumber,
        messageHash,
        cashoutType: getCashoutType(),
        paybillNumber,
        accountNumber,
        tillNumber
      });

      // 2. Prompt user to sign a message (MetaMask popup #2)
      const orderDetails = {
        user_address: account.address as string, // We already validated this above
        token: selectedToken.tokenAddress,
        order_type: 1,
        fiat_payload: {
          amount_fiat: Number(amount),
          cashout_type: getCashoutType(),
          currency: "KES",
          phone_number: getCashoutType() === "PHONE" ? mobileNumber : undefined,
          paybill_number: getCashoutType() === "PAYBILL" ? paybillNumber : undefined,
          account_number: getCashoutType() === "PAYBILL" ? accountNumber : undefined,
          till_number: getCashoutType() === "TILL" ? tillNumber : undefined,
        },
        message_hash: messageHash,
        reason: reason,
      };
      let _signature; // Currently unused but kept for future signature verification
      try {
        if (!window.ethereum) throw new Error("Wallet not found");
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const message = JSON.stringify(orderDetails);
        _signature = await signer.signMessage(message);
      } catch (signError) {
        console.error("❌ Signature rejected or failed:", signError);
        setShowProcessingPopup(false);
        toast.error("Signature rejected or failed. Please try again.");
        setIsApproving(false);
        setIsProcessing(false);
        return;
      }

      // 3. Send order details + signature to backend (map fields to expected names)
      let apiResponse;
      try {
        console.log("🌐 Preparing API request...");
        const fiatPayload = orderDetails.fiat_payload;
        console.log("📤 Starting offramp order creation with 45s timeout...");
        const startTime = Date.now();
        
        // Use 45s timeout - longer than the axios 30s timeout to allow for retries
        apiResponse = await Promise.race([
          createOffRampOrder({
            userAddress: orderDetails.user_address,
            tokenAddress: orderDetails.token,
            amount: Number(fiatPayload.amount_fiat), // token amount
            amountFiat: Number(fiatPayload.amount_fiat), // KES amount
            phoneNumber: fiatPayload.phone_number || "",
            messageHash: orderDetails.message_hash,
            reason: orderDetails.reason,
            cashoutType: fiatPayload.cashout_type,
            paybillNumber: fiatPayload.paybill_number || "",
            accountNumber: fiatPayload.account_number || "",
            tillNumber: fiatPayload.till_number || ""
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("API request timed out after 45 seconds. The Element Pay service may be experiencing high load. Please try again in a few moments or contact support if the issue persists.")), 45000))
        ]);
        
        const endTime = Date.now();
        console.log(`✅ API request completed in ${endTime - startTime}ms`);
      } catch (apiError) {
        console.error("❌ Offramp API call failed:", apiError);
        setShowProcessingPopup(false);
        
        // Check if it's a timeout error
        const errorMessage = (apiError as any)?.message || "Payment processing failed. Please try again.";
        if (errorMessage.includes("timed out")) {
          toast.error("The payment is taking longer than expected. Please check your transaction history in a few minutes or contact support if needed.");
        } else {
          toast.error(errorMessage);
        }
        
        setIsApproving(false);
        setIsProcessing(false);
        return;
      }
      console.log("✅ API order created:", apiResponse);

      // 4. Extract order ID and update transaction receipt with orderId
      const orderId = (apiResponse as any)?.tx_hash || (apiResponse as any)?.order_id || "";
      console.log("📋 Order ID extracted:", orderId);
      setOrderId(orderId);
      
      // Update transaction receipt with orderId
      setTransactionReciept((prev) => ({
        ...prev,
        transactionHash: orderId
      }));
      
      const statusData = await pollOrderStatus(orderId);
      if (statusData) {
        console.log("📋 Final status data received:", statusData);
        const isSettled = statusData.status === "SETTLED";
        const isFailed = statusData.status === "FAILED";
        
        // Store complete transaction data for ProcessingPopup
        setFinalTransactionData(statusData);
        setIsPollingComplete(true); // Mark polling as complete
        
        console.log("🔍 SendCryptoModal: Final transaction data set:", {
          receiver_name: statusData.receiver_name,
          amount_fiat: statusData.amount_fiat,
          transaction_hash: statusData.transaction_hash,
          receipt_number: statusData.receipt_number || statusData.mpesa_receipt_number,
          fullStatusData: statusData
        });
        
        const finalReceiptData = {
          status: isSettled ? 1 : (isFailed ? 2 : 0),
          transactionHash: statusData.transaction_hash || orderId,
        };
        
        console.log("📋 Final transaction receipt data:", finalReceiptData);
        setTransactionReciept((prev) => ({
          ...prev,
          ...finalReceiptData
        }));
        
        if (isSettled) {
          toast.success(`Payment completed! ${statusData.mpesa_receipt_number ? `M-Pesa Receipt: ${statusData.mpesa_receipt_number}` : ''}`);
        } else if (isFailed) {
          toast.error(`Payment failed: ${statusData.failure_reason || 'Transaction was not completed successfully'}`);
        }
      } else {
        // Handle polling timeout - update UI to show timeout state
        console.log("⏰ Order status polling timed out");
        setIsPollingComplete(true); // Mark polling as complete even on timeout
        setTransactionReciept((prev) => ({
          ...prev,
          status: 2 // Mark as failed due to timeout
        }));
        toast.error("Payment is taking longer than expected. Please check your transaction history or contact support.");
      }
    } catch (err: any) {
      console.error("❌ Transaction process failed:", err);
      setShowProcessingPopup(false);
      toast.error(err?.message || "Transaction failed. Please try again.");
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
        const isPhoneValid = await validatePhoneWithBackend(mobileNumber);
        if (!isPhoneValid) {
          toast.error("Phone number validation failed. Please check and try again.");
          return;
        }
      }
    }
    
    // Validate till number for TILL payments
    if (cashout_type === "TILL") {
      if (!tillNumber) {
        toast.error("Please enter a till number");
        return;
      }
      // You can add till number validation here if needed
      await executeOfframpOrder();
      return;
    }
    
    if (cashout_type === "PAYBILL") {
      if (!paybillNumber || !accountNumber) {
        toast.error("Please enter both business number and account number");
        return;
      }
      // Skip validation and proceed directly since Element Pay API doesn't have a validation endpoint
      await validateAccount(); // This will always return true now
      console.log("📋 PayBill validation complete, setting up modal");
      setProceedAfterValidation(() => () => {
        console.log("📋 Proceed button clicked, executing offramp order");
        executeOfframpOrder();
      });
      
      // Close main dialog to prevent backdrop interference
      setIsMainDialogOpen(false);
      
      // Small delay to ensure dialog closes before showing confirmation modal
      setTimeout(() => {
        setShowValidationModal(true);
        setModalMode("confirm");
      }, 100);
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

  // Debug final transaction data changes
  useEffect(() => {
    console.log("[FINAL TRANSACTION DATA] finalTransactionData changed to:", finalTransactionData);
    console.log("[FINAL TRANSACTION DATA] transactionReciept status:", transactionReciept.status);
    console.log("[FINAL TRANSACTION DATA] isPollingComplete:", isPollingComplete);
    console.log("[FINAL TRANSACTION DATA] paymentStatus would be:", transactionReciept.status === 1 ? "Settled" : transactionReciept.status === 2 ? "Failed" : "Processing");
  }, [finalTransactionData, transactionReciept.status, isPollingComplete]);

  // Update transaction receipt when relevant values change
  useEffect(() => {
    if (isBrowser) {
      const cashoutType = getCashoutType();
      let recipientInfo = "";
      
      // Generate recipient info based on payment method
      switch (cashoutType) {
        case "PHONE":
          recipientInfo = mobileNumber || "";
          break;
        case "PAYBILL":
          recipientInfo = paybillNumber && accountNumber ? `${paybillNumber} - ${accountNumber}` : "";
          break;
        case "TILL":
          recipientInfo = tillNumber || "";
          break;
      }
      
      setTransactionReciept((prev) => ({
        ...prev,
        amount: amount || "0.00",
        amountUSDC: transactionSummary.usdcAmount || 0,
        phoneNumber: recipientInfo,
        address: account.address || "",
      }));
    }
  }, [isBrowser, amount, transactionSummary.usdcAmount, mobileNumber, paybillNumber, accountNumber, tillNumber, getCashoutType, account.address]);

  return (
    <>
      <Dialog open={isMainDialogOpen} onOpenChange={setIsMainDialogOpen}>
        <DialogTrigger 
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-red-600 text-white text-sm font-medium py-3 px-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          onClick={() => setIsMainDialogOpen(true)}
        >
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
                  disabled={isApproving || !isFormValid()}
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
                      KE {(transactionSummary.transactionCharge * (exchangeRate || 1)).toFixed(2)}
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
                    disabled={isApproving || !isFormValid()}
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

        {/* Network Switch Notification */}
        <NetworkSwitchNotification
          isVisible={networkSwitchNotification.isVisible}
          networkName={networkSwitchNotification.networkName}
          status={networkSwitchNotification.status}
          onClose={hideNetworkSwitchNotification}
        />
      </Dialog>

      {/* Render modals outside of Dialog to prevent click interference */}
      <ConfirmationModal
        isOpen={showValidationModal}
        onClose={() => {
          setShowValidationModal(false);
          // Reopen main dialog when confirmation modal is cancelled
          setTimeout(() => {
            setIsMainDialogOpen(true);
          }, 100);
        }}
        onConfirm={() => {
          // Execute the proceed function and close confirmation modal
          proceedAfterValidation();
          setShowValidationModal(false);
          // Don't reopen main dialog since we're proceeding with the transaction
        }}
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
          disableInternalPolling={true} // Disable ProcessingPopup's own polling
          transactionDetails={{
            amount: finalTransactionData?.amount_fiat?.toString() || transactionReciept.amount || amount,
            currency: "KES",
            tokenSymbol: selectedToken.symbol, // Add the actual token symbol
            tokenAmount: transactionSummary.usdcAmount.toFixed(6), // Add the token amount
            network: selectedToken.chain, // Add the network/chain information
            recipient: finalTransactionData?.receiver_name || (() => {
              const cashoutType = getCashoutType();
              switch (cashoutType) {
                case "PHONE":
                  return mobileNumber ? formatReceiverName(mobileNumber) : "Mobile Money Recipient";
                case "PAYBILL":
                  return paybillNumber && accountNumber 
                    ? `PayBill: ${paybillNumber} - ${accountNumber}` 
                    : "PayBill Payment";
                case "TILL":
                  return tillNumber ? `Till: ${tillNumber}` : "Till Payment";
                default:
                  return "Mobile Money Recipient";
              }
            })(),
            paymentMethod: (() => {
              const cashoutType = getCashoutType();
              switch (cashoutType) {
                case "PHONE":
                  return "Mobile Money";
                case "PAYBILL":
                  return "PayBill";
                case "TILL":
                  return "Buy Goods";
                default:
                  return "Mobile Money";
              }
            })(),
            transactionHash: finalTransactionData?.transaction_hash || transactionReciept.transactionHash || orderId || "",
            date: finalTransactionData?.created_at || new Date().toISOString(),
            receiptNumber: finalTransactionData?.mpesa_receipt_number || finalTransactionData?.receipt_number || finalTransactionData?.file_id || "",
            mpesa_receipt_number: finalTransactionData?.mpesa_receipt_number || "",
            paymentStatus: transactionReciept.status === 1 ? "Settled" : transactionReciept.status === 2 ? "Failed" : "Processing",
            status: transactionReciept.status,
            // Add orderId to help with debugging
            orderId: orderId
          }}
        />
      )}
    </>
  );
};

export default SendCryptoModal;
