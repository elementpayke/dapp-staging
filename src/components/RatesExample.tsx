'use client';

import { useState } from 'react';
import { useTokenRates } from '../lib/useExchangeRate';

export const RatesExample = () => {
  const [currency, setCurrency] = useState('usdc');
  const [amountFiat, setAmountFiat] = useState(1000);
  const { rates, loading, error, calculateApprovalAmount, calculateFiatAmount } = useTokenRates(currency);

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
  };

  const handleAmountChange = (newAmount: number) => {
    setAmountFiat(newAmount);
  };

  if (loading) {
    return <div className="p-4">Loading rates...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!rates) {
    return <div className="p-4">No rates available</div>;
  }

  const approvalAmount = calculateApprovalAmount(amountFiat);
  const fiatAmount = calculateFiatAmount(approvalAmount);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Token to KES Rates</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Currency:</label>
        <select 
          value={currency} 
          onChange={(e) => handleCurrencyChange(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="usdc">USDC</option>
          <option value="eth">ETH</option>
          <option value="wxm">WXM</option>
          <option value="usdt_lisk">USDT (Lisk)</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Amount in KES:</label>
        <input
          type="number"
          value={amountFiat}
          onChange={(e) => handleAmountChange(Number(e.target.value))}
          className="w-full p-2 border rounded"
          placeholder="Enter amount in KES"
        />
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-gray-50 rounded">
          <h3 className="font-semibold">Current Rates:</h3>
          <p>Base Rate: {rates.base_rate} KES</p>
          <p>Marked Up Rate: {rates.marked_up_rate} KES</p>
          <p>Markup: {rates.markup_percentage}%</p>
        </div>

        <div className="p-3 bg-blue-50 rounded">
          <h3 className="font-semibold">Offramp Calculation:</h3>
          <p>Amount in KES: {amountFiat.toLocaleString()} KES</p>
          <p className="font-bold text-blue-600">
            Tokens to Approve: {approvalAmount.toFixed(6)} {currency.toUpperCase()}
          </p>
          <p className="text-sm text-gray-600">
            You'll receive: {fiatAmount.toFixed(2)} KES
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 rounded">
        <h3 className="font-semibold">How to use:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Call <code>approve()</code> with the calculated token amount</li>
          <li>Use the approved amount when creating offramp orders</li>
          <li>This ensures you don't get on-chain errors from under-approval</li>
        </ol>
      </div>
    </div>
  );
}; 