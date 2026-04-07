"use client";

import React, { FC, useState, useEffect } from "react";
import { Copy, MoreHorizontal, ExternalLink, X } from "lucide-react";
import ClientOnly from "@/components/shared/ClientOnly";
import TransactionDetailModal from "./TransactionDetailModal";
import { getExplorerInfo } from "@/utils/explorerUtils";
import { useBalanceVisibilityStore } from "@/stores/balanceVisibilityStore";

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

const formatTokenDisplay = (token: string) => {
  return token?.replace(/_/g, ' ');
};

const Arrow = ({ direction, status }: { direction: 'in' | 'out', status?: string }) => (
  <span
    className={`inline-flex items-center justify-center rounded-full p-1 mr-2 transition-transform duration-200 group-hover:scale-110 ${status === 'FAILED' || status === 'DECLINED' ? 'bg-red-400' : (direction === 'in' ? 'bg-green-50' : 'bg-[var(--ep-accent-muted)]')
      }`}
    aria-label={direction === 'in' ? 'Received' : 'Sent'}
  >
    {
      status === 'FAILED' || status === 'DECLINED' ?
        <X className="w-5 h-5 text-white" /> : null
    }
    {direction === 'in' ? (
      <svg className={`w-5 h-5  ${status === 'FAILED' || status === 'DECLINED' ? 'hidden' : 'text-green-500'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7v10h10" />
      </svg>
    ) : (
      <svg className={`w-5 h-5 ${status === 'FAILED' || status === 'DECLINED' ? 'hidden' : 'text-[var(--ep-accent)]'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 7L7 17" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17V7H7" />
      </svg>
    )}
  </span>
);

const TransactionRow: FC<TransactionRowProps> = ({ tx }: { tx: ExtendedTx }) => {
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const balanceHidden = useBalanceVisibilityStore((s) => s.balanceHidden);
  const hideMode = useBalanceVisibilityStore((s) => s.hideMode);
  const isStarsMode = balanceHidden && hideMode === "stars";
  const blurClass = balanceHidden && hideMode === "blur" ? "blur-md select-none" : "";
  const maskText = (text: React.ReactNode) => (isStarsMode ? "••••••" : text);

  // Reactively track data-theme="dark" on <html> using a MutationObserver.
  // This re-renders the component whenever the user toggles the theme,
  // ensuring getFailedBg() always returns the correct colour.
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const html = document.documentElement;
    setIsDark(html.getAttribute('data-theme') === 'dark');
    const observer = new MutationObserver(() => {
      setIsDark(html.getAttribute('data-theme') === 'dark');
    });
    observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Returns the correct rgba for the failed row background,
  // accounting for both theme and hover state.
  // bg-red-50 is a semantic error colour (kept per design system rules);
  // we only adjust it in dark mode via inline style since Tailwind JIT
  // won't compile new dark: opacity-variant classes at runtime.
  const getFailedBg = () => {
    if (isDark) return isHovered ? 'rgba(69, 10, 10, 0.45)' : 'rgba(69, 10, 10, 0.30)';
    return isHovered ? 'rgba(254, 226, 226, 0.55)' : 'rgba(254, 226, 226, 0.25)';
  };

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

  const isFailed = tx.status === 'FAILED' || tx.status === 'DECLINED';
  const isReceive = tx.direction === 'Receive';

  const amountColor = isFailed
    ? 'text-red-500'
    : isReceive
      ? 'text-green-600'
      : 'text-[var(--ep-accent)]';

  const amountSign = isReceive ? '+' : '-';

  // CHANGE 1 — success: bg-green-50 text-green-600 → bg-green-100 text-green-800 (light mode contrast fix)
  //            failed:  unchanged in light mode; dark: variants added for dark mode
  const statusBadge = (
    <span className={`px-2 py-1 text-xs rounded-full ml-2 ${
      tx.status === 'FAILED' || tx.status === 'DECLINED'
        ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800/60'
        : 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50'
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
      {/* CHANGE 2 — failed row: original light mode kept exactly; dark: variants added */}
      <div
        onClick={() => setShowModal(true)}
        className={`transaction-desktop hidden sm:grid sm:grid-cols-12 gap-4 items-center px-6 py-4 transition-colors text-sm border-b cursor-pointer ${
          isFailed ? 'border-red-100' : 'hover:bg-[var(--ep-accent-subtle)] border-[var(--ep-border)]'
        }`}
        style={isFailed ? { backgroundColor: getFailedBg() } : undefined}
        onMouseEnter={() => isFailed && setIsHovered(true)}
        onMouseLeave={() => isFailed && setIsHovered(false)}
      >
        {/* Transaction */}
        <div className="col-span-3 flex items-center min-w-0">
          <Arrow status={tx.status} direction={isReceive ? 'in' : 'out'} />
          <div className="min-w-0">
            <div className={`font-medium text-[var(--ep-heading)] truncate transition-all duration-200 ${blurClass}`}>
              {maskText(isReceive ? 'Received from OnRamp' : `Sent to ${displayValue(tx.receiverDisplay)}`)}
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
          <div className={`font-semibold ${amountColor} transition-all duration-200 ${blurClass}`}>
            {isStarsMode ? '••••••' : `${amountSign}KE ${round2(tx.amount ? tx.amount.replace(' KES', '') : undefined)}`}
          </div>
        </div>

        {/* Crypto Value */}
        <div className="col-span-2 text-left">
          <div className={`font-mono text-[var(--ep-heading)] transition-all duration-200 ${blurClass}`}>
            {isStarsMode ? '••••••' : `${round2(tx.cryptoAmount?.split(' ')[0])} ${formatTokenDisplay(displayValue(tx.tokenSymbol))}`}
          </div>
        </div>

        {/* Method & M-Pesa Ref */}
        {/* CHANGE 3 — M-Pesa badge: same green contrast fix as status badge */}
        <div className="col-span-2 text-center flex flex-col items-center gap-1">
          <span className={`px-2 py-1 text-xs rounded-full ${tx.paymentMethod === 'M-Pesa'
              ? 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50'
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
      {/* CHANGE 4 — mobile failed row: original light mode kept; dark: variants added */}
      <div
        onClick={() => setShowModal(true)}
        className={`transaction-mobile flex sm:hidden items-center justify-between px-4 py-3 border-b cursor-pointer active:bg-[var(--ep-accent-subtle)] transition-colors ${
          isFailed ? 'border-red-100' : 'bg-transparent border-[var(--ep-border)]'
        }`}
        style={isFailed ? { backgroundColor: getFailedBg() } : undefined}
        onMouseEnter={() => isFailed && setIsHovered(true)}
        onMouseLeave={() => isFailed && setIsHovered(false)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <Arrow status={tx.status} direction={isReceive ? 'in' : 'out'} />
          <div className="flex flex-col min-w-0 justify-center">
            <span className={`text-sm font-medium text-[var(--ep-heading)] truncate w-full transition-all duration-200 ${blurClass}`}>
              {isStarsMode ? '••••••' : displayValue(mobileDisplayName)}
            </span>
            <div className="flex items-center text-[11px] text-[var(--ep-muted)] mt-0.5 gap-1.5">
              <span>{displayValue(tx.time)} • {displayValue(tx.date)}</span>
            </div>
            {tx.paymentMethod === 'M-Pesa' && tx.receiptNumber && (
              <span className="text-[10px] text-[var(--ep-muted)] mt-0.5 font-mono truncate">
                Ref: {tx.receiptNumber}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end flex-shrink-0 ml-3 justify-center">
          <div className={`text-sm font-semibold ${amountColor} transition-all duration-200 ${blurClass}`}>
            {isStarsMode ? '••••••' : `${amountSign}KE ${round2(tx.amount ? tx.amount.replace(' KES', '') : undefined)}`}
          </div>
          {/* CHANGE 5 — mobile success pill: same green contrast fix */}
          <div className="mt-1">
            <span className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-sm ${isFailed
                ? 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/40'
                : tx.status === 'SETTLED'
                  ? 'text-green-800 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
                  : 'text-yellow-600 bg-yellow-50'
              }`}>
              {tx.status === 'SETTLED' ? 'Success' : tx.status === 'FAILED' ? 'Declined' : displayValue(tx.status)}
            </span>
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
      </div>

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
