"use client";

import React, { FC } from "react";
import { Copy, MoreHorizontal, ExternalLink, X } from "lucide-react";
import ClientOnly from "@/components/shared/ClientOnly";
import TransactionDetailModal from "./TransactionDetailModal";
import { useState } from "react";
import { getExplorerInfo } from "@/utils/explorerUtils";

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

// Helper function to format token display
const formatTokenDisplay = (token: string) => {
  return token?.replace(/_/g, ' ');
};

const Arrow = ({ direction , status }: { direction: 'in' | 'out', status?: string }) => (
  <span
    className={`inline-flex items-center justify-center rounded-full p-1 mr-2 transition-transform duration-200 group-hover:scale-110 ${
      status === 'FAILED' || status === 'DECLINED' ? 'bg-red-400' : (direction === 'in' ? 'bg-green-50' : 'bg-[var(--ep-accent-muted)]')
    }`}
    aria-label={direction === 'in' ? 'Received' : 'Sent'}
  >
    {
      status === 'FAILED' || status === 'DECLINED' ? 
        <X className="w-5 h-5 text-white" />: null
      
    }
    {direction === 'in' ? (
      <svg className={`w-5 h-5  ${status === 'FAILED' || status === 'DECLINED' ? 'hidden' : 'text-green-500'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7v10h10" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-[var(--ep-accent)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
      window.open(getExplorerInfo(tx.tokenSymbol, tx.fullHash).url, "_blank");
    }
  };

  const displayValue = (val: any) =>
    val === undefined || val === null || val === '' || val === '—' ? 'N/A' : val;

  const round2 = (val: any) => {
    if (val === undefined || val === null || val === '' || isNaN(Number(val))) return 'N/A';
    return Number(val).toFixed(2);
  };

  // Step A — Derive a failed flag
  const isFailed = tx.status === 'FAILED' || tx.status === 'DECLINED';

  const isReceive = tx.direction === 'Receive';

  // Step D — Red-tint the amount on failed rows
  const amountColor = isFailed
    ? 'text-red-500'
    : isReceive
    ? 'text-green-600'
    : 'text-[var(--ep-accent)]';

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
      {/* Step B — Style the desktop row */}
      <div
        onClick={() => setShowModal(true)}
        className={`transaction-desktop hidden sm:grid sm:grid-cols-12 gap-4 items-center px-6 py-4 transition-colors text-sm border-b cursor-pointer ${
          isFailed
            ? 'bg-red-50 hover:bg-red-100 border-red-200'
            : 'hover:bg-[var(--ep-accent-subtle)] border-[var(--ep-border)]'
        }`}
      >
        {/* Transaction */}
        <div className="col-span-3 flex items-center min-w-0">

          <Arrow status={tx.status} direction={isReceive ? 'in' : 'out'} />
          <div className="min-w-0">
            <div className="font-medium text-[var(--ep-heading)] truncate">
              {isReceive ? 'Received from OnRamp' : `Sent to ${displayValue(tx.receiverDisplay)}`}
            </div>
            <div className="text-xs text-[var(--ep-muted)] mt-0.5">
              {displayValue(tx.time)} • {displayValue(tx.date)}
            </div>
          
            {tx.hash && tx.hash !== '—' && (
              <button
                onClick={handleOpenExplorer}
                className="text-xs text-[var(--ep-accent)] font-mono truncate hover:underline mt-0.5 flex items-center gap-1"
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
              : 'bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] border border-[var(--ep-accent)]/20'
          }`}>
            {displayValue(tx.paymentMethod)}
          </span>
          {tx.paymentMethod === 'M-Pesa' && tx.receiptNumber && (
            <span className="text-xs text-[var(--ep-muted)] font-mono flex items-center gap-1">
              Ref: {tx.receiptNumber}
              <button
                className="p-0.5 rounded hover:bg-[var(--ep-accent-subtle)]"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(tx.receiptNumber ?? '', 'M-Pesa reference');
                }}
                title="Copy M-Pesa reference number"
                aria-label="Copy M-Pesa reference number"
              >
                <Copy className="w-4 h-4 text-[var(--ep-muted)] hover:text-[var(--ep-accent)]" />
              </button>
            </span>
          )}
        </div>
        {/* Status */}
        <div className="col-span-1 text-center">{statusBadge}</div>
        {/* Actions */}
        <div className="col-span-2 flex items-center gap-2 justify-end">
          <button
            className="p-1 rounded hover:bg-[var(--ep-accent-subtle)]"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(tx.fullHash, 'Transaction hash');
            }}
            title="Copy transaction hash"
            aria-label="Copy transaction hash"
          >
            <Copy className="w-5 h-5 text-[var(--ep-muted)] hover:text-[var(--ep-accent)]" />
          </button>
          <button
            className="p-1 rounded hover:bg-[var(--ep-accent-subtle)]"
            onClick={(e) => e.stopPropagation()}
            title="More actions"
            aria-label="More actions"
          >
            <MoreHorizontal className="w-5 h-5 text-[var(--ep-muted)]" />
          </button>
        </div>
      </div>

      {/* Mobile row */}
      {/* Step C — Style the mobile row */}
      <div
        onClick={() => setShowModal(true)}
        className={`transaction-mobile flex sm:hidden flex-col gap-2 px-3 py-4 border-b rounded-xl shadow-[var(--ep-card-shadow)] mb-2 cursor-pointer ${
          isFailed
            ? 'bg-red-50 border-red-200'
            : 'bg-[var(--ep-bg-card)] border-[var(--ep-border)]'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0">
            <Arrow direction={isReceive ? 'in' : 'out'} />
            <span className="font-medium text-[var(--ep-heading)] truncate">
              {displayValue(mobileDisplayName)}
            </span>
            {statusBadge}
          </div>
        </div>
        <div className={`font-bold text-lg ${amountColor} mt-1`}>
          {amountSign}KE {round2(tx.amount ? tx.amount.replace(' KES', '') : undefined)}
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--ep-muted)]">
          <span>{displayValue(tx.time)} • {displayValue(tx.date)}</span>
          {tx.paymentMethod === 'M-Pesa' && tx.receiptNumber && (
            <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full ml-2">
              Ref: {tx.receiptNumber}
              <button
                className="p-0.5 rounded hover:bg-[var(--ep-accent-subtle)]"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(tx.receiptNumber ?? '', 'M-Pesa reference');
                }}
                title="Copy M-Pesa reference number"
                aria-label="Copy M-Pesa reference number"
              >
                <Copy className="w-4 h-4 text-[var(--ep-muted)] hover:text-[var(--ep-accent)]" />
              </button>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 justify-end mt-1">
          <button
            className="p-1 rounded hover:bg-[var(--ep-accent-subtle)]"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(tx.fullHash, 'Transaction hash');
            }}
            title="Copy transaction hash"
            aria-label="Copy transaction hash"
          >
            <Copy className="w-5 h-5 text-[var(--ep-muted)] hover:text-[var(--ep-accent)]" />
          </button>
          <button
            className="p-1 rounded hover:bg-[var(--ep-accent-subtle)]"
            onClick={(e) => e.stopPropagation()}
            title="More actions"
            aria-label="More actions"
          >
            <MoreHorizontal className="w-5 h-5 text-[var(--ep-muted)]" />
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
