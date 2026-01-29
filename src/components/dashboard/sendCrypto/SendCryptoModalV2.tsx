"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowUpRight,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Phone,
  Building2,
  Store,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useFeeStructure } from "@/hooks/useFeeStructure";
import { useOfframpTransaction } from "@/hooks/useOfframpTransaction";
import {
  useTransactionStore,
  selectProgress,
  selectPhaseMessage,
} from "@/stores/transactionStore";
import { SUPPORTED_TOKENS, SupportedToken } from "@/constants/supportedTokens";
import { getTotalCost } from "@/utils/feeStructure";
import { PhoneValidationResult } from "@/utils/phoneValidation";

import KenyanPhoneInput from "@/components/shared/KenyanPhoneInput";
import AmountInputWithQuickSelect from "@/components/shared/AmountInputWithQuickSelect";

// Payment method tabs
type PaymentMethod = "PHONE" | "PAYBILL" | "TILL";

const PAYMENT_METHODS = [
  { id: "PHONE" as const, label: "M-Pesa", icon: Phone },
  { id: "PAYBILL" as const, label: "PayBill", icon: Building2 },
  { id: "TILL" as const, label: "Till", icon: Store },
];

export function SendCryptoModalV2() {
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const [selectedToken, setSelectedToken] = useState<SupportedToken>(
    SUPPORTED_TOKENS[0],
  );
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PHONE");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneValidation, setPhoneValidation] = useState<PhoneValidationResult>(
    { isValid: false },
  );
  const [paybillNumber, setPaybillNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [tillNumber, setTillNumber] = useState("");
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);

  // Hooks
  const { balance: tokenBalance } = useTokenBalance({ token: selectedToken });
  const {
    feeBands,
    exchangeRate,
    isLoading: isLoadingFees,
  } = useFeeStructure({
    tokenSymbol: selectedToken.symbol,
    action: "OffRamp",
  });
  const { execute, cancel, phase, details, error, isProcessing } =
    useOfframpTransaction();
  const progress = useTransactionStore(selectProgress);
  const phaseMessage = useTransactionStore(selectPhaseMessage);
  const reset = useTransactionStore((s) => s.reset);

  // Calculate transaction summary
  const transactionSummary = useMemo(() => {
    const amountFiat = parseFloat(amount) || 0;

    if (!exchangeRate || amountFiat <= 0 || feeBands.length === 0) {
      return {
        amountFiat: 0,
        amountToken: 0,
        feeAmountFiat: 0,
        feeAmountToken: 0,
        totalTokenCost: 0,
        canAfford: false,
      };
    }

    const result = getTotalCost({
      amountFiat,
      tokenBalance,
      exchangeRate,
      feeBands,
      orderType: "OffRamp",
    });

    return {
      amountFiat,
      amountToken: amountFiat / exchangeRate,
      feeAmountFiat: result.feeAmountFiat,
      feeAmountToken: result.feeAmountFiat / exchangeRate,
      totalTokenCost: result.totalTokenCost,
      canAfford: result.canAfford,
    };
  }, [amount, exchangeRate, tokenBalance, feeBands]);

  // Form validation
  const isFormValid = useMemo(() => {
    const amountFiat = parseFloat(amount) || 0;

    if (amountFiat < 10) return false;
    if (!transactionSummary.canAfford) return false;

    switch (paymentMethod) {
      case "PHONE":
        return phoneValidation.isValid;
      case "PAYBILL":
        return paybillNumber.length >= 5 && accountNumber.length >= 1;
      case "TILL":
        return tillNumber.length >= 5;
      default:
        return false;
    }
  }, [
    amount,
    paymentMethod,
    phoneValidation,
    paybillNumber,
    accountNumber,
    tillNumber,
    transactionSummary.canAfford,
  ]);

  // Handle send
  const handleSend = useCallback(async () => {
    if (!exchangeRate) {
      toast.error("Exchange rate not available");
      return;
    }

    await execute({
      token: selectedToken,
      amountFiat: parseFloat(amount),
      exchangeRate,
      feeBands,
      paymentMethod,
      phoneNumber: paymentMethod === "PHONE" ? phoneNumber : undefined,
      paybillNumber: paymentMethod === "PAYBILL" ? paybillNumber : undefined,
      accountNumber: paymentMethod === "PAYBILL" ? accountNumber : undefined,
      tillNumber: paymentMethod === "TILL" ? tillNumber : undefined,
    });
  }, [
    selectedToken,
    amount,
    exchangeRate,
    feeBands,
    paymentMethod,
    phoneNumber,
    paybillNumber,
    accountNumber,
    tillNumber,
    execute,
  ]);

  // Handle close
  const handleClose = useCallback(() => {
    if (isProcessing) {
      // Don't close during processing, but allow viewing
      return;
    }
    setIsOpen(false);
    // Reset form after close
    setTimeout(() => {
      reset();
      setAmount("");
      setPhoneNumber("");
      setPaybillNumber("");
      setAccountNumber("");
      setTillNumber("");
    }, 300);
  }, [isProcessing, reset]);

  // Reset form when settlement completes
  useEffect(() => {
    if (phase === "settled") {
      // Keep modal open to show success, but allow closing
    }
  }, [phase]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && isProcessing) return; // Prevent closing during processing
        setIsOpen(open);
        if (!open) handleClose();
      }}
    >
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 bg-gradient-to-r from-[#0514eb] to-[#7c3aed] text-white text-sm font-medium py-3 px-4 rounded-xl hover:opacity-90 transition-opacity">
          <ArrowUpRight size={20} />
          Send Crypto V2
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden dark:bg-gray-900">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b dark:border-gray-800">
          <DialogTitle className="text-xl font-semibold dark:text-white">
            Send to Mobile Money
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            Convert crypto to KES and send to M-Pesa
          </DialogDescription>
        </DialogHeader>

        {/* Processing overlay - inline, not a separate modal */}
        {isProcessing && (
          <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b dark:border-gray-800">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {phaseMessage}
                </p>
                <div className="mt-2 h-1.5 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success state */}
        {phase === "settled" && (
          <div className="px-6 py-6 bg-green-50 dark:bg-green-900/20 border-b dark:border-gray-800">
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">
                Transaction Complete!
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                KES {details.amountFiat.toLocaleString()} sent to{" "}
                {details.recipient}
              </p>
              {details.mpesaReceiptNumber && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  M-Pesa Receipt: {details.mpesaReceiptNumber}
                </p>
              )}
              <button
                onClick={handleClose}
                className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Error state */}
        {phase === "failed" && error && (
          <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b dark:border-gray-800">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  {error.message}
                </p>
                <button
                  onClick={reset}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form - hidden during success */}
        {phase !== "settled" && (
          <div className="px-6 py-4 space-y-5">
            {/* Token selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Token
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTokenDropdown(!showTokenDropdown)}
                  disabled={isProcessing}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg border",
                    "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                    "hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={selectedToken.tokenLogo}
                      alt={selectedToken.symbol}
                      width={28}
                      height={28}
                      className="rounded-full"
                    />
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedToken.symbol}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        on {selectedToken.chain}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-gray-400 transition-transform",
                      showTokenDropdown && "rotate-180",
                    )}
                  />
                </button>

                {showTokenDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    {SUPPORTED_TOKENS.map((token) => (
                      <button
                        key={`${token.symbol}-${token.chain}`}
                        type="button"
                        onClick={() => {
                          setSelectedToken(token);
                          setShowTokenDropdown(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700",
                          "first:rounded-t-lg last:rounded-b-lg",
                          selectedToken === token &&
                            "bg-blue-50 dark:bg-blue-900/20",
                        )}
                      >
                        <Image
                          src={token.tokenLogo}
                          alt={token.symbol}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {token.symbol}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {token.chain}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount
              </label>
              <AmountInputWithQuickSelect
                value={amount}
                onChange={setAmount}
                tokenBalance={tokenBalance}
                exchangeRate={exchangeRate}
                feeBands={feeBands}
                isLoadingFees={isLoadingFees}
                tokenSymbol={selectedToken.symbol}
                disabled={isProcessing}
              />
            </div>

            {/* Payment method tabs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Send to
              </label>
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPaymentMethod(id)}
                    disabled={isProcessing}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
                      paymentMethod === id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                    )}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment method fields */}
            <div>
              {paymentMethod === "PHONE" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <KenyanPhoneInput
                    value={phoneNumber}
                    onChange={(value, validation) => {
                      setPhoneNumber(value);
                      setPhoneValidation(validation);
                    }}
                    disabled={isProcessing}
                  />
                </div>
              )}

              {paymentMethod === "PAYBILL" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      PayBill Number
                    </label>
                    <input
                      type="text"
                      value={paybillNumber}
                      onChange={(e) =>
                        setPaybillNumber(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="e.g., 247247"
                      disabled={isProcessing}
                      className={cn(
                        "w-full p-3 rounded-lg border",
                        "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                        "text-gray-900 dark:text-white placeholder:text-gray-400",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Enter account number"
                      disabled={isProcessing}
                      className={cn(
                        "w-full p-3 rounded-lg border",
                        "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                        "text-gray-900 dark:text-white placeholder:text-gray-400",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                      )}
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "TILL" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Till Number
                  </label>
                  <input
                    type="text"
                    value={tillNumber}
                    onChange={(e) =>
                      setTillNumber(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="e.g., 5234567"
                    disabled={isProcessing}
                    className={cn(
                      "w-full p-3 rounded-lg border",
                      "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                      "text-gray-900 dark:text-white placeholder:text-gray-400",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                    )}
                  />
                </div>
              )}
            </div>

            {/* Transaction summary */}
            {transactionSummary.amountFiat > 0 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    You send
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {transactionSummary.totalTokenCost.toFixed(4)}{" "}
                    {selectedToken.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Fee</span>
                  <span className="text-gray-600 dark:text-gray-300">
                    KES {transactionSummary.feeAmountFiat.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t dark:border-gray-700">
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    Recipient gets
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    KES {transactionSummary.amountFiat.toLocaleString()}
                  </span>
                </div>
                {!transactionSummary.canAfford && (
                  <div className="flex items-center gap-2 mt-2 text-red-500 text-xs">
                    <AlertCircle size={14} />
                    Insufficient balance
                  </div>
                )}
              </div>
            )}

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!isFormValid || isProcessing || isLoadingFees}
              className={cn(
                "w-full py-4 rounded-xl font-semibold text-white transition-all",
                "bg-gradient-to-r from-[#0514eb] to-[#7c3aed]",
                "hover:opacity-90 active:scale-[0.99]",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
              )}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </span>
              ) : isLoadingFees ? (
                "Loading fees..."
              ) : (
                `Send KES ${(parseFloat(amount) || 0).toLocaleString()}`
              )}
            </button>

            {/* Rate info */}
            {exchangeRate && (
              <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                1 {selectedToken.symbol} ≈ KES {exchangeRate.toFixed(2)}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default SendCryptoModalV2;
