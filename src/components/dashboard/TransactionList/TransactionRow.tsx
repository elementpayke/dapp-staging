import React, { FC } from "react";
import { Copy } from "lucide-react";

interface ExtendedTx {
  [key: string]: any;
}

interface TransactionRowProps {
  tx: ExtendedTx;
}

const TransactionRow: FC<TransactionRowProps> = ({ tx }: { tx: ExtendedTx }) => {
  // Copy to clipboard helper
  const copyToClipboard = async (text: string, type: string = 'text') => {
    try {
      await navigator.clipboard.writeText(text);
      // Optionally, show a toast or tooltip
    } catch (err) {
      // Optionally, show an error toast
    }
  };

  // Helper for missing data
  const displayValue = (val: any) => (val === undefined || val === null || val === '' || val === '—') ? 'N/A' : val;

  return (
    <>
      {/* Desktop Row */}
      <div className="hidden sm:grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-gray-50 transition-colors text-sm">
        {/* Recipient/Service */}
        <div className="col-span-2 min-w-0">
          <div className="font-medium text-gray-900 truncate">{displayValue(tx.receiverDisplay)}</div>
          <div className="text-xs text-gray-500">{displayValue(tx.direction)} • {displayValue(tx.time)}</div>
        </div>
        {/* Type */}
        <div className="col-span-1 text-center">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${tx.orderType === 'OnRamp' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{displayValue(tx.orderType)}</span>
        </div>
        {/* Crypto Amount */}
        <div className="col-span-1 text-center font-mono">{displayValue(tx.cryptoAmount)}</div>
        {/* Exchange Rate */}
        <div className="col-span-1 text-center">{tx.exchangeRate ? tx.exchangeRate.toFixed(2) : 'N/A'}</div>
        {/* Transaction Hash with Copy */}
        <div className="col-span-2 flex items-center justify-center gap-2">
          <button
            className="flex items-center gap-1 group"
            onClick={() => copyToClipboard(tx.fullHash, 'Transaction hash')}
            title="Copy transaction hash"
            aria-label="Copy transaction hash"
          >
            <Copy className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
            <span className="font-mono truncate" title={tx.fullHash}>{displayValue(tx.hash)}</span>
          </button>
        </div>
        {/* Receipt Number with Copy */}
        <div className="col-span-1 text-center">
          {tx.receiptNumber ? (
            <button
              className="text-blue-600 hover:text-blue-800 underline"
              onClick={() => copyToClipboard(tx.receiptNumber, 'Receipt number')}
              title="Copy receipt number"
              aria-label="Copy receipt number"
            >
              {tx.receiptNumber.slice(-6)}
            </button>
          ) : (
            <span className="text-gray-400">N/A</span>
          )}
        </div>
        {/* Payment Method */}
        <div className="col-span-1 text-center">
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">{displayValue(tx.paymentMethod)}</span>
        </div>
        {/* Status */}
        <div className="col-span-1 text-center">
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
            tx.status === 'FAILED' || tx.status === 'DECLINED'
              ? 'bg-red-100 text-red-700'
              : tx.status === 'PENDING'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-green-100 text-green-700'
          }`} title={tx.status}>
            {tx.status === 'SETTLED' ? 'Success' : tx.status === 'FAILED' ? 'Declined' : displayValue(tx.status)}
          </span>
        </div>
        {/* Amount */}
        <div className="col-span-2 text-right font-semibold">
          <span className={
            tx.status === 'FAILED' || tx.status === 'DECLINED' ? 'text-red-600' : 'text-black'
          }>
            KE {displayValue(tx.amount ? tx.amount.replace(' KES', '') : undefined)}
          </span>
        </div>
      </div>
      {/* Mobile Row */}
      <div className="sm:hidden px-4 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100 text-sm">
        <div className="flex justify-between items-start mb-2">
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">{displayValue(tx.receiverDisplay)}</div>
            <div className="text-xs text-gray-500 mt-1">{displayValue(tx.direction)} • {displayValue(tx.time)}</div>
          </div>
          <div className="ml-4 text-right font-semibold">
            <span className={
              tx.status === 'FAILED' || tx.status === 'DECLINED' ? 'text-red-600' : 'text-black'
            }>
              KE {displayValue(tx.amount ? tx.amount.replace(' KES', '') : undefined)}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-2 p-2 bg-gray-50 rounded-lg">
          <div>
            <div className="text-xs text-gray-500">Crypto</div>
            <div className="font-mono">{displayValue(tx.cryptoAmount)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Rate</div>
            <div>{tx.exchangeRate ? tx.exchangeRate.toFixed(2) : 'N/A'} KES</div>
          </div>
        </div>
        <div className="mb-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            tx.orderType === 'OnRamp' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {displayValue(tx.orderType)}
          </span>
        </div>
        <div className="mb-2 flex items-center gap-2">
          <button
            className="flex items-center gap-1 group"
            onClick={() => copyToClipboard(tx.fullHash, 'Transaction hash')}
            title="Copy transaction hash"
            aria-label="Copy transaction hash"
          >
            <Copy className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
            <span className="font-mono truncate" title={tx.fullHash}>{displayValue(tx.hash)}</span>
          </button>
        </div>
        {tx.receiptNumber && (
          <div className="mb-2 flex items-center gap-2">
            <button
              className="flex items-center gap-1 group text-blue-600 hover:text-blue-800 underline"
              onClick={() => copyToClipboard(tx.receiptNumber, 'Receipt number')}
              title="Copy receipt number"
              aria-label="Copy receipt number"
            >
              <Copy className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
              <span>{tx.receiptNumber}</span>
            </button>
          </div>
        )}
        <div className="flex flex-wrap gap-2 items-center mt-2">
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
            tx.status === 'FAILED' || tx.status === 'DECLINED'
              ? 'bg-red-100 text-red-700'
              : tx.status === 'PENDING'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-green-100 text-green-700'
          }`} title={tx.status}>
            {tx.status === 'SETTLED' ? 'Success' : tx.status === 'FAILED' ? 'Declined' : displayValue(tx.status)}
          </span>
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
            {displayValue(tx.paymentMethod)}
          </span>
          {tx.processingTime && (
            <span className="text-xs text-gray-500">{tx.processingTime}</span>
          )}
        </div>
      </div>
    </>
  );
};

export default TransactionRow; 