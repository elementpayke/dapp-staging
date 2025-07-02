"use client";

import React, { FC } from "react";
import { Copy, MoreHorizontal } from "lucide-react";
import ClientOnly from "@/components/shared/ClientOnly";

interface ExtendedTx {
  [key: string]: any;
}

interface TransactionRowProps {
  tx: ExtendedTx;
}

// Helper function to format token display
const formatTokenDisplay = (token: string) => {
  return token?.replace(/_/g, ' ');
};

const Arrow = ({ direction }: { direction: 'in' | 'out' }) => (
  <span
    className={`inline-flex items-center justify-center rounded-full p-1 mr-2 transition-transform duration-200 group-hover:scale-110 ${
      direction === 'in' ? 'bg-green-50' : 'bg-red-50'
    }`}
    aria-label={direction === 'in' ? 'Received' : 'Sent'}
  >
    {direction === 'in' ? (
      // Down-left arrow (↙), mirroring the up-right arrow
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7v10h10" />
      </svg>
    ) : (
      // Up-right arrow (↗)
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 7L7 17" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17V7H7" />
      </svg>
    )}
  </span>
);

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
  const round2 = (val: any) => {
    if (val === undefined || val === null || val === '' || isNaN(Number(val))) return 'N/A';
    return Number(val).toFixed(2);
  };

  // Amount color and sign
  const isReceive = tx.direction === 'Receive';
  const amountColor = isReceive ? 'text-green-600' : 'text-red-600';
  const amountSign = isReceive ? '+' : '-';

  // Status badge color
  const statusBadge = (
    <span className={`px-2 py-1 text-xs rounded-full ml-2 ${
      tx.status === 'FAILED' || tx.status === 'DECLINED'
        ? 'bg-red-50 text-red-600 border border-red-200'
        : 'bg-green-50 text-green-600 border border-green-200'
    }`}>
      {tx.status === 'SETTLED' ? 'Success' : tx.status === 'FAILED' ? 'Declined' : displayValue(tx.status)}
    </span>
  );

  // Mobile display name logic
  let mobileDisplayName = 'OnRamp';
  if (!isReceive && tx.receiverDisplay) {
    mobileDisplayName = tx.receiverDisplay;
  } else if (isReceive && tx.receiverDisplay && tx.receiverDisplay !== 'OnRamp') {
    mobileDisplayName = tx.receiverDisplay;
  }

  return (
    <ClientOnly>
      {/* Desktop/tablet row */}
      <div className="transaction-desktop hidden sm:grid sm:grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-gray-50 transition-colors text-sm border-b border-gray-100">
        {/* Transaction (arrow, description, date) */}
        <div className="col-span-3 flex items-center min-w-0">
          <Arrow direction={isReceive ? 'in' : 'out'} />
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {isReceive ? 'Received from OnRamp' : `Sent to ${displayValue(tx.receiverDisplay)}`}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {displayValue(tx.time)} • {displayValue(tx.date)}
            </div>
            {tx.hash && (
              <div className="text-xs text-blue-500 font-mono truncate cursor-pointer hover:underline mt-0.5" title="View on Explorer">
                {displayValue(tx.hash)}
              </div>
            )}
          </div>
        </div>
        {/* Amount */}
        <div className="col-span-2 text-left">
          <div className={`font-semibold ${amountColor}`}>{amountSign}KE {round2(tx.amount ? tx.amount.replace(' KES', '') : undefined)}</div>
        </div>
        {/* Crypto Value */}
        <div className="col-span-2 text-left">
          <div className="font-mono">{round2(tx.cryptoAmount?.split(' ')[0])} {formatTokenDisplay(displayValue(tx.tokenSymbol))}</div>
        </div>
        {/* Method & M-Pesa Ref */}
        <div className="col-span-2 text-center flex flex-col items-center gap-1">
          <span className={`px-2 py-1 text-xs rounded-full ${tx.paymentMethod === 'M-Pesa' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>{displayValue(tx.paymentMethod)}</span>
          {tx.paymentMethod === 'M-Pesa' && tx.receiptNumber && (
            <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
              Ref: {tx.receiptNumber}
              <button
                className="p-0.5 rounded hover:bg-gray-100"
                onClick={() => copyToClipboard(tx.receiptNumber, 'M-Pesa reference')}
                title="Copy M-Pesa reference number"
                aria-label="Copy M-Pesa reference number"
              >
                <Copy className="w-4 h-4 text-gray-400 hover:text-blue-500" />
              </button>
            </span>
          )}
        </div>
        {/* Status */}
        <div className="col-span-1 text-center">
          {statusBadge}
        </div>
        {/* Actions */}
        <div className="col-span-2 flex items-center gap-2 justify-end">
          <button
            className="p-1 rounded hover:bg-gray-100"
            onClick={() => copyToClipboard(tx.fullHash, 'Transaction hash')}
            title="Copy transaction hash"
            aria-label="Copy transaction hash"
          >
            <Copy className="w-5 h-5 text-gray-400 hover:text-blue-500" />
          </button>
          <button
            className="p-1 rounded hover:bg-gray-100"
            title="More actions"
            aria-label="More actions"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
      {/* Mobile row (user-friendly, minimal) */}
      <div className="transaction-mobile flex sm:hidden flex-col gap-2 px-3 py-4 border-b border-gray-100 bg-white rounded-lg shadow-sm mb-2">
        {/* Row 1: Arrow, Display Name, Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0">
            <Arrow direction={isReceive ? 'in' : 'out'} />
            <span className="font-medium text-gray-900 truncate">
              {displayValue(mobileDisplayName)}
            </span>
            {statusBadge}
          </div>
        </div>
        {/* Row 2: Amount */}
        <div className={`font-bold text-lg ${amountColor} mt-1`}>{amountSign}KE {round2(tx.amount ? tx.amount.replace(' KES', '') : undefined)}</div>
        {/* Row 3: Date & Time, M-Pesa Ref */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{displayValue(tx.time)} • {displayValue(tx.date)}</span>
          {tx.paymentMethod === 'M-Pesa' && tx.receiptNumber && (
            <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full ml-2">
              Ref: {tx.receiptNumber}
              <button
                className="p-0.5 rounded hover:bg-gray-100"
                onClick={() => copyToClipboard(tx.receiptNumber, 'M-Pesa reference')}
                title="Copy M-Pesa reference number"
                aria-label="Copy M-Pesa reference number"
              >
                <Copy className="w-4 h-4 text-gray-400 hover:text-blue-500" />
              </button>
            </span>
          )}
        </div>
        {/* Row 4: Actions */}
        <div className="flex items-center gap-2 justify-end mt-1">
          <button
            className="p-1 rounded hover:bg-gray-100"
            onClick={() => copyToClipboard(tx.fullHash, 'Transaction hash')}
            title="Copy transaction hash"
            aria-label="Copy transaction hash"
          >
            <Copy className="w-5 h-5 text-gray-400 hover:text-blue-500" />
          </button>
          <button
            className="p-1 rounded hover:bg-gray-100"
            title="More actions"
            aria-label="More actions"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </ClientOnly>
  );
};

export default TransactionRow; 