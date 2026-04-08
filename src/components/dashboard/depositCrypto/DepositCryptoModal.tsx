"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownLeft, Check, ChevronDown, Loader2, Wallet, Zap } from "lucide-react";
import { toast } from "react-toastify";
import { useAccount, useSwitchChain, useChainId } from "wagmi";
import { isSmartWallet, safeChainSwitch } from "@/lib/wallet-utils";
import TransactionInProgressModal from "./TranactionInProgress";
import DepositCryptoReceipt from "./DepositCryptoReciept";
import { createOnRampOrder, fetchOrderQuote } from "@/app/api/aggregator";
import { KYCRequiredError, extractKYCLimitSnapshot } from "@/services/kycError";
import { useKYCModalStore } from "@/stores/kycModalStore";
import {
  validateKenyanPhoneNumber,
} from "@/utils/phoneValidation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useWallet } from "@/hooks/useWallet";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useLiquidityBalance } from "@/hooks/useLiquidityBalance";
import { useModalOverlay } from "@/hooks/useModalOverlay";
import { TransactionReceipt } from "@/types/types";
import { SUPPORTED_TOKENS, SupportedToken, getAvailableTokens } from "@/constants/supportedTokens";
import ConversionWidget, { EditableSide } from "@/components/shared/ConversionWidget";
import CompactSummaryRows from "@/components/shared/CompactSummaryRows";
import { useOnboardingStore } from "@/stores/onboardingStore";
import {
  getApiCurrencyFromToken,
  fetchFeeStructureCached,
} from "@/utils/feeStructure";
import { useSelectedToken } from "@/context/TokenContext";
import { useAuthStore } from "@/stores/authStore";

interface CreateOrderResponse {
  status: string;
  message: string;
  data: {
    tx_hash: string;
    status: string;
    rate_used: number;
    amount_sent: number;
    fiat_paid: number;
  };
}

type OrderStatus =
  | "pending"
  | "processing"
  | "settled"
  | "complete"
  | "completed"
  | "failed";

const DepositCryptoModal: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Use shared token context for consistent token selection across modals
  const { selectedToken, setSelectedToken, selectTokenAndSwitchChain, isSwitchingChain } = useSelectedToken();
  const isEmbeddedWallet = useAuthStore((s) => s.walletPreference) === "embedded";

  // ── Landing page prefill (onramp flow) ────────────────────────────────────
  const landingInitiated = useOnboardingStore((s) => s.initiatedFromLanding);
  const landingFlow = useOnboardingStore((s) => s.flow);
  const landingAmount = useOnboardingStore((s) => s.amount);
  const landingTokenSymbol = useOnboardingStore((s) => s.tokenSymbol);
  const setLandingInitiated = useOnboardingStore((s) => s.setInitiatedFromLanding);
  const landingPrefillAppliedRef = useRef(false);

  // Ensure component only renders on client after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Apply landing-page prefill once for onramp flow
  useEffect(() => {
    if (!isMounted) return;
    if (landingPrefillAppliedRef.current) return;
    if (!landingInitiated || landingFlow !== "onramp") return;

    landingPrefillAppliedRef.current = true;

    if (landingAmount) setAmount(landingAmount);

    if (landingTokenSymbol) {
      const matchedToken = getAvailableTokens(isEmbeddedWallet).find(
        (t) => t.symbol === landingTokenSymbol,
      );
      if (matchedToken) setSelectedToken(matchedToken);
    }

    setIsConfirmModalOpen(true);
    setLandingInitiated(false);
  }, [
    isMounted,
    landingInitiated,
    landingFlow,
    landingAmount,
    landingTokenSymbol,
    setSelectedToken,
    setLandingInitiated,
  ]);

  // Get balance for the selected token dynamically
  const {
    balance: selectedTokenBalance,
    isCorrectNetwork,
    requiredChainId,
  } = useTokenBalance({
    token: selectedToken,
  });

  const [amount, setAmount] = useState("0.00");
  const [depositFrom, setDepositFrom] = useState("MPESA");
  const [phoneNumber, setPhoneNumber] = useState(""); // Stores only local 9-digit part (e.g. "712345678")

  // Full international number for validation & backend calls
  const fullPhoneNumber = phoneNumber ? `254${phoneNumber}` : "";

  const [reason, setReason] = useState("Transport");
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<{
    isValid: boolean;
    error?: string;
  }>({ isValid: false });
  const [isValidatingPhone, setIsValidatingPhone] = useState(false);
  const [quoteData, setQuoteData] = useState<{
    tokenAmount: number;
    feeAmount: number;
    effectiveRate: number;
  } | null>(null);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const TRANSACTION_FEE_RATE = 0.005;
  const accountState = useAccount();
  const { chain, connector } = accountState;
  const { address: walletAddress } = useWallet();
  const { switchChainAsync } = useSwitchChain();
  const currentChainId = useChainId();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const continuePollingRef = useRef<boolean>(true);

  // ── Bi-directional conversion state ───────────────────────────────────
  const [editableSide, setEditableSide] = useState<EditableSide>("KES");
  const [typedValue, setTypedValue] = useState("");
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const tokenDropdownRef = useRef<HTMLDivElement>(null);

  // Close token dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tokenDropdownRef.current && !tokenDropdownRef.current.contains(e.target as Node)) {
        setShowTokenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Hide dropdowns when any modal is open
  useModalOverlay(
    isConfirmModalOpen || isTransactionModalOpen || isReceiptModalOpen,
  );

  // Close the main Radix Dialog when child modals open so its overlay
  // and focus-trap no longer intercept pointer events on higher-z popups.
  useEffect(() => {
    if (isTransactionModalOpen || isReceiptModalOpen) {
      setIsConfirmModalOpen(false);
    }
  }, [isTransactionModalOpen, isReceiptModalOpen]);

  // Get target chain ID based on selected token
  const getTargetChainId = () => {
    switch (selectedToken.chain) {
      case "Base":   return 8453;
      case "Lisk":   return 1135;
      case "Scroll": return 534352;
      case "Arbitrum": return 42161;
      case "Polygon":  return 137;
      default:         return 8453;
    }
  };

  const transactionSummary = useMemo(() => {
    const fiatAmount = parseFloat(amount) || 0;
    const tokenAmount =
      quoteData?.tokenAmount || (exchangeRate ? fiatAmount / exchangeRate : 0);
    const feeAmount = quoteData?.feeAmount || 0;
    const effectiveRate = quoteData?.effectiveRate || exchangeRate || 0;
    const totalUSDC = tokenAmount;
    const remainingBalance = (selectedTokenBalance ?? 0) + totalUSDC;
    const totalKES = (selectedTokenBalance ?? 0) * effectiveRate;
    const totalKESBalance = totalKES + fiatAmount;

    return {
      kesAmount: fiatAmount,
      usdcAmount: tokenAmount,
      transactionCharge: feeAmount,
      totalUSDC,
      totalKES,
      totalKESBalance,
      walletBalance: selectedTokenBalance ?? 0,
      remainingBalance: Math.max(remainingBalance, 0),
      usdcBalance: selectedTokenBalance ?? 0,
      effectiveRate,
    };
  }, [amount, exchangeRate, selectedTokenBalance, quoteData]);

  // ── Conversion helpers (bi-directional) ───────────────────────────────
  const sanitizeDecimalInput = useCallback(
    (val: string) => val.replace(/[^\d.]/g, "").replace(/(\..*?)\..*/g, "$1"),
    [],
  );

  const toInputNumber = (v: string) => {
    const n = parseFloat(v);
    return isNaN(n) || n <= 0 ? 0 : n;
  };

  const numericTyped = toInputNumber(typedValue);
  const rate = exchangeRate ?? 0;

  const derivedKes =
    editableSide === "KES"
      ? typedValue
      : rate > 0 ? (numericTyped * rate).toFixed(2) : "0";

  const derivedToken =
    editableSide === "TOKEN"
      ? typedValue
      : rate > 0 ? (numericTyped / rate).toFixed(6) : "0";

  // Keep `amount` in sync for the rest of the logic (amount is always KES)
  useEffect(() => {
    const kes = editableSide === "KES" ? typedValue : derivedKes;
    if (kes !== amount) setAmount(kes || "0");
  }, [derivedKes, typedValue, editableSide]);

  const tokenDisplayValue = editableSide === "TOKEN" ? typedValue : derivedToken;
  const kesDisplayValue   = editableSide === "KES"   ? typedValue : derivedKes;

  const feePreview = useMemo(() => {
    if (quoteData?.feeAmount) return `KES ${quoteData.feeAmount.toFixed(2)} fee`;
    const kes = parseFloat(derivedKes) || 0;
    return `KES ${(kes * TRANSACTION_FEE_RATE).toFixed(2)} fee`;
  }, [derivedKes, quoteData, TRANSACTION_FEE_RATE]);

  // ── Liquidity check ───────────────────────────────────────────────────────
  // Compares the contract balance against what the user is asking for
  // plus a per-chain gas buffer. Cached 5 mins to keep RPC costs low.
  // NOTE: maxAvailableKES is intentionally NOT shown to the user —
  // displaying exact liquidity amounts is a security risk (supervisor feedback).
  const requestedTokenAmount = transactionSummary.usdcAmount;
  const {
    hasLiquidity,
    isPartiallyAvailable,
    isOnrampSupported,
    isLoading: isCheckingLiquidity,
  } = useLiquidityBalance(selectedToken, requestedTokenAmount, exchangeRate ?? 0);

  const [transactionReceipt, setTransactionReceipt] =
    useState<TransactionReceipt>({
      orderId: "",
      status: "pending",
      reason: "",
      amount: 0,
      amountCrypto: 0,
      transactionHash: "",
      address: "",
      phoneNumber: "",
    });

  const fetchExchangeRate = async () => {
    try {
      const currency = getApiCurrencyFromToken(selectedToken.symbol);
      const feeData = await fetchFeeStructureCached({
        token: currency,
        action: "OnRamp",
      });

      if (feeData.data.base_rate && feeData.data.base_rate > 0) {
        setExchangeRate(feeData.data.base_rate);
        console.log("[DepositCrypto] Fee structure rate:", feeData.data.base_rate, "KES per", selectedToken.symbol);
      } else {
        const response = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=USDC");
        const data = await response.json();
        if (data?.data?.rates?.KES) {
          const baseRate = parseFloat(data.data.rates.KES);
          setExchangeRate(baseRate);
          console.log("[DepositCrypto] Coinbase fallback rate:", baseRate);
        }
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
    }
  };

  const fetchQuote = async (fiatAmount: number) => {
    if (!fiatAmount || fiatAmount <= 0 || !walletAddress) {
      setQuoteData(null);
      return;
    }

    setIsFetchingQuote(true);
    try {
      const quoteResponse = await fetchOrderQuote({
        amountFiat: fiatAmount,
        tokenAddress: selectedToken.tokenAddress,
        walletAddress,
        orderType: 0,
        currency: "KES",
      });

      if (quoteResponse.status === "success" && quoteResponse.data) {
        const data = quoteResponse.data;
        setQuoteData({
          tokenAmount: data.required_token_amount,
          feeAmount: data.fee_amount,
          effectiveRate: data.effective_rate,
        });
        setExchangeRate(data.effective_rate);
      } else {
        setQuoteData(null);
      }
    } catch (error: any) {
      console.error("Error fetching quote:", error);
      setQuoteData(null);
    } finally {
      setIsFetchingQuote(false);
    }
  };

  const pollOrderStatusByTxHash = async (txHash: string) => {
    if (!txHash) return;
    if (!continuePollingRef.current) return;

    const MAX_ATTEMPTS = 30;
    let attempts = 0;

    const poll = async () => {
      if (!continuePollingRef.current) return;

      if (attempts >= MAX_ATTEMPTS) {
        setIsTransactionModalOpen(false);
        toast.error("Transaction verification timed out. Please check your M-Pesa for confirmation.");
        continuePollingRef.current = false;
        return;
      }

      attempts++;
      console.log(`[Poll ${attempts}/${MAX_ATTEMPTS}] Checking order status...`);

      try {
        const response = await fetch(`/api/orders/poll?txHash=${encodeURIComponent(txHash)}`);

        if (response.ok || response.status === 202) {
          const responseData = await response.json();
          const orderData = responseData?.data;

          if (!orderData) {
            console.log(`[Poll ${attempts}/${MAX_ATTEMPTS}] No order data yet...`);
            if (continuePollingRef.current) setTimeout(poll, 3000);
            return;
          }

          const status = orderData.status?.toLowerCase();
          const txHashes = orderData.transaction_hashes || {};
          const settlementHash = txHashes.settlement || txHashes.creation || txHash;

          const getUserFriendlyError = (reason: string) => {
            const errorMap: { [key: string]: string } = {
              "Missing CheckoutRequestID in STK response.": "Invalid phone number. Please check and try again.",
              "Rule limited.": "Payment rejected - similar one just sent. Wait a moment and retry.",
            };
            return errorMap[reason] || reason;
          };

          setTransactionReceipt({
            orderId: orderData.order_id,
            status,
            reason: status === "failed" ? getUserFriendlyError(orderData.failure_reason || "") : "",
            amount: orderData.amount_fiat,
            amountCrypto: orderData.amount_fiat / (exchangeRate ?? 1),
            transactionHash: settlementHash,
            address: orderData.wallet_address,
            phoneNumber: orderData.phone_number,
          });

          if (status === "settled" || status === "complete" || status === "completed") {
            console.log(`✅ [Poll] Order settled!`);
            setIsTransactionModalOpen(false);
            setIsReceiptModalOpen(true);
            continuePollingRef.current = false;
            window.dispatchEvent(new CustomEvent("elementpay:refresh-transactions"));
            return;
          }

          if (status === "failed") {
            console.log(`❌ [Poll] Order failed`);
            setIsTransactionModalOpen(false);
            setIsReceiptModalOpen(true);
            continuePollingRef.current = false;
            return;
          }
        }

        if (continuePollingRef.current) setTimeout(poll, 10000);
      } catch (err) {
        console.error(`[Poll ${attempts}/${MAX_ATTEMPTS}] Error:`, err);
        if (continuePollingRef.current && attempts < MAX_ATTEMPTS) setTimeout(poll, 3000);
      }
    };

    poll();
  };

  useEffect(() => {
    fetchExchangeRate();
  }, []);

  useEffect(() => {
    const fiatAmount = parseFloat(amount);
    if (!fiatAmount || fiatAmount <= 0) {
      setQuoteData(null);
      return;
    }
    const timeoutId = setTimeout(() => fetchQuote(fiatAmount), 500);
    return () => clearTimeout(timeoutId);
  }, [amount, selectedToken.tokenAddress, walletAddress]);

  const handleConfirmPayment = async () => {
    if (!walletAddress) return toast.error("Please connect your wallet first.");
    if (parseFloat(amount) <= 0) return toast.error("Amount must be greater than zero.");

    const targetChainId = getTargetChainId();
    if (chain?.id !== targetChainId) {
      const isSmartWalletConnected = isSmartWallet(connector);

      if (isSmartWalletConnected) {
        console.log(`📱 Smart wallet detected (${connector?.name}), proceeding without chain switch`);
        toast.info(`Smart wallet detected. Proceeding with ${selectedToken.chain} transaction.`);
      } else {
        try {
          const switchResult = await safeChainSwitch({
            connector,
            currentChainId: chain?.id || currentChainId,
            targetChainId,
            switchChainAsyncFn: switchChainAsync,
            chainName: selectedToken.chain,
          });

          if (switchResult.success) {
            if (switchResult.method === "switched") {
              toast.success(`Switched to ${selectedToken.chain}. Please click Confirm again.`);
              return;
            } else if (switchResult.method === "manual-required") {
              toast.warning(switchResult.message);
              return;
            }
          } else {
            toast.error(switchResult.message);
            return;
          }
        } catch (error) {
          console.error("Network switch error:", error);
          toast.error(`Please switch to ${selectedToken.chain} network to proceed.`);
          return;
        }
      }
    }

    if (!phoneValidation.isValid) {
      toast.error(phoneValidation.error || "Please enter a valid phone number");
      return;
    }

    if (!phoneValidation.isValid) {
      const isValid = await validatePhoneWithBackend(fullPhoneNumber);
      if (!isValid) {
        toast.error("Phone number validation failed. Please check and try again.");
        return;
      }
    }

    setIsLoading(true);

    const processOrder = async () => {
      try {
        console.log("🚀 Creating onramp order...");
        if (!walletAddress) throw new Error("Wallet address is not available");

        console.log("🔍 Token details:", {
          symbol: selectedToken.symbol,
          chain: selectedToken.chain,
          tokenAddress: selectedToken.tokenAddress,
          userAddress: walletAddress,
          amount: parseFloat(amount),
          phoneNumber: fullPhoneNumber,
          reason,
        });

        const res = await Promise.race([
          createOnRampOrder({
            userAddress: walletAddress,
            tokenAddress: String(selectedToken.tokenAddress),
            amount: parseFloat(amount),
            phoneNumber: fullPhoneNumber,
            reason,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(
              `API request timed out after 45 seconds. The Element Pay service may be experiencing high load. Please try again in a few moments or contact support if the issue persists.`
            )), 45000),
          ),
        ]);

        const txHash = (res as CreateOrderResponse)?.data?.tx_hash;
        console.log("🔁 Starting poll for order created with tx:", txHash);
        if (!txHash) throw new Error("No transaction hash received from API");

        setIsConfirmModalOpen(false);
        setIsTransactionModalOpen(true);
        setIsLoading(false);

        setTransactionReceipt({
          orderId: "",
          status: "pending",
          reason: "",
          amount: 0,
          amountCrypto: 0,
          transactionHash: txHash,
          address: walletAddress || "",
          phoneNumber: fullPhoneNumber,
        });
        continuePollingRef.current = true;
        pollOrderStatusByTxHash(txHash);
      } catch (error: any) {
        console.error("Transaction failed:", error?.message || error);
        setIsLoading(false);

        if (error instanceof KYCRequiredError) {
          console.log("🛡️ [KYC] Transaction limit exceeded — opening KYC modal");
          setIsConfirmModalOpen(false);
          useKYCModalStore.getState().openKYCModal(extractKYCLimitSnapshot(error.details));
          return;
        }

        if (error.message?.includes("timeout") || error.message?.includes("504")) {
          toast.error(selectedToken.symbol === "WXM"
            ? "WXM onramp service is currently experiencing delays. This may be due to high network congestion on Arbitrum. Please try again in a few minutes or contact Element Pay support."
            : "The Element Pay service is currently unavailable. This appears to be a server-side issue. Please try again in a few minutes or contact Element Pay support."
          );
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

    processOrder();
  };

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
    let digits = e.target.value.replace(/\D/g, "");
    if (digits.startsWith("254")) digits = digits.slice(3);
    else if (digits.startsWith("0")) digits = digits.slice(1);
    const local = digits.slice(0, 9);
    setPhoneNumber(local);
    if (local !== phoneNumber) setPhoneValidation({ isValid: false });
  };

  useEffect(() => {
    if (!phoneNumber) { setPhoneValidation({ isValid: false }); return; }
    const timeoutId = setTimeout(() => {
      const validation = validateKenyanPhoneNumber(`254${phoneNumber}`);
      setPhoneValidation(validation);
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [phoneNumber]);

  if (!isMounted) return null;

  // ── Button state ──────────────────────────────────────────────────────────
  const isButtonDisabled =
    isLoading ||
    isCheckingLiquidity ||
    (!hasLiquidity && !isPartiallyAvailable) ||
    !isOnrampSupported ||
    parseFloat(amount) <= 0 ||
    !phoneValidation.isValid ||
    isValidatingPhone;

  const buttonLabel = (() => {
    if (isLoading)           return "Processing…";
    if (isCheckingLiquidity) return "Checking availability…";
    if (!isOnrampSupported)  return "Onramp is currently unavailable";
    if (isValidatingPhone)   return "Validating…";
    return "Confirm Deposit";
  })();

  return (
    <>
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogTrigger
          className="flex items-center gap-1.5 sm:gap-2 bg-emerald-500 text-black text-xs sm:text-sm font-semibold py-2 px-3 sm:py-3 sm:px-5 rounded-full hover:bg-emerald-400 transition-all duration-200 shadow-[0_2px_16px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_24px_rgba(16,185,129,0.35)]"
          onClick={() => setIsConfirmModalOpen(true)}
        >
          <ArrowDownLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
          Deposit Crypto
        </DialogTrigger>

        <DialogContent className="w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 bg-[var(--ep-bg-card)] border border-[var(--ep-border)] rounded-2xl shadow-[var(--ep-card-shadow)]">
          {/* ── Header ─────────────────────────────────────────── */}
          <DialogHeader className="pb-3">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ep-accent-muted)] text-[var(--ep-accent)]">
                <Wallet className="h-4 w-4" />
              </span>
              <p className="text-xs font-medium text-[var(--ep-muted)] sm:text-sm">
                Mobile Money to Crypto
              </p>
            </div>
            <DialogTitle className="text-lg font-semibold text-[var(--ep-heading)]">
              Deposit Crypto
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* ── Network mismatch warning ───────────────────── */}
            {!isCorrectNetwork && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 font-medium dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400">
                ⚠️ Please switch to {selectedToken.chain} network
              </div>
            )}

            {/* ── Partial liquidity banner ───────────────────────────────────
                Shown when the contract has some funds but not enough to
                cover the user's full requested amount.

                IMPORTANT: We deliberately do NOT show the exact available
                amount (maxAvailableKES) here. Revealing the precise liquidity
                figure is a security risk — it exposes internal contract balance
                information. We only tell the user to try a lower amount.       */}
            {isPartiallyAvailable && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">
                  Amount unavailable
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500 leading-relaxed">
                  We can't process your request right now. Please try a lower amount.
                </p>
              </div>
            )}

            {/* ── Phone number (M-Pesa) ──────────────────────── */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--ep-body)]">
                M-Pesa phone number
              </label>
              <div className={`flex overflow-hidden rounded-xl border transition-all focus-within:border-[var(--ep-border-focus)] ${
                phoneValidation.isValid
                  ? "border-emerald-400"
                  : phoneNumber && !phoneValidation.isValid && phoneValidation.error
                    ? "border-red-400"
                    : "border-[var(--ep-border)]"
              } bg-[var(--ep-bg-input)]`}>
                <div className="flex items-center gap-1.5 border-r border-[var(--ep-border)] px-3 py-2.5 text-xs text-[var(--ep-body)]">
                  <span>🇰🇪</span>
                  <span>+254</span>
                </div>
                <input
                  type="tel"
                  placeholder="7XX XXX XXX"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-[var(--ep-heading)] outline-none ring-0 placeholder:text-[var(--ep-muted)] focus:outline-none focus:ring-0"
                />
                {isValidatingPhone && (
                  <div className="flex items-center pr-3">
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--ep-accent)]" />
                  </div>
                )}
                {phoneValidation.isValid && !isValidatingPhone && (
                  <div className="flex items-center pr-3">
                    <Check className="h-4 w-4 text-emerald-500" />
                  </div>
                )}
              </div>
              {phoneNumber && !phoneValidation.isValid && phoneValidation.error && (
                <p className="mt-1 text-xs text-red-500">{phoneValidation.error}</p>
              )}
              <p className="mt-1 text-[10px] text-[var(--ep-muted)]">
                You will receive an M-Phecheesa STK push on this number
              </p>
            </div>

            {/* ── Bi-directional conversion widget ───────────── */}
            <ConversionWidget
              editableSide={editableSide}
              setEditableSide={setEditableSide}
              typedValue={typedValue}
              setTypedValue={setTypedValue}
              tokenDisplayValue={tokenDisplayValue}
              kesDisplayValue={kesDisplayValue}
              tokenSymbol={selectedToken.symbol}
              exchangeRate={exchangeRate}
              feePreview={feePreview}
              tokenBalance={selectedTokenBalance}
              isBalanceLoading={false}
              balanceError={false}
              sanitize={sanitizeDecimalInput}
              tokenSelector={
                <div className="relative" ref={tokenDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowTokenDropdown((prev) => !prev)}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-[var(--ep-heading)] hover:bg-[var(--ep-bg-input)] transition-colors"
                  >
                    {selectedToken.tokenLogo && (
                      <img src={selectedToken.tokenLogo} alt="" className="h-4 w-4 rounded-full object-contain" />
                    )}
                    <span>{selectedToken.symbol}</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showTokenDropdown ? "rotate-180" : ""}`} />
                  </button>

                  {showTokenDropdown && (
                    <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-card)] p-1.5 shadow-lg">
                      {getAvailableTokens(isEmbeddedWallet).map((token) => {
                        const isActive = token.symbol === selectedToken.symbol && token.chain === selectedToken.chain;
                        return (
                          <button
                            key={token.symbol + token.chain}
                            type="button"
                            onClick={() => {
                              selectTokenAndSwitchChain(token);
                              setShowTokenDropdown(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors ${
                              isActive
                                ? "bg-[var(--ep-accent-muted)] text-[var(--ep-heading)]"
                                : "text-[var(--ep-body)] hover:bg-[var(--ep-bg-input)]"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <img src={token.tokenLogo} alt="" className="h-5 w-5 rounded-full object-contain" />
                              <span className="text-sm font-medium">{token.symbol}</span>
                              <span className="flex items-center gap-1 rounded-full border border-[var(--ep-border)] px-1.5 py-0.5 text-[10px] text-[var(--ep-muted)]">
                                <img src={token.chainLogo} alt="" className="h-3 w-3 rounded-full object-contain" />
                                {token.chain}
                              </span>
                            </span>
                            {isActive && <Check className="h-3.5 w-3.5 text-[var(--ep-accent)]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {isSwitchingChain && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-md bg-[var(--ep-bg-card)]/60">
                      <Loader2 className="h-3 w-3 animate-spin text-[var(--ep-accent)]" />
                    </div>
                  )}
                </div>
              }
            />

            {/* ── Quote loading indicator ────────────────────── */}
            {isFetchingQuote && (
              <p className="text-xs text-[var(--ep-accent)] flex items-center gap-1.5 px-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Fetching live quote…
              </p>
            )}

            {/* ── Reason (optional) ──────────────────────────── */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--ep-body)]">
                Payment reason <span className="text-[var(--ep-muted)]">(optional)</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-input)] px-3 py-2.5 text-sm text-[var(--ep-heading)] outline-none transition-all placeholder:text-[var(--ep-muted)] focus:border-[var(--ep-border-focus)] focus:ring-2 focus:ring-[var(--ep-accent)]/10"
                placeholder="e.g. Transport, Savings"
              />
            </div>

            {/* ── CTA button ─────────────────────────────────── */}
            <button
              onClick={handleConfirmPayment}
              disabled={isButtonDisabled}
              type="button"
              className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white bg-[var(--ep-accent)] hover:bg-[var(--ep-accent-hover)] shadow-[0_2px_16px_rgba(67,57,202,0.25)] hover:shadow-[0_4px_24px_rgba(67,57,202,0.35)] transition-all duration-200 disabled:opacity-50"
            >
              {buttonLabel}
            </button>

            {/* ── Compact summary (expandable) ───────────────── */}
            <CompactSummaryRows
              rows={[
                { label: "Amount to pay", value: `KES ${parseFloat(amount || "0").toFixed(2)}` },
                {
                  label: `${selectedToken.symbol} to receive`,
                  value: isFetchingQuote ? "Calculating…" : `${selectedToken.symbol} ${transactionSummary.usdcAmount.toFixed(6)}`,
                  accent: true,
                },
                {
                  label: "Transaction fee",
                  value: isFetchingQuote ? "…" : `KES ${transactionSummary.transactionCharge.toFixed(2)}`,
                  accent: true,
                },
                { label: "Wallet balance", value: `${selectedToken.symbol} ${transactionSummary.walletBalance.toFixed(4)}` },
                { label: "Balance after deposit", value: `${transactionSummary.remainingBalance.toFixed(4)} ${selectedToken.symbol}` },
                { label: "Total", value: `KES ${parseFloat(amount || "0").toFixed(2)}`, isTotal: true },
              ]}
              note="You will receive an M-Pesa STK push to complete the payment. Rates may update before confirmation."
            />
          </div>
        </DialogContent>
      </Dialog>

      <TransactionInProgressModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        phone_number={fullPhoneNumber}
      />

      <DepositCryptoReceipt
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          continuePollingRef.current = false;
          if (transactionReceipt.status === "failed") setIsTransactionModalOpen(false);
        }}
        selectedToken={selectedToken}
        transactionReciept={transactionReceipt}
      />
    </>
  );
};

export default DepositCryptoModal;
