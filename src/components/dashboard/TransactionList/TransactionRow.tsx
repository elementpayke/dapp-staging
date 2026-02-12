"use client";

import React, { FC } from "react";
import { Copy, MoreHorizontal, ExternalLink } from "lucide-react";
import ClientOnly from "@/components/shared/ClientOnly";
import TransactionDetailModal from "./TransactionDetailModal";
import { useState } from "react";

interface ExtendedTx {
  id: string;
  name: string;
  time: string;
  date: string;
  hash: string;
  fullHash: string;
  status: string;
  description: string;
  amount: string;
  receiverDisplay: string;
  tokenSymbol: string;
  cryptoAmount: string;
  exchangeRate?: number;
  paymentMethod: string;
  direction: 'Send' | 'Receive';
  processingTime?: string;
  receiptNumber?: string;
  invoiceId?: string;
  orderType: string;
  rawDate?: Date;
  [key: string]: any;
}

interface TransactionRowProps {
  tx: ExtendedTx;
}

// ─── Multi-chain explorer helper ────────────────────────────────────────────
const getExplorerUrl = (tokenSymbol: string, hash: string): string => {
  const symbol = (tokenSymbol ?? "").toUpperCase();

  if (symbol.includes("SCROLL"))
    return `https://scrollscan.com/tx/${hash}`;
  if (symbol.includes("LISK"))
    return `https://blockscout.lisk.com/tx/${hash}`;
  if (symbol.includes("ETH") && !symbol.includes("BASE"))
    return `https://etherscan.io/tx/${hash}`;
  if (symbol.includes("POLYGON") || symbol.includes("MATIC"))
    return `https://polygonscan.com/tx/${hash}`;
  if (symbol.includes("ARB"))
    return `https://arbiscan.io/tx/${hash}`;
  if (symbol.includes("OP") || symbol.includes("OPTIMISM"))
    return `https://optimistic.etherscan.io/tx/${hash}`;

  // Default → Base
  return `https://basescan.org/tx/${hash}`;
};
// ────────────────────────────────────────────────────────────────────────────

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
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7v10h10" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 7L7 17" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17V7H7" />
      </svg>
    )}
  </span>
);

const TransactionRow: FC<TransactionRowProps> = ({ tx }: { tx: ExtendedTx }) => {
  const [showModal, setShowModal] = useState(false);

  const copyToClipboard = async (text: string, type: string = 'text') => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // silently fail
    }
  };

  const handleOpenExplorer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tx.fullHash && tx.fullHash !== "—") {
      window.open(getExplorerUrl(tx.tokenSymbol, tx.fullHash), "_blank");
    }
  };

  const displayValue = (val: any) =>
    val === undefined || val === null || val === '' || val === '—' ? 'N/A' : val;

  const round2 = (val: any) => {
    if (val === undefined || val === null || val === '' || isNaN(Number(val))) return 'N/A';
    return Number(val).toFixed(2);
  };

  const isReceive = tx.direction === 'Receive';
  const amountColor = isReceive ? 'text-green-600' : 'text-red-600';
  const amountSign = isReceive ? '+' : '-';

  const statusBadge = (
    <span className={`px-2 py-1 text-xs rounded-full ml-2 ${
      tx.status === 'FAILED' || tx.status === 'DECLINED'
        ? 'bg-red-50 text-red-600 border border-red-200'
        : 'bg-green-50 text-green-600 border border-green-200'
    }`}>
      {tx.status === 'SETTLED' ? 'Success' : tx.status === 'FAILED' ? 'Declined' : displayValue(tx.status)}
    </span>
  );

  let mobileDisplayName = 'OnRamp';
  if (!isReceive && tx.receiverDisplay) {
    mobileDisplayName = tx.receiverDisplay;
  } else if (isReceive && tx.receiverDisplay && tx.receiverDisplay !== 'OnRamp') {
    mobileDisplayName = tx.receiverDisplay;
  }

  return (
    <ClientOnly>
      {/* Desktop/tablet row */}
      <div
        onClick={() => setShowModal(true)}
        className="transaction-desktop hidden sm:grid sm:grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-gray-50 transition-colors text-sm border-b border-gray-100 cursor-pointer"
      >
        {/* Transaction */}
        <div className="col-span-3 flex items-center min-w-0">
          <Arrow direction={isReceive ? 'in' : 'out'} />
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {isReceive ? 'Received from OnRamp' : `Sent to ${displayValue(tx.receiverDisplay)}`}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {displayValue(tx.time)} • {displayValue(tx.date)}
            </div>
            {tx.hash && tx.hash !== '—' && (
              <button
                onClick={handleOpenExplorer}
                className="text-xs text-blue-500 font-mono truncate hover:underline mt-0.5 flex items-center gap-1"
                title="View on Explorer"
              >
                {displayValue(tx.hash)}
                <ExternalLink size={12} />
              </button>
            )}
          </div>
        </div>
        {/* Amount */}
        <div className="col-span-2 text-left">
          <div className={`font-semibold ${amountColor}`}>
            {amountSign}KE {round2(tx.amount ? tx.amount.replace(' KES', '') : undefined)}
          </div>
        </div>
        {/* Crypto Value */}
        <div className="col-span-2 text-left">
          <div className="font-mono">
            {round2(tx.cryptoAmount?.split(' ')[0])} {formatTokenDisplay(displayValue(tx.tokenSymbol))}
          </div>
        </div>
        {/* Method & M-Pesa Ref */}
        <div className="col-span-2 text-center flex flex-col items-center gap-1">
          <span className={`px-2 py-1 text-xs rounded-full ${
            tx.paymentMethod === 'M-Pesa'
              ? 'bg-green-50 text-green-600 border border-green-200'
              : 'bg-blue-50 text-blue-600 border border-blue-200'
          }`}>
            {displayValue(tx.paymentMethod)}
          </span>
          {tx.paymentMethod === 'M-Pesa' && tx.receiptNumber && (
            <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
              Ref: {tx.receiptNumber}
              <button
                className="p-0.5 rounded hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(tx.receiptNumber ?? '', 'M-Pesa reference');
                }}
                title="Copy M-Pesa reference number"
                aria-label="Copy M-Pesa reference number"
              >
                <Copy className="w-4 h-4 text-gray-400 hover:text-blue-500" />
              </button>
            </span>
          )}
        </div>
        {/* Status */}
        <div className="col-span-1 text-center">{statusBadge}</div>
        {/* Actions */}
        <div className="col-span-2 flex items-center gap-2 justify-end">
          <button
            className="p-1 rounded hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(tx.fullHash, 'Transaction hash');
            }}
            title="Copy transaction hash"
            aria-label="Copy transaction hash"
          >
            <Copy className="w-5 h-5 text-gray-400 hover:text-blue-500" />
          </button>
          <button
            className="p-1 rounded hover:bg-gray-100"
            onClick={(e) => e.stopPropagation()}
            title="More actions"
            aria-label="More actions"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Mobile row */}
      <div
        onClick={() => setShowModal(true)}
        className="transaction-mobile flex sm:hidden flex-col gap-2 px-3 py-4 border-b border-gray-100 bg-white rounded-lg shadow-sm mb-2 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0">
            <Arrow direction={isReceive ? 'in' : 'out'} />
            <span className="font-medium text-gray-900 truncate">
              {displayValue(mobileDisplayName)}
            </span>
            {statusBadge}
          </div>
        </div>
        <div className={`font-bold text-lg ${amountColor} mt-1`}>
          {amountSign}KE {round2(tx.amount ? tx.amount.replace(' KES', '') : undefined)}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{displayValue(tx.time)} • {displayValue(tx.date)}</span>
          {tx.paymentMethod === 'M-Pesa' && tx.receiptNumber && (
            <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full ml-2">
              Ref: {tx.receiptNumber}
              <button
                className="p-0.5 rounded hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(tx.receiptNumber ?? '', 'M-Pesa reference');
                }}
                title="Copy M-Pesa reference number"
                aria-label="Copy M-Pesa reference number"
              >
                <Copy className="w-4 h-4 text-gray-400 hover:text-blue-500" />
              </button>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 justify-end mt-1">
          <button
            className="p-1 rounded hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(tx.fullHash, 'Transaction hash');
            }}
            title="Copy transaction hash"
            aria-label="Copy transaction hash"
          >
            <Copy className="w-5 h-5 text-gray-400 hover:text-blue-500" />
          </button>
          <button
            className="p-1 rounded hover:bg-gray-100"
            onClick={(e) => e.stopPropagation()}
            title="More actions"
            aria-label="More actions"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {showModal && (
        <TransactionDetailModal
          transaction={tx}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </ClientOnly>
  );
};

export default TransactionRow;
