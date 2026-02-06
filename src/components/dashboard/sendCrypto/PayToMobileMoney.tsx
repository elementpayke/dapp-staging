"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { SupportedToken } from "@/constants/supportedTokens";
import TokenDropdown from "@/components/ui/TokenDropdown";
import MaxOfframpButton from "./MaxOfframpButton";
import KenyanPhoneInput from "@/components/shared/KenyanPhoneInput";
import { MIN_TRANSACTION_AMOUNT_KES } from "@/utils/feeStructure";

interface PayToMobileMoneyProps {
  selectedToken: SupportedToken;
  setSelectedToken: (value: SupportedToken) => void;
  amount: string;
  setAmount: (value: string) => void;
  mobileNumber: string;
  setMobileNumber: (value: string) => void;
  reason: string;
  setReason: (value: string) => void;
  totalKES: number;
  tillNumber: string;
  setTillNumber: (value: string) => void;
  paybillNumber: string;
  setPaybillNumber: (value: string) => void;
  accountNumber: string;
  setAccountNumber: (value: string) => void;
  setCashoutType: (type: "PHONE" | "TILL" | "PAYBILL") => void;
  phoneValidation?: { isValid: boolean; error?: string };
  isValidatingPhone?: boolean;
  selectedTokenBalance: number;
  exchangeRate: number | null;
  account: any;
  handleMaxAmountSet: (amount: string) => void;
  transactionChargeKES: number;
  feeBands: Array<{
    min_amount: number;
    max_amount: number | null;
    fee_amount: number;
    description: string;
  }>;
}

type PaymentMethod = "Send Money" | "Pay Bill" | "Buy Goods";

const PayToMobileMoney: React.FC<PayToMobileMoneyProps> = ({
  selectedToken,
  setSelectedToken,
  amount,
  setAmount,
  mobileNumber,
  setMobileNumber,
  reason,
  setReason,
  totalKES,
  tillNumber,
  setTillNumber,
  paybillNumber,
  setPaybillNumber,
  accountNumber,
  setAccountNumber,
  setCashoutType,
  phoneValidation = { isValid: false },
  isValidatingPhone = false,
  selectedTokenBalance,
  exchangeRate,
  account,
  handleMaxAmountSet,
  transactionChargeKES,
  feeBands,
}) => {
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("Send Money");

  const [internalPhoneValidation, setInternalPhoneValidation] = useState<{
    isValid: boolean;
    error?: string;
    network?: string;
  }>({ isValid: false });

  useEffect(() => {
    switch (paymentMethod) {
      case "Pay Bill":
        setTillNumber("");
        setCashoutType("PAYBILL");
        break;
      case "Buy Goods":
        setPaybillNumber("");
        setAccountNumber("");
        setCashoutType("TILL");
        break;
      case "Send Money":
        setPaybillNumber("");
        setAccountNumber("");
        setTillNumber("");
        setCashoutType("PHONE");
        break;
      default:
        setCashoutType("PHONE");
        break;
    }
  }, [
    paymentMethod,
    setTillNumber,
    setCashoutType,
    setPaybillNumber,
    setAccountNumber,
  ]);

  const validateInput = () => {
    if (amount && Number.parseFloat(amount) < MIN_TRANSACTION_AMOUNT_KES) {
      return `Minimum amount is ${MIN_TRANSACTION_AMOUNT_KES} KES`;
    }

    if (paymentMethod === "Pay Bill") {
      if (!paybillNumber) {
        return "Business number is required";
      }
      if (!accountNumber) {
        return "Account number is required";
      }
    }

    if (paymentMethod === "Buy Goods" && !tillNumber) {
      return "Till number is required";
    }

    if (paymentMethod === "Send Money" && !mobileNumber) {
      return "Phone number is required";
    }

    return null;
  };

  const error = validateInput();

  const renderInputFields = () => {
    switch (paymentMethod) {
      case "Send Money":
        return (
          <>
            <div>
              <label className="block text-gray-600 mb-2 text-sm sm:text-base">
                Phone Number
              </label>
              {/* ✅ SOLUTION: Use className prop to override default styling */}
              <KenyanPhoneInput
                value={mobileNumber}
                onChange={(value, validation) => {
                  setMobileNumber(value);
                  setInternalPhoneValidation(validation);
                }}
                disabled={false}
                placeholder="7XX XXX XXX"
                className="phone-input-light-mode"
              />
              <p className="text-xs text-gray-500 mt-1.5 px-1">
                Enter your 9-digit Safaricom number
              </p>
            </div>
          </>
        );

      case "Pay Bill":
        return (
          <>
            <div>
              <label className="block text-gray-600 mb-2 text-sm sm:text-base">
                Business Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={paybillNumber}
                onChange={(e) =>
                  setPaybillNumber(e.target.value.replace(/[^\d]/g, ""))
                }
                className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900 text-base"
                placeholder="e.g., 888888"
              />
            </div>
            <div className="mt-3 sm:mt-4">
              <label className="block text-gray-600 mb-2 text-sm sm:text-base">
                Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900 text-base"
                placeholder="e.g., Account/Reference number"
              />
            </div>
          </>
        );

      case "Buy Goods":
        return (
          <>
            <div>
              <label className="block text-gray-600 mb-2 text-sm sm:text-base">
                Till Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={tillNumber}
                onChange={(e) =>
                  setTillNumber(e.target.value.replace(/[^\d]/g, ""))
                }
                className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900 text-base"
                placeholder="e.g., 567890"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* ✅ GLOBAL STYLES: Override KenyanPhoneInput dark mode defaults for this form */}
      <style jsx global>{`
        .phone-input-light-mode > div {
          background-color: transparent !important;
        }
        .phone-input-light-mode input {
          background-color: white !important;
          color: #111827 !important;
        }
        .phone-input-light-mode > div > div:first-child {
          background-color: #f3f4f6 !important;
          border-color: #e5e7eb !important;
        }
        .phone-input-light-mode .dark\\:bg-gray-800,
        .phone-input-light-mode .dark\\:bg-gray-700 {
          background-color: white !important;
        }
        .phone-input-light-mode .dark\\:text-gray-100,
        .phone-input-light-mode .dark\\:text-gray-300 {
          color: #111827 !important;
        }
        .phone-input-light-mode .dark\\:border-gray-700,
        .phone-input-light-mode .dark\\:border-gray-600 {
          border-color: #e5e7eb !important;
        }
      `}</style>

      <div className="space-y-3 sm:space-y-4">
        {/* M-PESA Payment Method Selector */}
        <div>
          <label className="block text-gray-600 mb-2 text-sm sm:text-base">
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {(["Send Money", "Pay Bill", "Buy Goods"] as PaymentMethod[]).map(
              (method) => {
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`relative p-2 sm:p-3 rounded-lg text-center text-xs sm:text-sm font-medium transition-colors ${
                      paymentMethod === method
                        ? "bg-green-100 text-green-800 border-2 border-green-600"
                        : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {method}
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* Dynamic Input Fields based on Payment Method */}
        {renderInputFields()}

        {/* Token and Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-gray-600 mb-2 text-sm sm:text-base">
              Token
            </label>
            <TokenDropdown
              selected={selectedToken}
              onSelect={setSelectedToken}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-gray-600 text-sm sm:text-base">
                Amount in KES
              </label>
              <MaxOfframpButton
                disabled={false}
                selectedTokenBalance={selectedTokenBalance}
                exchangeRate={exchangeRate}
                selectedTokenAddress={selectedToken.tokenAddress}
                selectedTokenSymbol={selectedToken.symbol}
                walletAddress={account?.address}
                onMaxAmountCalculated={handleMaxAmountSet}
                feeBands={feeBands}
              />
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const newValue = e.target.value.replace(/[^\d.]/g, "");
                setAmount(newValue);
              }}
              className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900 text-base"
              placeholder="Enter amount"
            />
            {error && (
              <p className="text-red-500 mt-2 text-xs sm:text-sm">{error}</p>
            )}
          </div>
        </div>

        {/* Payment Reason */}
        <div>
          <label className="block text-gray-600 mb-2 text-sm sm:text-base">
            {paymentMethod === "Pay Bill"
              ? "Payment Reference (Optional)"
              : "Payment Reason (Optional)"}
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900 text-base"
            placeholder={
              paymentMethod === "Pay Bill"
                ? "Enter payment reference"
                : paymentMethod === "Buy Goods"
                  ? "Enter store name or item purchased"
                  : "Enter payment reason"
            }
          />
        </div>

        {/* Balance & Fee Information */}
        <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg">
          <div className="flex justify-between text-xs sm:text-sm mb-2">
            <span className="text-gray-600">Available balance:</span>
            <span className="font-medium">{totalKES.toFixed(2)} KES</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-600">Transaction fee:</span>
            <span className="font-medium">
              {transactionChargeKES.toFixed(2)} KES
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default PayToMobileMoney;
