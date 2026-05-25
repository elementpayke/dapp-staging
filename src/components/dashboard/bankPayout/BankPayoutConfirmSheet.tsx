"use client";

import { Building2, Pencil, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useModalOverlay } from "@/hooks/useModalOverlay";

interface BankPayoutConfirmSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  details: {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    recipientPhone: string;
    amountKES: number;
  };
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--ep-border)] last:border-0">
      <span className="text-xs font-medium text-[var(--ep-muted)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--ep-heading)] text-right max-w-[60%] truncate">
        {value}
      </span>
    </div>
  );
}

export default function BankPayoutConfirmSheet({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  details,
}: BankPayoutConfirmSheetProps) {
  useModalOverlay(isOpen);


  const formattedAmount = details.amountKES.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-overlay flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.96, y: 32, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 32, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="bg-[var(--ep-bg-card)] w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-[var(--ep-border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 pb-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--ep-accent-subtle)] rounded-full border border-[var(--ep-border)]/50">
                <Building2 size={15} className="text-[var(--ep-accent)]" />
                <span className="text-sm font-semibold text-[var(--ep-heading)]">Review Payout</span>
              </div>
              {!isSubmitting && (
                <button
                  onClick={onClose}
                  className="p-2 bg-[var(--ep-accent-subtle)] text-[var(--ep-muted)] hover:text-[var(--ep-heading)] rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="flex flex-col items-center px-6 pb-5 pt-1">
              <p className="text-xs font-medium text-[var(--ep-muted)] mb-1">You are sending</p>
              <p className="text-4xl font-extrabold text-[var(--ep-heading)] tracking-tight">
                KES {formattedAmount}
              </p>
              <p className="mt-1 text-xs text-[var(--ep-muted)]">to {details.bankName}</p>
            </div>

            <div className="relative w-full overflow-hidden flex justify-center mb-1">
              <div className="absolute inset-y-1/2 left-0 w-3 h-6 bg-black/60 rounded-r-full sm:hidden -translate-y-1/2" />
              <div className="w-full mx-6 border-t-[1.5px] border-dashed border-[var(--ep-border)]" />
              <div className="absolute inset-y-1/2 right-0 w-3 h-6 bg-black/60 rounded-l-full sm:hidden -translate-y-1/2" />
            </div>

            <div className="px-6 py-2">
              <Row label="Bank" value={`${details.bankName} (${details.bankCode})`} />
              <Row label="Account number" value={details.accountNumber} />
              <Row label="Amount" value={`KES ${formattedAmount}`} />
            </div>

            <div className="mx-6 mb-4 mt-1 p-2.5 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20">
              <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                Please double-check your account number and bank before confirming.
                Payouts to incorrect details cannot be reversed.
              </p>
            </div>

            <div className="p-4 pt-0 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-full py-3 text-sm font-semibold text-[var(--ep-body)] bg-[var(--ep-bg-input)] hover:bg-[var(--ep-border)] transition-colors disabled:opacity-40"
              >
                <Pencil size={13} />
                Edit details
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isSubmitting}
                className="flex-[2] flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white bg-[var(--ep-accent)] hover:bg-[var(--ep-accent-hover)] shadow-[0_2px_16px_rgba(67,57,202,0.25)] transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Approving…
                  </>
                ) : (
                  "Confirm & Approve"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}