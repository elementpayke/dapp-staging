import React, { useState, useEffect } from "react";

interface PayToMobileMoneyProps {
  selectedToken: string;
  setSelectedToken: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  mobileNumber: string;
  setMobileNumber: (value: string) => void;
  reason: string;
  setReason: (value: string) => void;
  totalKES: number;
}

type PaymentMethod = "Send Money" | "Pay Bill" | "Buy Goods" | "Pochi La Biashara";

const PayToMobileMoney: React.FC<PayToMobileMoneyProps> = ({
  selectedToken,
  setSelectedToken,
  amount,
  setAmount,
  mobileNumber,
  setMobileNumber,
  reason,
  setReason,
  totalKES
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Send Money");
  const [businessNumber, setBusinessNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [showRecipientName, setShowRecipientName] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recentRecipients] = useState([
    { name: "John Doe", number: "0712345678", type: "Send Money" },
    { name: "Supermarket", number: "567890", type: "Buy Goods" },
    { name: "KPLC", number: "888888", type: "Pay Bill", account: "12345" }
  ]);

  // Simulate fetching recent recipients
  useEffect(() => {
    // In a real app, this would fetch from an API or local storage
  }, []);

  // Simulate recipient name lookup after entering mobile number
  useEffect(() => {
    if (paymentMethod === "Send Money" && mobileNumber.length >= 10) {
      // This would be an API call in a real app
      setTimeout(() => {
        const found = recentRecipients.find(r => r.number === mobileNumber);
        if (found) {
          setRecipientName(found.name);
        } else {
          setRecipientName("Unknown User");
        }
        setShowRecipientName(true);
      }, 500);
    } else {
      setShowRecipientName(false);
    }
  }, [mobileNumber, paymentMethod, recentRecipients]); // Added 'recentRecipients' to the dependency array

  // Validate input based on payment method
  const validateInput = () => {
    if (amount && parseFloat(amount) < 20) {
      return "Minimum amount is 20 KES";
    }
    
    if (paymentMethod === "Send Money" && mobileNumber.length !== 10) {
      return "Please enter a valid 10-digit mobile number";
    }
    
    if (paymentMethod === "Pay Bill" && !businessNumber) {
      return "Business number is required";
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
                  onChange={(e) => setMobileNumber(e.target.value.replace(/[^\d]/g, '').substring(0, 10))}
                  className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
                  placeholder="e.g., 0712345678"
                />
                {showRecipientName && (
                  <div className="mt-1 text-sm text-gray-600">
                    Sending to: {recipientName}
                  </div>
                )}
              </div>
            </div>
          </>
        );
      
      case "Pay Bill":
        return (
          <>
            <div>
              <label className="block text-gray-600 mb-2">Business Number</label>
              <input
                type="text"
                value={businessNumber}
                onChange={(e) => setBusinessNumber(e.target.value.replace(/[^\d]/g, ''))}
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
                value={businessNumber}
                onChange={(e) => setBusinessNumber(e.target.value.replace(/[^\d]/g, ''))}
                className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
                placeholder="e.g., 567890"
              />
            </div>
          </>
        );
      
      case "Pochi La Biashara":
        return (
          <>
            <div>
              <label className="block text-gray-600 mb-2">Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/[^\d]/g, '').substring(0, 10))}
                  className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
                  placeholder="Business owner's number"
                />
                {showRecipientName && (
                  <div className="mt-1 text-sm text-gray-600">
                    Business: {recipientName}
                  </div>
                )}
              </div>
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
      {/* <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-600 mb-2">
            Select your network
          </label>
          <select
            className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
            defaultValue="Base"
          >
            <option value="Base">Base</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-600 mb-2">Select your wallet</label>
          <select
            className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
            defaultValue="Binance"
          >
            <option value="Binance">Binance</option>
          </select>
        </div>
      </div> */}

      {/* M-PESA Payment Method Selector */}
      <div>
        <label className="block text-gray-600 mb-2">Payment Method</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["Send Money", "Pay Bill", "Buy Goods", "Pochi La Biashara"] as PaymentMethod[]).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={`p-3 rounded-lg text-center text-sm font-medium transition-colors ${
                paymentMethod === method
                  ? "bg-green-100 text-green-800 border-2 border-green-600"
                  : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Recipients */}
      <div>
        <label className="block text-gray-600 mb-2">Recent</label>
        <div className="flex overflow-x-auto space-x-3 pb-2">
          {recentRecipients
            .filter(r => {
              if (paymentMethod === "Send Money") return r.type === "Send Money";
              if (paymentMethod === "Buy Goods") return r.type === "Buy Goods";
              if (paymentMethod === "Pay Bill") return r.type === "Pay Bill";
              if (paymentMethod === "Pochi La Biashara") return r.type === "Pochi La Biashara";
              return false;
            })
            .map((recipient, index) => (
              <div
                key={index}
                onClick={() => {
                  setMobileNumber(recipient.number);
                  if (recipient.type === "Pay Bill") {
                    setBusinessNumber(recipient.number);
                    setAccountNumber(recipient.account || "");
                  } else if (recipient.type === "Buy Goods") {
                    setBusinessNumber(recipient.number);
                  }
                }}
                className="flex-shrink-0 cursor-pointer text-center"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-gray-200 flex items-center justify-center mb-1">
                  <span className="text-gray-700 font-bold">
                    {recipient.name.charAt(0)}
                  </span>
                </div>
                <span className="text-xs text-gray-600 block truncate w-16">
                  {recipient.name}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Dynamic Input Fields based on Payment Method */}
      {renderInputFields()}

      {/* Token and Amount */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-600 mb-2">Token</label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
          >
            <option value="USDC">USDC</option>
            <option value="ETH">ETH</option>
            <option value="DAI">DAI</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-600 mb-2">Amount in KES</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => {
              const newValue = e.target.value.replace(/[^\d.]/g, '');
              if (newValue === '' || parseFloat(newValue) <= totalKES) {
                setAmount(newValue);
              } else {
                setAmount(totalKES.toFixed(0).toString());
              }
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
          {paymentMethod === "Pay Bill" ? "Payment Reference (Optional)" : "Payment Reason (Optional)"}
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
            {amount ? (Math.min(parseFloat(amount) * 0.01, 100)).toFixed(2) : "0.00"} KES
          </span>
        </div>
      </div>
    </div>
  );
};

export default PayToMobileMoney;
