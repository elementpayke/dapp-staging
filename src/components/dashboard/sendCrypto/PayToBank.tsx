import React from "react";

interface PayToBankProps {
  selectedToken: string;
  setSelectedToken: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  bank: string;
  setBank: (value: string) => void;
  accountNumber: string;
  setAccountNumber: (value: string) => void;
  reason: string;
  setReason: (value: string) => void;
}

const PayToBank: React.FC<PayToBankProps> = ({
  selectedToken,
  setSelectedToken,
  amount,
  setAmount,
  bank,
  setBank,
  accountNumber,
  setAccountNumber,
  reason,
  setReason,
}) => {
  return (
    <div className="space-y-6">
      {/* Token and Amount */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="token" className="block text-gray-600 mb-3">
            Token
          </label>
          <select
            id="token"
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-lg border-0 text-gray-900"
          >
            <option value="USDC">USDC</option>
            <option value="ETH">ETH</option>
            <option value="BTC">BTC</option>
          </select>
        </div>
        <div>
          <label htmlFor="amount" className="block text-gray-600 mb-3">
            Amount in KE
          </label>
          <input
            id="amount"
            type="text"
            value={amount}
            placeholder="0.00"
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-lg border-0 text-gray-900"
          />
        </div>
      </div>

      {/* Bank Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="bank" className="block text-gray-600 mb-3">
            Recipient Bank
          </label>
          <select
            id="bank"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-lg border-0 text-gray-900"
          >
            <option value="Equity Bank">Equity Bank</option>
          </select>
        </div>
        <div>
          <label htmlFor="accountNumber" className="block text-gray-600 mb-3">
            Account Number
          </label>
          <input
            id="accountNumber"
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-lg border-0 text-gray-900"
          />
        </div>
      </div>

      {/* Payment Reason */}
      <div>
        <label htmlFor="reason" className="block text-gray-600 mb-3">
          Payment reason (Optional)
        </label>
        <input
          id="reason"
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-4 bg-gray-50 rounded-lg border-0 text-gray-900"
          placeholder="Enter payment reason"
        />
      </div>
    </div>
  );
};

export default PayToBank;
