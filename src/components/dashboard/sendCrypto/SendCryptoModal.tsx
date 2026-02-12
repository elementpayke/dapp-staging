"use client";

import type React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowUpRight } from "lucide-react";
import { toast } from "react-toastify";
import PayToMobileMoney from "./PayToMobileMoney";
import MaxOfframpButton from "./MaxOfframpButton";
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
  useWalletClient,
} from "wagmi";
import { erc20Abi } from "@/app/api/abi";
import { isSmartWallet, safeChainSwitch } from "@/lib/wallet-utils";

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
import {
  validateKenyanPhoneNumber,
  validatePhoneWithAPI,
} from "@/utils/phoneValidation";
import { createOffRampOrder, fetchOrderQuote } from "@/app/api/aggregator";
import { ethers } from "ethers";
import { getTokenConfig } from "@/constants/tokenConfig";
import {
  FeeBand,
  fetchFeeStructureCached,
  getTotalCost,
  getApiCurrencyFromToken,
  DEFAULT_FEE_BANDS,
  MIN_TRANSACTION_AMOUNT_KES,
} from "@/utils/feeStructure";

interface TransactionReceipt {
  amount: string;
  amountUSDC: number;
  phoneNumber: string;
  address: string;
  status: number;
  transactionHash: string;
}
interface QuoteValidation {
  isValidating: boolean;
  isValid: boolean;
  error: string | null;
  requiredAmount: number | null;
  availableBalance: number | null;
  hasSufficientBalance: boolean | null;
}

const SendCryptoModal: React.FC = () => {
  const [selectedToken, setSelectedToken] = useState<SupportedToken>(
    SUPPORTED_TOKENS[0],
  );
  const [amount, setAmount] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [reason, setReason] = useState(""); // Optional reason for payment
  const [isApproving, setIsApproving] = useState(false);
  const [, setIsProcessing] = useState(false);

  const { balance: selectedTokenBalance } = useTokenBalance({
    token: selectedToken,
  });

  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [rateMeta, setRateMeta] = useState<{
    base: number | null;
    marked: number | null;
    markupPct: number | null;
    mode: "OffRamp" | "OnRamp" | "Unknown";
    source: string;
    fallbackUsed: boolean;
  }>({
    base: null,
    marked: null,
    markupPct: null,
    mode: "Unknown",
    source: "",
    fallbackUsed: false,
  });
  const [feeBands, setFeeBands] = useState<FeeBand[]>([]);
  const [isFetchingFees, setIsFetchingFees] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [showProcessingPopup, setShowProcessingPopup] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<{
    isValid: boolean;
    error?: string;
  }>({ isValid: false });
  const [isValidatingPhone, setIsValidatingPhone] = useState(false);
  const [quoteValidation, setQuoteValidation] = useState<QuoteValidation>({
    isValidating: false,
    isValid: false,
    error: null,
    requiredAmount: null,
    availableBalance: null,
    hasSufficientBalance: null,
  });
  const [finalTransactionData, setFinalTransactionData] = useState<any>(null);
  const [isPollingComplete, setIsPollingComplete] = useState(false);

  const [networkSwitchNotification, setNetworkSwitchNotification] = useState({
    isVisible: false,
    networkName: "",
    status: "switching" as "switching" | "success" | "error",
  });

  useEffect(() => {
    console.log("[ORDER ID CHANGE] orderId changed to:", orderId);
    console.log(
      "[ORDER ID CHANGE] showProcessingPopup is:",
      showProcessingPopup,
    );
  }, [orderId, showProcessingPopup]);

  const [messageHash, setMessageHash] = useState("");
  const [isBrowser, setIsBrowser] = useState(false);

  const [paybillNumber, setPaybillNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [tillNumber, setTillNumber] = useState("");

  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validatedAccountInfo, setValidatedAccountInfo] = useState("");
  const [proceedAfterValidation, setProceedAfterValidation] = useState<() => void>(() => () => {});
  const [modalMode, setModalMode] = useState<"confirm" | "error">("confirm");
  const [isMainDialogOpen, setIsMainDialogOpen] = useState(false);

  const [, setCashoutType] = useState<"PHONE" | "PAYBILL" | "TILL">("PHONE");

  const account = useAccount();
  const { connector } = account;
  const { writeContractAsync } = useWriteContract();
  const { data: walletClient } = useWalletClient();

  // Detect if user is on mobile device
  const isMobileDevice = useMemo(() => {
    if (typeof window === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  }, []);

  // Check if using WalletConnect (typically mobile wallet)
  const isWalletConnect = useMemo(() => {
    return (
      connector?.id === "walletConnect" ||
      connector?.name?.toLowerCase().includes("walletconnect")
    );
  }, [connector]);

  // Combined check for mobile wallet flow
  const isMobileWalletFlow = useMemo(() => {
    return isMobileDevice || isWalletConnect;
  }, [isMobileDevice, isWalletConnect]);

  const showNetworkSwitchNotification = (
    networkName: string,
    status: "switching" | "success" | "error",
  ) => {
    console.log(`🔔 Network notification: ${status} for ${networkName}`);
    setNetworkSwitchNotification({
      isVisible: true,
      networkName,
      status,
    });
  };

  const hideNetworkSwitchNotification = () => {
    setNetworkSwitchNotification((prev) => ({
      ...prev,
      isVisible: false,
    }));
  };

  const getCashoutType = useCallback((): "PHONE" | "PAYBILL" | "TILL" => {
    if (paybillNumber && accountNumber) return "PAYBILL";
    if (tillNumber) return "TILL";
    return "PHONE";
  }, [paybillNumber, accountNumber, tillNumber]);

  const handleMaxAmountSet = useCallback((maxAmount: string) => {
    setAmount(maxAmount);
  }, []);

  const validateAccount = async () => {

    const cashoutType = getCashoutType();
    if (cashoutType === "PAYBILL") {
      setValidatedAccountInfo(`PayBill ${paybillNumber}`);
    } else if (cashoutType === "TILL") {
      setValidatedAccountInfo(`Till ${tillNumber}`);
    }

    return true;
  };

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Fetch both exchange rate AND fee bands from the fee-structure API (single source of truth)
  useEffect(() => {
    const fetchFeeStructureAndRate = async () => {
      if (!isBrowser) return;

      setIsFetchingFees(true);
      try {
        const apiCurrency = getApiCurrencyFromToken(selectedToken.symbol);
        const feeData = await fetchFeeStructureCached({
          token: apiCurrency,
          action: "OffRamp",
        });

        console.log("[FEE-STRUCTURE] API response:", feeData.data);

        // Set fee bands from fee-structure API
        setFeeBands(feeData.data.fee_bands);

        // Set exchange rate from fee-structure API (base_rate)
        const baseRate = feeData.data.base_rate;
        if (baseRate && baseRate > 0) {
          setExchangeRate(baseRate);
          setRateMeta({
            base: baseRate,
            marked: baseRate, // For OffRamp, we use base_rate directly
            markupPct: null,
            mode: "OffRamp",
            source: "fee-structure",
            fallbackUsed: false,
          });
          console.log(
            "[FEE-STRUCTURE] Exchange rate set:",
            baseRate,
            "KES per",
            selectedToken.symbol,
          );
        } else {
          console.warn("[FEE-STRUCTURE] No valid base_rate in response");
          setExchangeRate(null);
          setRateMeta({
            base: null,
            marked: null,
            markupPct: null,
            mode: "Unknown",
            source: "fee-structure",
            fallbackUsed: true,
          });
        }
      } catch (error) {
        console.error("[FEE-STRUCTURE] Failed to fetch fee structure:", error);
        // Use centralized default fee bands for consistency
        setFeeBands(DEFAULT_FEE_BANDS);
        setExchangeRate(null);
        setRateMeta({
          base: null,
          marked: null,
          markupPct: null,
          mode: "Unknown",
          source: "",
          fallbackUsed: true,
        });
      } finally {
        setIsFetchingFees(false);
      }
    };

    fetchFeeStructureAndRate();
  }, [isBrowser, selectedToken]);

  // Log exchange rate changes (inside useEffect to prevent spam on every render)
  useEffect(() => {
    if (exchangeRate !== null) {
      console.log(
        "[FEE-STRUCTURE] Exchange rate updated:",
        exchangeRate,
        "KES per token",
        rateMeta,
      );
    }
  }, [exchangeRate, rateMeta]);
  const validatePhoneWithBackend = async (
    phoneNumber: string,
  ): Promise<boolean> => {
    try {
      setIsValidatingPhone(true);

      const result = await validatePhoneWithAPI(phoneNumber);

      setPhoneValidation(result);
      return result.isValid;
    } catch (error) {
      console.error("Phone validation error:", error);
      const clientValidation = validateKenyanPhoneNumber(phoneNumber);
      setPhoneValidation(clientValidation);
      return clientValidation.isValid;
    } finally {
      setIsValidatingPhone(false);
    }
  };

  const validateAmountWithQuote = useCallback(async () => {
    // Reset validation state
    setQuoteValidation({
      isValidating: false,
      isValid: false,
      error: null,
      requiredAmount: null,
      availableBalance: null,
      hasSufficientBalance: null,
    });

    // Basic validations first
    const amountNum = Number.parseFloat(amount);

    // Check if amount is empty or zero
    if (!amount || amount.trim() === "") {
      setQuoteValidation((prev) => ({
        ...prev,
        error: "Please enter an amount",
        isValid: false,
      }));
      return;
    }

    // Check if amount is numeric
    if (isNaN(amountNum)) {
      setQuoteValidation((prev) => ({
        ...prev,
        error: "Amount must be a valid number",
        isValid: false,
      }));
      return;
    }

    // Check minimum amount
    if (amountNum < MIN_TRANSACTION_AMOUNT_KES) {
      setQuoteValidation((prev) => ({
        ...prev,
        error: `Minimum amount is ${MIN_TRANSACTION_AMOUNT_KES} KES`,
        isValid: false,
      }));
      return;
    }

    // Need wallet address to fetch quote
    if (!account.address) {
      setQuoteValidation((prev) => ({
        ...prev,
        error: "Please connect your wallet",
        isValid: false,
      }));
      return;
    }

    // Fetch quote to get exact required amount
    try {
      setQuoteValidation((prev) => ({ ...prev, isValidating: true }));

      const quoteResponse = await fetchOrderQuote({
        amountFiat: amountNum,
        tokenAddress: selectedToken.tokenAddress,
        walletAddress: account.address,
        orderType: 1, // OffRamp
        currency: "KES",
      });

      if (quoteResponse.status === "success" && quoteResponse.data) {
        const quoteData = quoteResponse.data;
        const tokenConfig = getTokenConfig(selectedToken.tokenAddress);
        const decimals = tokenConfig?.decimals || 6;

        // Convert from raw units to standard units
        const requiredTokenAmount =
          quoteData.required_token_amount_raw / Math.pow(10, decimals);
        const currentBalance = quoteData.current_balance_raw
          ? quoteData.current_balance_raw / Math.pow(10, decimals)
          : selectedTokenBalance;

        const hasSufficientBalance =
          quoteData.has_sufficient_balance ??
          currentBalance >= requiredTokenAmount;

        console.log("💰 Quote validation:", {
          requiredTokenAmount,
          currentBalance,
          hasSufficientBalance,
          amountKES: amountNum,
        });

        if (!hasSufficientBalance) {
          setQuoteValidation({
            isValidating: false,
            isValid: false,
            error: `Insufficient balance. Required: ${requiredTokenAmount.toFixed(6)} ${selectedToken.symbol}, Available: ${currentBalance.toFixed(6)} ${selectedToken.symbol}`,
            requiredAmount: requiredTokenAmount,
            availableBalance: currentBalance,
            hasSufficientBalance: false,
          });
          return;
        }

        // All validations passed
        setQuoteValidation({
          isValidating: false,
          isValid: true,
          error: null,
          requiredAmount: requiredTokenAmount,
          availableBalance: currentBalance,
          hasSufficientBalance: true,
        });
      } else {
        throw new Error("Failed to get quote from API");
      }
    } catch (error: any) {
      console.error("Quote validation error:", error);
      setQuoteValidation({
        isValidating: false,
        isValid: false,
        error:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to validate amount. Please try again.",
        requiredAmount: null,
        availableBalance: null,
        hasSufficientBalance: null,
      });
    }
  }, [amount, selectedToken, account.address, selectedTokenBalance]);

  useEffect(() => {
    if (!mobileNumber) {
      setPhoneValidation({ isValid: false });
      return;
    }

    const timeoutId = setTimeout(() => {
      if (mobileNumber.length >= 12) {
        validatePhoneWithBackend(mobileNumber);
      } else {
        const validation = validateKenyanPhoneNumber(mobileNumber);
        setPhoneValidation(validation);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [mobileNumber]);

  // Validate amount with quote when amount changes (debounced)
  useEffect(() => {
    if (!amount || !account.address) {
      setQuoteValidation({
        isValidating: false,
        isValid: false,
        error: null,
        requiredAmount: null,
        availableBalance: null,
        hasSufficientBalance: null,
      });
      return;
    }

    const timeoutId = setTimeout(() => {
      validateAmountWithQuote();
    }, 800); // Debounce for 800ms

    return () => clearTimeout(timeoutId);
  }, [amount, selectedToken, account.address, validateAmountWithQuote]);

  // ✅ FIXED: Use dynamic fee structure instead of hardcoded 1% fee
  const transactionSummary = useMemo(() => {
    if (!exchangeRate) {
      return {
        kesAmount: 0,
        usdcAmount: 0,
        transactionCharge: 0,
        transactionChargeKES: 0,
        totalUSDC: 0,
        totalKES: 0,
        totalKESBalance: 0,
        walletBalance: 0,
        remainingBalance: 0,
        usdcBalance: 0,
        canAfford: false,
        maxSpendableFiat: 0,
      };
    }

    const kesAmount = Number.parseFloat(amount) || 0;

    // Use fee structure utility if fee bands are loaded
    if (feeBands.length > 0) {
      const costResult = getTotalCost({
        amountFiat: kesAmount,
        tokenBalance: selectedTokenBalance,
        exchangeRate,
        feeBands,
        orderType: "OffRamp",
      });

      console.log("[TRANSACTION SUMMARY] Using fee structure:", costResult);

      return {
        kesAmount,
        usdcAmount: kesAmount / exchangeRate,
        transactionCharge: costResult.totalTokenCost - kesAmount / exchangeRate,
        transactionChargeKES: costResult.feeAmountFiat,
        totalUSDC: costResult.totalTokenCost,
        totalKES: selectedTokenBalance * exchangeRate,
        totalKESBalance: costResult.remainingFiatValue,
        walletBalance: kesAmount,
        remainingBalance: costResult.remainingTokenBalance,
        usdcBalance: selectedTokenBalance,
        canAfford: costResult.canAfford,
        maxSpendableFiat: costResult.maxSpendableFiat,
      };
    }

    // Fallback to simple calculation if fee bands not loaded yet
    const usdcAmount = kesAmount / exchangeRate;
    const transactionCharge = 0;
    const totalUSDC = usdcAmount + transactionCharge;
    const remainingBalance = selectedTokenBalance - totalUSDC;
    const totalKES = selectedTokenBalance * exchangeRate;
    const totalKESBalance = totalKES - kesAmount;

    return {
      kesAmount,
      usdcAmount,
      transactionCharge,
      transactionChargeKES: 0,
      totalUSDC,
      totalKES,
      totalKESBalance: totalKESBalance,
      walletBalance: Number.parseFloat(amount) || 0,
      remainingBalance: Math.max(remainingBalance, 0),
      usdcBalance: selectedTokenBalance,
      canAfford: totalUSDC <= selectedTokenBalance,
      maxSpendableFiat: totalKES,
    };
  }, [amount, exchangeRate, selectedTokenBalance, feeBands]);

  const isFormValid = useCallback(() => {
    const cashoutType = getCashoutType();

    // Common validations
    if (!amount || Number.parseFloat(amount) < MIN_TRANSACTION_AMOUNT_KES)
      return false;
    if (quoteValidation.isValidating) return false; // Don't allow submission while validating
    if (!quoteValidation.isValid) return false; // Must pass quote validation
    if (transactionSummary.totalUSDC <= 0) return false;
    if (!transactionSummary.canAfford) return false; // ✅ ADDED: Balance check

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
  }, [
    getCashoutType,
    amount,
    quoteValidation.isValidating,
    quoteValidation.isValid,
    transactionSummary.totalUSDC,
    transactionSummary.canAfford,
    phoneValidation.isValid,
    isValidatingPhone,
    mobileNumber,
    paybillNumber,
    accountNumber,
    tillNumber,
  ]);

  useEffect(() => {
    if (isBrowser && exchangeRate && transactionSummary.totalUSDC && amount) {
      const cashoutType = getCashoutType();

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

  // Map chain names to their contract addresses from env
  const CONTRACT_ADDRESS_MAP: Record<string, string> = {
    Base: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BASE!,
    Lisk: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_LISK!,
    Scroll: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_SCROLL!,
    Arbitrum: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ARBITRUM!,
  };
  const contractAddress = CONTRACT_ADDRESS_MAP[selectedToken.chain];

  useContractEvents(
    contractAddress,
    (order: any) => {
      console.log("[CONTRACT EVENT] Order created event received:", order);
      setOrderId(order.orderId);
      console.log("[CONTRACT EVENT] Setting orderId to:", order.orderId);
    },
    (order: any) => {
      console.log("Order settled:", order);
      if (showProcessingPopup && order.orderId) {
        console.log("[CONTRACT EVENT] Order settled, updating popup state");
      }
    },
    (orderId: any) => {
      console.log("Order refunded:", orderId);
    },
  );

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

  // Helper to refresh transaction list after order completion
  const refreshTransactionList = useCallback(() => {
    if (typeof window !== "undefined") {
      console.log("🔄 Dispatching transaction refresh event");
      window.dispatchEvent(new CustomEvent("elementpay:refresh-transactions"));
    }
  }, []);

  const publicClient = usePublicClient();

  const { switchChainAsync } = useSwitchChain();
  const currentChainId = useChainId();

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
        return 8453;
    }
  };

  const approveTokenIfNeeded = async (spender: string, amount: string) => {
    try {
      setIsApproving(true);

      if (!writeContractAsync) {
        throw new Error(
          "Contract write function not available. Please refresh the page.",
        );
      }

      // For mobile wallets, show guidance toast
      if (isMobileWalletFlow) {
        toast.info("Please approve the token in your wallet app.", {
          autoClose: 15000,
        });
      }

      const approvalPromise = writeContractAsync({
        address: selectedToken.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [spender as `0x${string}`, parseUnits(amount, 6)],
      });

      // Longer timeout for mobile wallets
      const timeoutDuration = isMobileWalletFlow ? 180000 : 120000; // 3 min for mobile, 2 min for desktop
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                isMobileWalletFlow
                  ? "Approval request timed out. Please make sure your wallet app is open and try again."
                  : "Approval request timed out. Please check MetaMask and try again.",
              ),
            ),
          timeoutDuration,
        ),
      );

      const approveHash = await Promise.race([approvalPromise, timeoutPromise]);

      if (publicClient) {
        try {
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        } catch (receiptError: any) {
          console.warn(
            "Error waiting for receipt (transaction may still succeed):",
            receiptError,
          );
        }
      }

      return approveHash;
    } catch (err: any) {
      console.error("Token approval failed:", err);
      toast.error(err?.message || "Token approval failed");
      return null;
    } finally {
      setIsApproving(false);
    }
  };

  const pollOrderStatus = async (txHash: string) => {
    let attempts = 0;
    const maxAttempts = 30;
    const delay = 3000;
    console.log("🔄 Starting order status polling for:", txHash);

    while (attempts < maxAttempts) {
      try {
        const res = await fetch(
          `/api/element-pay/orders/status?txHash=${encodeURIComponent(txHash)}`,
        );
        const data = await res.json();
        console.log(
          `📋 Poll attempt ${
            attempts + 1
          }/${maxAttempts} - Order status response:`,
          data,
        );

        if (data?.data) {
          const orderData = data.data;
          console.log("📋 Order data found:", orderData);

          const isFinalState =
            orderData.status &&
            ["SETTLED", "FAILED", "SETTLED_UNVERIFIED", "COMPLETED"].includes(
              orderData.status,
            );

          const hasReceiptNumber = !!(
            orderData.receipt_number ||
            orderData.mpesa_receipt_number ||
            orderData.file_id
          );
          const hasTransactionHash = !!(
            orderData.transaction_hashes?.settlement ||
            orderData.transaction_hashes?.creation
          );

          console.log("📋 Status check:", {
            status: orderData.status,
            isFinalState,
            hasReceiptNumber,
            hasTransactionHash,
            receiptNumber: orderData.receipt_number,
            mpesaReceiptNumber: orderData.mpesa_receipt_number,
            fileId: orderData.file_id,
          });

          if (
            isFinalState ||
            (attempts > 10 && (hasReceiptNumber || hasTransactionHash))
          ) {
            console.log("✅ Final order status received:", orderData);

            let normalizedStatus = "SETTLED";

            if (
              orderData.status === "FAILED" ||
              orderData.status === "REJECTED" ||
              orderData.status === "CANCELLED"
            ) {
              normalizedStatus = "FAILED";
            } else if (
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
              hasTransactionHash,
            });

            return {
              ...orderData,
              status: normalizedStatus,
              transaction_hash:
                orderData.transaction_hashes?.settlement ||
                orderData.transaction_hashes?.creation ||
                txHash,
              receipt_number:
                orderData.mpesa_receipt_number ||
                orderData.receipt_number ||
                orderData.file_id ||
                "",
              receiver_name: orderData.receiver_name || "",
              mpesa_receipt_number: orderData.mpesa_receipt_number || "",
              created_at: orderData.created_at || new Date().toISOString(),
              amount_fiat: orderData.amount_fiat,
            };
          }
        }
      } catch (e) {
        console.log(`⚠️ Poll attempt ${attempts + 1} failed:`, e);
      }
      await new Promise((r) => setTimeout(r, delay));
      attempts++;
    }
    console.log(
      "❌ Order status polling timed out after",
      maxAttempts,
      "attempts",
    );
    return null;
  };

  const executeOfframpOrder = async () => {
    const targetChainId = getTargetChainId();

    if (currentChainId !== targetChainId) {
      console.log(
        `🔄 Network switch needed: ${currentChainId} -> ${targetChainId} (${selectedToken.chain})`,
      );
      console.log(
        `📱 Mobile wallet flow: ${isMobileWalletFlow}, Device: ${isMobileDevice}, WalletConnect: ${isWalletConnect}`,
      );

      const isSmartWalletConnected = isSmartWallet(connector);

      if (isSmartWalletConnected) {
        console.log(
          `📱 Smart wallet detected (${connector?.name}), proceeding without chain switch`,
        );
        toast.info(
          `Smart wallet detected. Proceeding with ${selectedToken.chain} transaction.`,
        );
      } else {
        // For mobile wallets, show guidance before switching
        if (isMobileWalletFlow) {
          toast.info(
            `Switching to ${selectedToken.chain}. Please approve in your wallet app.`,
            { autoClose: 5000 },
          );
        }

        showNetworkSwitchNotification(selectedToken.chain, "switching");

        try {
          const switchResult = await safeChainSwitch({
            connector,
            currentChainId,
            targetChainId,
            switchChainAsyncFn: switchChainAsync,
            chainName: selectedToken.chain,
          });

          if (switchResult.success) {
            if (switchResult.method === "switched") {
              // Wait longer for mobile wallets to complete the switch
              const waitTime = isMobileWalletFlow ? 3000 : 1000;
              await new Promise((resolve) => setTimeout(resolve, waitTime));
              showNetworkSwitchNotification(selectedToken.chain, "success");
              console.log(`✅ ${switchResult.message}`);

              // ✅ CRITICAL FIX: For desktop, show toast and return (existing behavior)
              // For mobile, continue with the transaction flow
              if (!isMobileWalletFlow) {
                toast.success(
                  `Switched to ${selectedToken.chain}. Please try again.`,
                );
                return;
              }
              // Mobile: Continue with transaction - don't return
              console.log(
                "📱 Mobile wallet: Continuing transaction after network switch",
              );
            } else if (switchResult.method === "manual-required") {
              showNetworkSwitchNotification(selectedToken.chain, "error");
              toast.warning(switchResult.message);
              return;
            }
            // For 'skipped' or 'already-on-chain', continue with transaction
          } else {
            showNetworkSwitchNotification(selectedToken.chain, "error");
            toast.error(switchResult.message);
            return;
          }
        } catch (err) {
          console.error("❌ Network switch failed:", err);
          showNetworkSwitchNotification(selectedToken.chain, "error");
          toast.error(`Please switch to ${selectedToken.chain} to continue.`);
          return;
        }
      }
    }

    try {
      setIsApproving(true);

      // ✅ FIXED: Validate balance before proceeding
      if (!transactionSummary.canAfford) {
        toast.error(
          `Insufficient balance. You need ${transactionSummary.totalUSDC.toFixed(6)} ${selectedToken.symbol} but only have ${selectedTokenBalance.toFixed(6)} ${selectedToken.symbol}`,
        );
        setIsApproving(false);
        setIsProcessing(false);
        return;
      }

      const cashoutType = getCashoutType();
      let validationError = "";

      if (
        !account.address ||
        !selectedToken.tokenAddress ||
        !amount ||
        !messageHash
      ) {
        validationError =
          "Missing required order details. Please fill all fields and connect your wallet.";
      } else if (cashoutType === "PHONE" && !mobileNumber) {
        validationError = "Phone number is required for Send Money.";
      } else if (
        cashoutType === "PAYBILL" &&
        (!paybillNumber || !accountNumber)
      ) {
        validationError =
          "Business number and account number are required for Pay Bill.";
      } else if (cashoutType === "TILL" && !tillNumber) {
        validationError = "Till number is required for Buy Goods.";
      }

      if (validationError) {
        console.error("Missing required order details:", {
          user_address: account.address,
          token: selectedToken.tokenAddress,
          amount,
          mobileNumber,
          messageHash,
          cashoutType,
          paybillNumber,
          accountNumber,
          tillNumber,
          error: validationError,
        });
        toast.error(validationError);
        setIsApproving(false);
        setIsProcessing(false);
        return;
      }

      // Show processing popup - earlier for mobile to give visual feedback
      setShowProcessingPopup(true);

      // For mobile wallets, show guidance
      if (isMobileWalletFlow) {
        toast.info("Please check your wallet app to approve the transaction.", {
          autoClose: 10000,
        });
      }

      const initialReceiptData = {
        amount: amount,
        amountUSDC: transactionSummary.usdcAmount,
        phoneNumber:
          getCashoutType() === "PHONE"
            ? mobileNumber
            : getCashoutType() === "PAYBILL"
              ? `${paybillNumber} - ${accountNumber}`
              : tillNumber,
        address: account.address || "",
        transactionHash: "",
        status: 0,
      };

      console.log("📋 Initial transaction receipt data:", initialReceiptData);
      setTransactionReciept((prev) => ({
        ...prev,
        ...initialReceiptData,
      }));

      let requiredApprovalAmount: string;
      let hasSufficientAllowance = false;

      const walletAddress = account.address;
      if (!walletAddress) {
        toast.error("Wallet address not found. Please connect your wallet.");
        setIsApproving(false);
        setIsProcessing(false);
        return;
      }

      try {
        const quoteResponse = await fetchOrderQuote({
          amountFiat: Number(amount),
          tokenAddress: selectedToken.tokenAddress,
          walletAddress: walletAddress,
          orderType: 1,
          currency: "KES",
        });

        if (quoteResponse.status === "success" && quoteResponse.data) {
          const quoteData = quoteResponse.data;
          const tokenConfig = getTokenConfig(selectedToken.tokenAddress);
          const decimals = tokenConfig?.decimals || 6;
          requiredApprovalAmount = (
            quoteData.required_token_amount_raw / Math.pow(10, decimals)
          ).toFixed(decimals);
          hasSufficientAllowance = quoteData.has_sufficient_allowance ?? false;
        } else {
          throw new Error("Failed to get quote from API");
        }
      } catch (quoteError: any) {
        console.error("Failed to fetch order quote:", quoteError);
        setShowProcessingPopup(false);
        setIsApproving(false);
        setIsProcessing(false);
        toast.error(
          quoteError?.response?.data?.message ||
            quoteError?.message ||
            "Failed to calculate required approval amount. Please try again.",
        );
        return;
      }

      const spender = contractAddress;
      const tokenConfig = getTokenConfig(selectedToken.tokenAddress);
      const decimals = tokenConfig?.decimals || 6;

      if (!hasSufficientAllowance) {
        // For mobile wallets, show additional guidance
        if (isMobileWalletFlow) {
          toast.info("Approval needed. Please approve in your wallet app.", {
            autoClose: 15000,
          });
        }

        const approveTxHash = await approveTokenIfNeeded(
          spender,
          requiredApprovalAmount,
        );

        if (!approveTxHash) {
          setShowProcessingPopup(false);
          setIsApproving(false);
          setIsProcessing(false);
          toast.error(
            "Token approval failed. Cannot proceed with order creation.",
          );
          return;
        }

        // Wait a bit after approval for mobile wallets
        if (isMobileWalletFlow) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          toast.info("Approval successful! Now signing the transaction...", {
            autoClose: 10000,
          });
        }
      }

      if (!messageHash) {
        console.error(
          "Message hash is missing! Cannot proceed with order creation.",
        );
        setShowProcessingPopup(false);
        setIsApproving(false);
        setIsProcessing(false);
        toast.error("Order details are incomplete. Please try again.");
        return;
      }

      let apiResponse;
      try {
       
        apiResponse = await Promise.race([
          createOffRampOrder({
            userAddress: account.address as string,
            tokenAddress: selectedToken.tokenAddress,
            amount: Number(amount),
            amountFiat: Number(amount),
            phoneNumber: getCashoutType() === "PHONE" ? mobileNumber : "",
            messageHash: messageHash,
            reason: reason || "", // ✅ TASK 2: Custom reason included
            cashoutType: getCashoutType(),
            paybillNumber: getCashoutType() === "PAYBILL" ? paybillNumber : "",
            accountNumber: getCashoutType() === "PAYBILL" ? accountNumber : "",
            tillNumber: getCashoutType() === "TILL" ? tillNumber : "",
          }),
          new Promise((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    "API request timed out after 45 seconds. The Element Pay service may be experiencing high load. Please try again in a few moments or contact support if the issue persists.",
                  ),
                ),
              45000,
            ),
          ),
        ]);
        
    
      } catch (apiError) {
        console.error("❌ Offramp API call failed:", apiError);
        setShowProcessingPopup(false);

        const errorMessage =
          (apiError as any)?.message ||
          "Payment processing failed. Please try again.";
        if (errorMessage.includes("timed out")) {
          toast.error(
            "The payment is taking longer than expected. Please check your transaction history in a few minutes or contact support if needed.",
          );
        } else {
          toast.error(errorMessage);
        }

        setIsApproving(false);
        setIsProcessing(false);
        return;
      }

      console.log("📥 [API] Full response received:", apiResponse);

      // Extract order ID from response (tx_hash is the order ID)
      const orderId = (apiResponse as any)?.data?.tx_hash || "";

      console.log("🎫 [ORDER] Extracted order ID:", orderId);

      if (!orderId) {
        console.error("❌ [ORDER] No tx_hash in response data!");
        console.error("❌ [ORDER] Response structure:", JSON.stringify(apiResponse, null, 2));
        toast.error("Order created but no transaction hash returned. Please check your transaction history.");
        setShowProcessingPopup(false);
        setIsApproving(false);
        setIsProcessing(false);
        return;
      }
      setOrderId(orderId);

      setTransactionReciept((prev) => ({
        ...prev,
        transactionHash: orderId,
      }));

      const statusData = await pollOrderStatus(orderId);
      if (statusData) {
        const isSettled = statusData.status === "SETTLED";
        const isFailed = statusData.status === "FAILED";

        setFinalTransactionData(statusData);
        setIsPollingComplete(true);

        const finalReceiptData = {
          status: isSettled ? 1 : isFailed ? 2 : 0,
          transactionHash: statusData.transaction_hash || orderId,
        };

        console.log("📋 Final transaction receipt data:", finalReceiptData);
        setTransactionReciept((prev) => ({
          ...prev,
          ...finalReceiptData,
        }));

        // Refresh transaction list after completion
        refreshTransactionList();

        if (isSettled) {
          toast.success(
            `Payment completed! ${
              statusData.mpesa_receipt_number
                ? `M-Pesa Receipt: ${statusData.mpesa_receipt_number}`
                : ""
            }`,
          );
        } else if (isFailed) {
          toast.error(
            `Payment failed: ${
              statusData.failure_reason ||
              "Transaction was not completed successfully"
            }`,
          );
        }
      } else {
        console.log("⏰ Order status polling timed out");
        setIsPollingComplete(true);
        setTransactionReciept((prev) => ({
          ...prev,
          status: 2,
        }));
        // Refresh transaction list even on timeout (order may have been created)
        refreshTransactionList();
        toast.error(
          "Payment is taking longer than expected. Please check your transaction history or contact support.",
        );
      }
    } catch (err: any) {
      console.error("❌ Transaction process failed:", err);
      setShowProcessingPopup(false);
      // Refresh transaction list on error as well (partial state may exist)
      refreshTransactionList();
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
    if (Number.parseFloat(amount) < MIN_TRANSACTION_AMOUNT_KES) {
      toast.error(
        `Minimum transaction amount is ${MIN_TRANSACTION_AMOUNT_KES} KES`,
      );
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

    if (cashout_type === "PHONE") {
      if (!phoneValidation.isValid) {
        if (phoneValidation.error) {
          toast.error(phoneValidation.error);
        } else {
          toast.error("Please enter a valid phone number");
        }
        return;
      }

      if (!phoneValidation.isValid) {
        const isPhoneValid = await validatePhoneWithBackend(mobileNumber);
        if (!isPhoneValid) {
          toast.error(
            "Phone number validation failed. Please check and try again.",
          );
          return;
        }
      }
    }

    if (cashout_type === "TILL") {
      if (!tillNumber) {
        toast.error("Please enter a till number");
        return;
      }
      await executeOfframpOrder();
      return;
    }

    if (cashout_type === "PAYBILL") {
      if (!paybillNumber || !accountNumber) {
        toast.error("Please enter both business number and account number");
        return;
      }
      await validateAccount();
      console.log("📋 PayBill validation complete, setting up modal");
      setProceedAfterValidation(() => () => {
        console.log("📋 Proceed button clicked, executing offramp order");
        executeOfframpOrder();
      });

      setIsMainDialogOpen(false);

      setTimeout(() => {
        setShowValidationModal(true);
        setModalMode("confirm");
      }, 100);
      return;
    }

    await executeOfframpOrder();
  };

  const [transactionReciept, setTransactionReciept] =
    useState<TransactionReceipt>({
      amount: "0.00",
      amountUSDC: 0,
      phoneNumber: "",
      address: "",
      status: 0,
      transactionHash: "",
    });

  useEffect(() => {
    if (isBrowser) {
      const cashoutType = getCashoutType();
      let recipientInfo = "";

      switch (cashoutType) {
        case "PHONE":
          recipientInfo = mobileNumber || "";
          break;
        case "PAYBILL":
          recipientInfo =
            paybillNumber && accountNumber
              ? `${paybillNumber} - ${accountNumber}`
              : "";
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
  }, [
    isBrowser,
    amount,
    transactionSummary.usdcAmount,
    mobileNumber,
    paybillNumber,
    accountNumber,
    tillNumber,
    getCashoutType,
    account.address,
  ]);

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
                selectedTokenBalance={selectedTokenBalance}
                exchangeRate={exchangeRate}
                account={account}
                handleMaxAmountSet={handleMaxAmountSet}
                transactionChargeKES={transactionSummary.transactionChargeKES}
                feeBands={feeBands}
              />

              {/* Mobile Confirm Button - Only shown on small screens */}
              <div className="block lg:hidden pt-4">
                <button
                  onClick={
                    Number.parseFloat(amount) >= MIN_TRANSACTION_AMOUNT_KES
                      ? handleApproveToken
                      : undefined
                  }
                  disabled={
                    isApproving ||
                    !isFormValid() ||
                    quoteValidation.isValidating
                  }
                  type="button"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {quoteValidation.isValidating
                    ? "Validating amount..."
                    : isApproving
                      ? "Approving..."
                      : isValidatingPhone
                        ? "Validating..."
                        : "Confirm Payment"}
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
                    <span className="text-gray-600 text-sm">
                      Wallet balance
                    </span>
                    <span className="text-green-600 font-medium text-sm">
                      {selectedToken.symbol}{" "}
                      {transactionSummary.usdcBalance.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">
                      Amount to send
                    </span>
                    <span className="text-gray-900 font-medium">
                      KE {transactionSummary.kesAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">
                      Transaction fee
                    </span>
                    <span className="text-orange-600 text-sm">
                      KE {transactionSummary.transactionChargeKES.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center font-semibold">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-gray-900">
                      KE {transactionSummary.kesAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
                {quoteValidation.error && !quoteValidation.isValidating && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">
                      ⚠️ {quoteValidation.error}
                    </p>
                  </div>
                )}

                {quoteValidation.isValidating && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Validating amount...
                    </p>
                  </div>
                )}

                {/* Desktop Confirm Button */}
                <div className="hidden lg:block mb-4">
                  <button
                    onClick={handleApproveToken}
                    disabled={
                      isApproving ||
                      !isFormValid() ||
                      Number.parseFloat(amount) < MIN_TRANSACTION_AMOUNT_KES
                    }
                    type="button"
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
                  >
                    {isApproving
                      ? "Approving..."
                      : isValidatingPhone
                        ? "Validating..."
                        : "Confirm Payment"}
                  </button>
                </div>

                {/* Balance after transaction */}
                <div className="bg-white border border-gray-200 p-3 rounded-lg">
                  <div className="text-gray-600 mb-2 text-xs font-medium uppercase tracking-wider">
                    Balance After Transaction
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">
                        Remaining KES
                      </span>
                      <span className="text-gray-900 font-medium text-sm">
                        KE {transactionSummary.totalKESBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">
                        USDC Balance
                      </span>
                      <span className="text-gray-900 font-medium text-sm">
                        {transactionSummary.remainingBalance.toFixed(6)}
                      </span>
                    </div>
                  </div>
                </div>
                {quoteValidation.requiredAmount &&
                  quoteValidation.availableBalance && (
                    <div className="bg-white border border-gray-200 p-3 rounded-lg mt-3">
                      <div className="text-gray-600 mb-2 text-xs font-medium uppercase tracking-wider">
                        Balance Check
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">
                            Required
                          </span>
                          <span className="text-gray-900 font-medium text-sm">
                            {quoteValidation.requiredAmount.toFixed(6)}{" "}
                            {selectedToken.symbol}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">
                            Available
                          </span>
                          <span
                            className={`font-medium text-sm ${
                              quoteValidation.hasSufficientBalance
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {quoteValidation.availableBalance.toFixed(6)}{" "}
                            {selectedToken.symbol}
                          </span>
                        </div>
                        {quoteValidation.hasSufficientBalance && (
                          <div className="flex items-center gap-1 text-green-600 text-xs mt-1">
                            <span>✓</span>
                            <span>Sufficient balance</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </DialogContent>

        <NetworkSwitchNotification
          isVisible={networkSwitchNotification.isVisible}
          networkName={networkSwitchNotification.networkName}
          status={networkSwitchNotification.status}
          onClose={hideNetworkSwitchNotification}
        />
      </Dialog>

      <ConfirmationModal
        isOpen={showValidationModal}
        onClose={() => {
          setShowValidationModal(false);
          setTimeout(() => {
            setIsMainDialogOpen(true);
          }, 100);
        }}
        onConfirm={() => {
          proceedAfterValidation();
          setShowValidationModal(false);
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
            console.log(
              "[POPUP CLOSE] Processing popup closing, orderId was:",
              orderId,
            );
            cleanupOrderStates();
          }}
          orderId={orderId}
          disableInternalPolling={true}
          transactionDetails={{
            amount:
              finalTransactionData?.amount_fiat?.toString() ||
              transactionReciept.amount ||
              amount,
            currency: "KES",
            tokenSymbol: selectedToken.symbol,
            tokenAmount: transactionSummary.usdcAmount.toFixed(6),
            network: selectedToken.chain,
            recipient:
              finalTransactionData?.receiver_name ||
              (() => {
                const cashoutType = getCashoutType();
                switch (cashoutType) {
                  case "PHONE":
                    return mobileNumber
                      ? formatReceiverName(mobileNumber)
                      : "Mobile Money Recipient";
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
            transactionHash:
              finalTransactionData?.transaction_hash ||
              transactionReciept.transactionHash ||
              orderId ||
              "",
            date: finalTransactionData?.created_at || new Date().toISOString(),
            receiptNumber:
              finalTransactionData?.mpesa_receipt_number ||
              finalTransactionData?.receipt_number ||
              finalTransactionData?.file_id ||
              "",
            mpesa_receipt_number:
              finalTransactionData?.mpesa_receipt_number || "",
            paymentStatus:
              transactionReciept.status === 1
                ? "Settled"
                : transactionReciept.status === 2
                  ? "Failed"
                  : "Processing",
            status: transactionReciept.status,
            orderId: orderId,
          }}
        />
      )}
    </>
  );
};

export default SendCryptoModal;
