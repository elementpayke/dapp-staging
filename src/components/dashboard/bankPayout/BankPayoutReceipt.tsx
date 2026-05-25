"use client";

import { Copy, CheckCircle, XCircle, X, Building2 } from "lucide-react";
import { useState, FC } from "react";
import { useModalOverlay } from "@/hooks/useModalOverlay";
import { motion, AnimatePresence } from "framer-motion";

// ── BankPayoutResult lives here now (BankPayoutModal.tsx was removed) ────────
// Imported by SendCryptoModal as: import BankPayoutReceipt, { BankPayoutResult }
export interface BankPayoutResult {
  success: boolean;
  bankName: string;
  amount: number;
  recipientNumber: string;
  reference: string;
  conversationId?: string;
  responseDescription: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface BankPayoutReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  result: BankPayoutResult | null;
}

// ─── Detail Row ───────────────────────────────────────────────────────────────

interface DetailRowProps {
  label: string;
  value: string;
  copyable?: boolean;
  accent?: boolean;
  mono?: boolean;
}

const DetailRow: FC<DetailRowProps> = ({ label, value, copyable, accent, mono }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm font-medium text-[var(--ep-muted)] whitespace-nowrap mr-4">
        {label}
      </span>
      <div className="flex items-center gap-2 min-w-0 justify-end">
        <span
          className={`text-[13px] font-semibold text-right truncate ${
            accent ? "text-[var(--ep-accent)]" : "text-[var(--ep-heading)]"
          } ${mono ? "font-mono tracking-wide" : ""}`}
        >
          {value}
        </span>
        {copyable && (
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-[var(--ep-accent-subtle)] rounded transition flex-shrink-0"
            title="Copy"
          >
            {copied ? (
              <CheckCircle size={14} className="text-green-500" />
            ) : (
              <Copy size={14} className="text-[var(--ep-muted)] hover:text-[var(--ep-accent)]" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function BankPayoutReceipt({
  isOpen,
  onClose,
  result,
}: BankPayoutReceiptProps) {
  useModalOverlay(isOpen);

  if (!isOpen || !result) return null;

  const statusInfo = result.success
    ? {
        icon: <CheckCircle className="w-6 h-6" />,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-500/10",
        borderColor: "border-green-200 dark:border-green-500/20",
        label: "Success",
      }
    : {
        icon: <XCircle className="w-6 h-6" />,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-100 dark:bg-red-500/10",
        borderColor: "border-red-200 dark:border-red-500/20",
        label: "Failed",
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-overlay flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="bg-[var(--ep-bg-card)] w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-[var(--ep-border)] max-h-[92vh] sm:max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Top bar ── */}
            <div className="flex justify-between items-center p-4 pb-0 shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--ep-accent-subtle)] rounded-full shadow-sm border border-[var(--ep-border)]/50">
                <Building2 size={16} className="text-[var(--ep-accent)]" />
                <span className="text-sm font-semibold text-[var(--ep-heading)]">Bank Payout</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-[var(--ep-accent-subtle)] text-[var(--ep-muted)] hover:text-[var(--ep-heading)] rounded-full transition-colors ml-auto"
              >
                <X size={20} />
              </button>
            </div>

            {/* ── Header ── */}
            <div className="flex flex-col items-center px-6 pt-2 pb-6 shrink-0">
              <div className={`p-3 rounded-full mb-3 ${statusInfo.bgColor} ${statusInfo.color}`}>
                {statusInfo.icon}
              </div>
              <div className="text-[var(--ep-muted)] text-sm mb-1 font-medium">
                {result.success ? "Payout to" : "Payout failed"}
              </div>
              <div className="text-lg font-bold text-[var(--ep-accent)] text-center mb-2 truncate max-w-[85%]">
                {result.bankName}
              </div>
              <div className="text-3xl font-extrabold text-[var(--ep-heading)] tracking-tight">
                KES {result.amount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
              </div>
              <div
                className={`mt-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border ${statusInfo.color} ${statusInfo.bgColor} ${statusInfo.borderColor}`}
              >
                {statusInfo.label}
              </div>
            </div>

            {/* ── Dashed receipt divider ── */}
            <div className="relative w-full overflow-hidden flex justify-center shrink-0">
              <div className="absolute inset-y-1/2 left-0 w-3 h-6 bg-black/60 rounded-r-full sm:hidden -translate-y-1/2" />
              <div className="w-full mx-6 border-t-[1.5px] border-dashed border-[var(--ep-border)]" />
              <div className="absolute inset-y-1/2 right-0 w-3 h-6 bg-black/60 rounded-l-full sm:hidden -translate-y-1/2" />
            </div>

            {/* ── Detail rows ── */}
            <div className="px-6 py-6 pb-4 space-y-0.5 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col gap-3.5">
                <DetailRow label="Bank" value={result.bankName} />
                <DetailRow label="Recipient" value={result.recipientNumber} />
                <DetailRow
                  label="Amount"
                  value={`KES ${result.amount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`}
                  accent
                />
                <DetailRow label="Reference" value={result.reference} copyable mono />
                {result.conversationId && (
                  <DetailRow label="Conversation ID" value={result.conversationId} copyable mono />
                )}
                {!result.success && (
                  <div className="flex flex-col gap-1 py-1">
                    <span className="text-sm font-medium text-[var(--ep-muted)]">Reason</span>
                    <span className="text-[13px] font-semibold text-red-500 dark:text-red-400 leading-relaxed">
                      {result.responseDescription}
                    </span>
                  </div>
                )}
                {result.success && (
                  <div className="mt-2 p-2.5 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20">
                    <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                      Your payout is being processed by SasaPay. Funds typically arrive within
                      minutes to a few hours depending on the receiving bank.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="p-4 border-t border-[var(--ep-border)] bg-[var(--ep-bg)] shrink-0">
              <button
                onClick={onClose}
                className="w-full px-4 py-3 text-sm font-medium rounded-xl bg-[var(--ep-accent)] text-white hover:opacity-90 transition-opacity shadow-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
