import React from "react";


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
  return (
    <div className="space-y-4">
      {/* Network and Wallet Selection */}
      <div className="grid grid-cols-2 gap-4">
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
      </div>

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
          </select>
        </div>
        <div>
          <label className="block text-gray-600 mb-2">Amount in KE</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => {
              if (parseFloat(e.target.value) > totalKES) {
                console.log(`totalKES: ${totalKES}`);
                setAmount(totalKES.toFixed(0).toString());
              } else {
                setAmount(e.target.value);
              }
            }}
            className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
          />
          {amount && parseFloat(amount) < 20 && (
          <p className="text-red-500 mt-2 text-sm">
              Minimum amount is 20 KE
            </p>
          )}
        </div>
      </div>

      {/* Mobile Money and Recipient */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-600 mb-2">Mobile money</label>
          <select
            className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
            defaultValue="M-PESA"
          >
            <option value="M-PESA">M-PESA</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-600 mb-2">Recipient</label>
          <select
            className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
            defaultValue="personal"
          >
            <option value="personal">Personal number</option>
          </select>
        </div>
      </div>

      {/* Mobile Number */}
      <div>
        <label className="block text-gray-600 mb-2">Enter number</label>
        <input
          type="text"
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
          placeholder="Enter mobile number"
        />
      </div>

      {/* Payment Reason */}
      <div>
        <label className="block text-gray-600 mb-2">
          Payment reason (Optional)
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
          placeholder="Enter payment reason"
        />
      </div>
    </div>
  );
};

export default PayToMobileMoney;
