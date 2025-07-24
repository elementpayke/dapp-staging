"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { SupportedToken } from "@/constants/supportedTokens";
import TokenDropdown from "@/components/ui/TokenDropdown";

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
}

type PaymentMethod =
  | "Send Money"
  | "Pay Bill"
  | "Buy Goods";

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
}) => {
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("Send Money");

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
        setCashoutType("PHONE"); // Add default case
        break;
    }
  }, [
    paymentMethod,
    setTillNumber,
    setCashoutType,
    setPaybillNumber,
    setAccountNumber,
  ]);

  // Validate input based on payment method
  const validateInput = () => {
    if (amount && Number.parseFloat(amount) < 10) {
      return "Minimum amount is 10 KES";
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
              <label className="block text-gray-600 mb-2">Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  value={mobileNumber}
                  autoComplete="false"
                  onChange={(e) => {
                    let input = e.target.value
                      .replace(/[^\d]/g, "")
                      .substring(0, 12);
                    // If starts with '2540', prevent entering
                    if (input.startsWith("2540")) {
                      // Do not update the value
                      return;
                    }
                    // If input is empty, set default to '254'
                    if (input === "") {
                      setMobileNumber("254");
                      return;
                    }
                    // Ensure input always starts with '254'
                    if (!input.startsWith("254")) {
                      input = "254" + input.replace(/^254*/, "");
                    }
                    setMobileNumber(input);
                  }}
                  className={`w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900 focus:outline-none focus:ring-2 transition-colors ${
                    phoneValidation.isValid 
                      ? 'focus:ring-green-500 border-green-200' 
                      : mobileNumber && !phoneValidation.isValid 
                      ? 'focus:ring-red-500 border-red-200' 
                      : 'focus:ring-blue-500'
                  }`}
                  placeholder="e.g., 254712345678"
                />
                {isValidatingPhone && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
                {phoneValidation.isValid && !isValidatingPhone && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              {mobileNumber && !phoneValidation.isValid && phoneValidation.error && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {phoneValidation.error}
                </p>
              )}
              {phoneValidation.isValid && (
                <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Valid Safaricom number
                </p>
              )}
            </div>
          </>
        );

      case "Pay Bill":
        return (
          <>
            <div>
              <label className="block text-gray-600 mb-2">
                Business Number
              </label>
              <input
                type="text"
                value={paybillNumber}
                onChange={(e) =>
                  setPaybillNumber(e.target.value.replace(/[^\d]/g, ""))
                }
                className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
                placeholder="e.g., 888888"
              />
            </div>
            <div className="mt-4">
              <label className="block text-gray-600 mb-2">Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
                placeholder="e.g., Account/Reference number"
              />
            </div>
          </>
        );

      case "Buy Goods":
        return (
          <>
            <div>
              <label className="block text-gray-600 mb-2">Till Number</label>
              <input
                type="text"
                value={tillNumber}
                onChange={(e) =>
                  setTillNumber(e.target.value.replace(/[^\d]/g, ""))
                }
                className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
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
    <div className="space-y-4">
      {/* Network and Wallet Selection */}

      {/* M-PESA Payment Method Selector */}
      <div>
        <label className="block text-gray-600 mb-2">Payment Method</label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              "Send Money",
              "Pay Bill",
              "Buy Goods",
            ] as PaymentMethod[]
          ).map((method) => {
            return (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`relative p-3 rounded-lg text-center text-sm font-medium transition-colors ${paymentMethod === method
                  ? "bg-green-100 text-green-800 border-2 border-green-600"
                  : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {method}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Input Fields based on Payment Method */}
      {renderInputFields()}

      {/* Token and Amount */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-600 mb-2">Token</label>
          <TokenDropdown
            selected={selectedToken}
            onSelect={setSelectedToken}
          />
        </div>
        <div>
          <label className="block text-gray-600 mb-2">Amount in KES</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => {
              // Allow only numbers and decimal point
              const newValue = e.target.value.replace(/[^\d.]/g, "");
              setAmount(newValue);
            }}
            className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
            placeholder="Enter amount"
          />
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>
      </div>

      {/* Payment Reason */}
      <div>
        <label className="block text-gray-600 mb-2">
          {paymentMethod === "Pay Bill"
            ? "Payment Reference (Optional)"
            : "Payment Reason (Optional)"}
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
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
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Available balance:</span>
          <span className="font-medium">{totalKES.toFixed(2)} KES</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Transaction fee:</span>
          <span className="font-medium">
            {amount
              ? Math.min(Number.parseFloat(amount) * 0.01, 100).toFixed(2)
              : "0.00"}{" "}
            KES
          </span>
        </div>
      </div>
    </div>
  );
};

export default PayToMobileMoney;
