"use client";

import type React from "react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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

import { encryptMessageDetailed } from "@/services/encryption";
import ConfirmationModal from "./ConfirmationModal";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import {
  validateKenyanPhoneNumber,
  validatePhoneWithAPI,
} from "@/utils/phoneValidation";

import { fetchOrderQuote } from "@/app/api/aggregator";
import { extractKYCLimitSnapshot } from "@/services/kycError";
import { useKYCModalStore } from "@/stores/kycModalStore";
import { ethers } from "ethers";
import { SUPPORTED_TOKENS } from "@/constants/supportedTokens";
import { getTokenConfig } from "@/constants/tokenConfig";
import { useOnboardingStore } from "@/stores/onboardingStore";
import {
  FeeBand,
  fetchFeeStructureCached,
  getTotalCost,
  getApiCurrencyFromToken,
  DEFAULT_FEE_BANDS,
  MIN_TRANSACTION_AMOUNT_KES,
} from "@/utils/feeStructure";
import { useSelectedToken } from "@/context/TokenContext";
import {
  executeOfframpOrder as executeOfframpOrderFlow,
  getOfframpContractAddress,
  mapOffRampMethodToPaymentMethod,
} from "@/utils/offrampExecution";

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
  // Use shared token context for consistent token selection across modals
  const { selectedToken, setSelectedToken, selectTokenAndSwitchChain, isSwitchingChain } = useSelectedToken();
  const landingFlow = useOnboardingStore((s) => s.flow);
  const landingOffRampMethod = useOnboardingStore((s) => s.offRampMethod);
  const landingAmount = useOnboardingStore((s) => s.amount);
  const landingPhoneNumber = useOnboardingStore((s) => s.phoneNumber);
  const landingPaybillNumber = useOnboardingStore((s) => s.paybillNumber);
  const landingAccountNumber = useOnboardingStore((s) => s.accountNumber);
  const landingTillNumber = useOnboardingStore((s) => s.tillNumber);
  const landingTokenSymbol = useOnboardingStore((s) => s.tokenSymbol);
  const initiatedFromLanding = useOnboardingStore((s) => s.initiatedFromLanding);
  const setInitiatedFromLanding = useOnboardingStore((s) => s.setInitiatedFromLanding);
  const landingPrefillAppliedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [amount, setAmount] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [reason, setReason] = useState(""); // Optional reason for payment
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<
    "Send Money" | "Pay Bill" | "Buy Goods" | undefined
  >(undefined);
  const [isApproving, setIsApproving] = useState(false);
  const [, setIsProcessing] = useState(false);

  const { 
    balance: selectedTokenBalance, 
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
    isCorrectNetwork,
  } = useTokenBalance({
    token: selectedToken,
  });

  // Refetch balance when token changes or when we switch to the correct network
  useEffect(() => {
    if (isCorrectNetwork && selectedToken) {
      console.log(`[BALANCE] Refetching balance for ${selectedToken.symbol} on ${selectedToken.chain}`);
      refetchBalance();
    }
  }, [selectedToken, isCorrectNetwork, refetchBalance]);

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

  const [isBrowser, setIsBrowser] = useState(false);

  const [paybillNumber, setPaybillNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [tillNumber, setTillNumber] = useState("");

  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validatedAccountInfo, setValidatedAccountInfo] = useState("");
  const [proceedAfterValidation, setProceedAfterValidation] = useState<() => void>(() => () => {});
  const [modalMode, setModalMode] = useState<"confirm" | "error">("confirm");
  const [isMainDialogOpen, setIsMainDialogOpen] = useState(false);

  const [cashoutType, setCashoutType] = useState<"PHONE" | "PAYBILL" | "TILL">("PHONE");

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
      Boolean(connector?.name?.toLowerCase().includes("walletconnect"))
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
    return cashoutType;
  }, [cashoutType]);

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

  useEffect(() => {
    if (!isBrowser) return;
    if (landingPrefillAppliedRef.current) return;
    if (!initiatedFromLanding || landingFlow !== "offramp") return;

    landingPrefillAppliedRef.current = true;

    if (landingAmount) setAmount(landingAmount);
    if (landingPhoneNumber) {
      // PreviewForm stores only the local 9-digit part (e.g. "712345678").
      // Normalize to "254XXXXXXXXX" (12 chars) so the length >= 12 branch
      // in the phone-validation effect triggers backend validation.
      const normalized = /^\d{9}$/.test(landingPhoneNumber)
        ? `254${landingPhoneNumber}`
        : landingPhoneNumber;
      setMobileNumber(normalized);
    }
    if (landingPaybillNumber) setPaybillNumber(landingPaybillNumber);
    if (landingAccountNumber) setAccountNumber(landingAccountNumber);
    if (landingTillNumber) setTillNumber(landingTillNumber);

    setInitialPaymentMethod(mapOffRampMethodToPaymentMethod(landingOffRampMethod));

    if (landingTokenSymbol) {
      const matchedToken = SUPPORTED_TOKENS.find(
        (token) => token.symbol === landingTokenSymbol,
      );
      if (matchedToken) {
        setSelectedToken(matchedToken);
      }
    }

    setIsMainDialogOpen(true);
    setInitiatedFromLanding(false);
  }, [
    isBrowser,
    initiatedFromLanding,
    landingFlow,
    landingAmount,
    landingPhoneNumber,
    landingPaybillNumber,
    landingAccountNumber,
    landingTillNumber,
    landingTokenSymbol,
    landingOffRampMethod,
    setSelectedToken,
    setInitiatedFromLanding,
  ]);

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
  }, [isBrowser, selectedToken.symbol]);

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
  // Uses local validation first for instant feedback, then confirms with API
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

    const amountNum = Number.parseFloat(amount);
    
    // Instant local validation for obvious errors
    if (isNaN(amountNum) || amountNum < MIN_TRANSACTION_AMOUNT_KES) {
      setQuoteValidation({
        isValidating: false,
        isValid: false,
        error: amountNum < MIN_TRANSACTION_AMOUNT_KES 
          ? `Minimum amount is ${MIN_TRANSACTION_AMOUNT_KES} KES` 
          : "Amount must be a valid number",
        requiredAmount: null,
        availableBalance: null,
        hasSufficientBalance: null,
      });
      return;
    }

    // Quick local balance check using exchange rate (if available)
    // This provides instant feedback while API call is in progress
    if (exchangeRate && selectedTokenBalance > 0) {
      const estimatedTokenAmount = amountNum / exchangeRate;
      if (estimatedTokenAmount > selectedTokenBalance * 1.01) { // 1% buffer for fees
        setQuoteValidation({
          isValidating: false,
          isValid: false,
          error: `Insufficient balance. Estimated: ${estimatedTokenAmount.toFixed(6)} ${selectedToken.symbol}, Available: ${selectedTokenBalance.toFixed(6)} ${selectedToken.symbol}`,
          requiredAmount: estimatedTokenAmount,
          availableBalance: selectedTokenBalance,
          hasSufficientBalance: false,
        });
        return;
      }
    }

    // Debounce API call for final validation
    const timeoutId = setTimeout(() => {
      validateAmountWithQuote();
    }, 500); // Reduced from 800ms to 500ms since we have caching now

    return () => clearTimeout(timeoutId);
  }, [amount, selectedToken, account.address, validateAmountWithQuote, exchangeRate, selectedTokenBalance]);

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
    if (isBalanceLoading) return false; // Don't allow submission while balance is loading
    if (!isCorrectNetwork) return false; // Must be on correct network
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
    isBalanceLoading,
    isCorrectNetwork,
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

  // Synchronous messageHash computation — eliminates the race condition where
  // useEffect would recompute asynchronously after render, allowing a stale hash
  // to be submitted if the user clicks "Confirm" before the effect runs.
  const messageHash = useMemo(() => {
    if (!isBrowser || !exchangeRate || !amount) return "";

    const currentCashoutType = getCashoutType();

    let hasRequiredFields = false;
    switch (currentCashoutType) {
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

    if (!hasRequiredFields) return "";

    try {
      return encryptMessageDetailed({
        cashout_type: currentCashoutType,
        amount_fiat: Number.parseFloat(amount),
        currency: "KES",
        rate: exchangeRate ?? 0,
        phone_number: currentCashoutType === "PHONE" ? mobileNumber : "",
        paybill_number: currentCashoutType === "PAYBILL" ? paybillNumber : "",
        account_number: currentCashoutType === "PAYBILL" ? accountNumber : "",
        till_number: currentCashoutType === "TILL" ? tillNumber : "",
      });
    } catch (error) {
      console.error("Error encrypting message:", error);
      return "";
    }
  }, [
    isBrowser,
    mobileNumber,
    exchangeRate,
    amount,
    getCashoutType,
    paybillNumber,
    accountNumber,
    tillNumber,
  ]);

  const contractAddress = getOfframpContractAddress(selectedToken.chain);

  const cleanupOrderStates = useCallback(() => {
    // Abort any in-flight offramp execution so its background polling
    // does not write stale data into the next transaction's state.
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

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

  // Reset quote validation when token changes (chain sync is handled by TokenContext)
  useEffect(() => {
    setQuoteValidation({
      isValidating: false,
      isValid: false,
      error: null,
      requiredAmount: null,
      availableBalance: null,
      hasSufficientBalance: null,
    });
  }, [selectedToken]);

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

  const executeOfframpOrder = async () => {
    // Abort any previous in-flight execution before starting a new one
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    await executeOfframpOrderFlow({
      selectedToken,
      currentChainId: currentChainId ?? 0,
      connector,
      switchChainAsync,
      isMobileWalletFlow,
      accountAddress: account.address,
      amountFiat: amount,
      messageHash,
      reason,
      mobileNumber,
      paybillNumber,
      accountNumber,
      tillNumber,
      contractAddress,
      transactionSummary,
      selectedTokenBalance,
      cashoutType: getCashoutType(),
      approveTokenIfNeeded,
      setApproving: setIsApproving,
      setProcessing: setIsProcessing,
      setShowProcessingPopup,
      setOrderId,
      setFinalTransactionData,
      setPollingComplete: setIsPollingComplete,
      setTransactionReceipt: setTransactionReciept,
      refreshTransactionList,
      signal: controller.signal,
      notify: {
        info: toast.info,
        success: toast.success,
        warning: toast.warning,
        error: toast.error,
      },
      onKycRequired: (apiError) => {
        setIsMainDialogOpen(false);
        useKYCModalStore
          .getState()
          .openKYCModal(extractKYCLimitSnapshot(apiError.details));
      },
      // Reset stale state on early exit (cancel, failure, validation error)
      // so the next attempt uses fresh data.
      onEarlyExit: () => {
        cleanupOrderStates();
        // Force quote re-validation on next attempt
        setQuoteValidation({
          isValidating: false,
          isValid: false,
          error: null,
          requiredAmount: null,
          availableBalance: null,
          hasSufficientBalance: null,
        });
      },
      showNetworkSwitchNotification,
    });
  };

  // Ref always holds the latest executeOfframpOrder so that deferred callbacks
  // (e.g. PayBill confirmation modal) never call a stale closure.
  const executeOfframpOrderRef = useRef(executeOfframpOrder);
  executeOfframpOrderRef.current = executeOfframpOrder;

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
        // Use the ref to always call the latest version with fresh state
        executeOfframpOrderRef.current();
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

  console.log(
    "🔍 Form validation state:",
    {
      isApproving,
      isFormValid: isFormValid(),
      quoteValidation: quoteValidation.isValidating,
    }
  );

  return (
    <>
      <Dialog open={isMainDialogOpen} onOpenChange={setIsMainDialogOpen}>
        <DialogTrigger
          className="flex items-center gap-2 bg-[var(--ep-accent)] text-white text-sm font-medium py-3 px-5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 shadow-[0_2px_8px_rgba(67,57,202,0.25)]"
          onClick={() => setIsMainDialogOpen(true)}
        >
          <ArrowUpRight size={24} />
          Spend Crypto
        </DialogTrigger>
        <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-[var(--ep-bg-card)] border-[var(--ep-border)]">
          <DialogHeader className="pb-2 sm:pb-4">
            <DialogTitle className="text-lg sm:text-xl text-[var(--ep-heading)]">
              Spend Crypto
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Column - Payment Form */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              <div>
                <h3 className="text-base sm:text-lg font-medium text-[var(--ep-heading)] mb-2 sm:mb-4">
                  Pay to Mobile Money
                </h3>
              </div>
              <PayToMobileMoney
                selectedToken={selectedToken}
                setSelectedToken={selectTokenAndSwitchChain}
                isSwitchingChain={isSwitchingChain}
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
                initialPaymentMethod={initialPaymentMethod}
              />

              {/* Mobile Confirm Button - Only shown on small screens */}
              <div className="block lg:hidden pt-2 sm:pt-4 sticky bottom-0 bg-[var(--ep-bg-card)] pb-2">
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
                  className="w-full py-3.5 sm:py-3 bg-[var(--ep-accent)] text-white rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-base sm:text-sm shadow-[0_2px_8px_rgba(67,57,202,0.25)]"
                >
                  {isBalanceLoading
                    ? "Loading balance..."
                    : !isCorrectNetwork
                      ? `Switch to ${selectedToken.chain}`
                      : quoteValidation.isValidating
                        ? "Validating..."
                        : isApproving
                          ? "Approving..."
                          : isValidatingPhone
                            ? "Validating..."
                            : "Confirm Payment"}
                </button>
              </div>
            </div>

            {/* Right Column - Transaction Summary */}
            <div className="lg:col-span-1 order-last">
              <div className="bg-[var(--ep-accent-subtle)] p-3 sm:p-4 rounded-xl h-fit lg:sticky lg:top-4 border border-[var(--ep-border)]">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-[var(--ep-heading)]">
                  Transaction Summary
                </h3>

                {/* Network mismatch warning */}
                {!isCorrectNetwork && (
                  <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-yellow-700 font-medium">
                      ⚠️ Please switch to {selectedToken.chain} network in your wallet
                    </p>
                  </div>
                )}

                {/* Main Summary */}
                <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--ep-muted)] text-sm">
                      Wallet balance
                    </span>
                    <span className="text-[var(--ep-accent)] font-medium text-sm">
                      {isBalanceLoading ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : (
                        <>
                          {selectedToken.symbol}{" "}
                          {transactionSummary.usdcBalance.toFixed(6)}
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--ep-muted)] text-sm">
                      Amount to send
                    </span>
                    <span className="text-[var(--ep-heading)] font-medium">
                      KE {transactionSummary.kesAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--ep-muted)] text-sm">
                      Transaction fee
                    </span>
                    <span className="text-[var(--ep-accent)] text-sm">
                      KE {transactionSummary.transactionChargeKES.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-[var(--ep-border)] pt-3 flex justify-between items-center font-semibold">
                    <span className="text-[var(--ep-heading)]">Total:</span>
                    <span className="text-[var(--ep-heading)]">
                      KE {transactionSummary.kesAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
                {quoteValidation.error && !quoteValidation.isValidating && (
                  <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-red-600 font-medium break-words">
                      ⚠️ {quoteValidation.error}
                    </p>
                  </div>
                )}

                {quoteValidation.isValidating && (
                  <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-[var(--ep-accent-muted)] border border-[var(--ep-accent)]/20 rounded-lg">
                    <p className="text-xs sm:text-sm text-[var(--ep-accent)] font-medium flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Validating...
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
                    className="w-full py-3 bg-[var(--ep-accent)] text-white rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-sm shadow-[0_2px_8px_rgba(67,57,202,0.25)]"
                  >
                    {isBalanceLoading
                      ? "Loading balance..."
                      : !isCorrectNetwork
                        ? `Switch to ${selectedToken.chain}`
                        : quoteValidation.isValidating
                          ? "Validating..."
                          : isApproving
                            ? "Approving..."
                            : isValidatingPhone
                              ? "Validating..."
                              : "Confirm Payment"}
                  </button>
                </div>

                {/* Balance after transaction */}
                <div className="bg-[var(--ep-bg-card)] border border-[var(--ep-border)] p-3 rounded-lg">
                  <div className="text-[var(--ep-muted)] mb-2 text-[10px] font-semibold uppercase tracking-[0.18em]">
                    Balance After Transaction
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--ep-muted)] text-sm">
                        Remaining KES
                      </span>
                      <span className="text-[var(--ep-heading)] font-medium text-sm">
                        KE {transactionSummary.totalKESBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--ep-muted)] text-sm">
                        {selectedToken.symbol} Balance
                      </span>
                      <span className="text-[var(--ep-heading)] font-medium text-sm">
                        {transactionSummary.remainingBalance.toFixed(6)}
                      </span>
                    </div>
                  </div>
                </div>
                {quoteValidation.requiredAmount &&
                  quoteValidation.availableBalance && (
                    <div className="bg-[var(--ep-bg-card)] border border-[var(--ep-border)] p-3 rounded-lg mt-3">
                      <div className="text-[var(--ep-muted)] mb-2 text-[10px] font-semibold uppercase tracking-[0.18em]">
                        Balance Check
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[var(--ep-muted)] text-sm">
                            Required
                          </span>
                          <span className="text-[var(--ep-heading)] font-medium text-sm">
                            {quoteValidation.requiredAmount.toFixed(6)}{" "}
                            {selectedToken.symbol}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[var(--ep-muted)] text-sm">
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
