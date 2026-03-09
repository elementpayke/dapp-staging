import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  ExternalLink,
  Download,
  Printer,
  Mail,
  CheckCheck,
  ChevronDown,
} from "lucide-react";
import React, { FC, RefObject, useState } from "react";
import { useProcessingPopupStore } from "@/lib/processingPopupStore";
import { formatToLocal } from "@/utils/helpers";

interface Branding {
  companyName?: string;
  receiptTitle?: string;
  footerMessage?: string;
}

interface ProgressPopupProps {
  onClose: () => void;
  copyToClipboard: (text: string) => void;
  printReceipt: () => void;
  downloadReceiptAsImage: () => void;
  sendReceiptEmail?: boolean;
  sendReceiptViaEmail: () => void;
  branding: Branding;
  receiptRef: RefObject<HTMLDivElement | null>;
}

// ── Shared DetailRow (matches TransactionDetailModal) ───────────────────────
interface DetailRowProps {
  label: string;
  value: string;
  copyable?: boolean;
  fullValue?: string;
}

const DetailRow: FC<DetailRowProps> = ({ label, value, copyable, fullValue }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullValue || value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm font-medium text-[var(--ep-muted)] whitespace-nowrap mr-4">
        {label}
      </span>
      <div className="flex items-center gap-2 min-w-0 justify-end">
        <span className="text-[13px] font-semibold text-[var(--ep-heading)] text-right truncate">
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

// ── Status helpers (same pattern as TransactionDetailModal) ─────────────────
const getStatusInfo = (status: string) => {
  switch (status) {
    case "success":
      return {
        icon: <CheckCircle className="w-6 h-6" />,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-500/10",
        borderColor: "border-green-200 dark:border-green-500/20",
        label: "Success",
      };
    case "failed":
      return {
        icon: <XCircle className="w-6 h-6" />,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-100 dark:bg-red-500/10",
        borderColor: "border-red-200 dark:border-red-500/20",
        label: "Declined",
      };
    default:
      return {
        icon: <Loader2 className="w-6 h-6 animate-spin" />,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-500/10",
        borderColor: "border-blue-200 dark:border-blue-500/20",
        label: "Processing",
      };
  }
};

const ProgressPopup: React.FC<ProgressPopupProps> = ({
  onClose,
  copyToClipboard,
  printReceipt,
  downloadReceiptAsImage,
  sendReceiptEmail,
  sendReceiptViaEmail,
  branding,
  receiptRef,
}) => {
  const {
    status,
    statusMessage,
    progress,
    copied,
    emailInput,
    sendingEmail,
    emailSent,
    activeTab,
    transactionDetails,
    fallbackDate,
    showTechnicalDetails,
    setEmailInput,
    setActiveTab,
    setShowTechnicalDetails,
  } = useProcessingPopupStore();

  const tx = transactionDetails || {};
  const date = tx.date || fallbackDate;
  const amount = tx.amount || "";
  const currency = tx.currency || tx.tokenSymbol || "";
  const recipient = tx.recipient || "";
  const paymentMethod = tx.paymentMethod || "Mobile Money";
  const receiptNumber = tx.mpesa_receipt_number || tx.receiptNumber || "";
  const txHash = tx.transactionHash || "";
  const tokenSymbol = tx.tokenSymbol || "";
  const tokenAmount = tx.tokenAmount || "";
  const network = tx.network || "";

  const statusInfo = getStatusInfo(status);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* ── Top action bar ─────────────────────────────────────────── */}
      <div className="flex justify-between items-center p-4 pb-0 bg-[var(--ep-bg-card)] shrink-0">
        <div />
        {status !== "processing" && (
          <button
            onClick={onClose}
            className="p-2 bg-[var(--ep-accent-subtle)] text-[var(--ep-muted)] hover:text-[var(--ep-heading)] rounded-full transition-colors ml-auto"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* ── Header section ─────────────────────────────────────────── */}
      <div className="flex flex-col items-center px-6 pt-2 pb-6 bg-[var(--ep-bg-card)] shrink-0">
        {/* Status icon */}
        <motion.div
          className={`p-3 rounded-full mb-3 ${statusInfo.bgColor} ${statusInfo.color}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          key={status}
        >
          {statusInfo.icon}
        </motion.div>

        {/* Processing: heading + message + progress bar */}
        {status === "processing" && (
          <>
            <motion.h3
              className="text-xl font-bold text-[var(--ep-heading)] tracking-tight mb-1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              Processing Payment
            </motion.h3>
            <motion.p
              className="text-sm text-[var(--ep-muted)] mb-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              {statusMessage}
            </motion.p>

            {/* Slim progress bar */}
            <div className="w-full max-w-[280px] bg-[var(--ep-accent-subtle)] rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="h-1.5 rounded-full bg-[var(--ep-accent)]"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", damping: 30, stiffness: 200 }}
              />
            </div>

            {/* Subtle pulsing dots */}
            <motion.div
              className="flex gap-1.5 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[var(--ep-accent)]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </>
        )}

        {/* Success: receipt-like header matching TransactionDetailModal */}
        {status === "success" && (
          <>
            <motion.div
              className="text-[var(--ep-muted)] text-sm mb-1 font-medium"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Sent to
            </motion.div>

            <motion.div
              className="text-xl md:text-2xl font-bold text-[var(--ep-accent)] text-center tracking-tight leading-tight w-full max-w-[85%] truncate mb-2"
              title={recipient}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {recipient || "Unknown Recipient"}
            </motion.div>

            <motion.div
              className="text-3xl font-extrabold text-[var(--ep-heading)] tracking-tight"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              {amount ? `-${amount} ${currency}` : ""}
            </motion.div>

            <motion.div
              className={`mt-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border ${statusInfo.color} ${statusInfo.bgColor} ${statusInfo.borderColor}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
            >
              {statusInfo.label}
            </motion.div>
          </>
        )}

        {/* Failed: clean error header */}
        {status === "failed" && (
          <>
            <motion.h3
              className="text-xl font-bold text-[var(--ep-heading)] tracking-tight mb-1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Payment Failed
            </motion.h3>

            <motion.div
              className={`mt-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border ${statusInfo.color} ${statusInfo.bgColor} ${statusInfo.borderColor}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
            >
              {statusInfo.label}
            </motion.div>
          </>
        )}
      </div>

      {/* ── Receipt Divider ────────────────────────────────────────── */}
      {status !== "processing" && (
        <div className="relative w-full overflow-hidden flex justify-center bg-[var(--ep-bg-card)] shrink-0">
          <div className="absolute inset-y-1/2 left-0 w-3 h-6 bg-black/60 rounded-r-full sm:hidden -translate-y-1/2" />
          <div className="w-full mx-6 border-t-[1.5px] border-dashed border-[var(--ep-border)]" />
          <div className="absolute inset-y-1/2 right-0 w-3 h-6 bg-black/60 rounded-l-full sm:hidden -translate-y-1/2" />
        </div>
      )}

      {/* ── Success Body ───────────────────────────────────────────── */}
      {status === "success" && transactionDetails && (
        <motion.div
          className="flex-1 min-h-0 overflow-y-auto bg-[var(--ep-bg-card)] custom-scrollbar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Tab bar */}
          <div className="flex border-b border-[var(--ep-border)] mx-6">
            <button
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "details"
                  ? "text-[var(--ep-accent)] border-b-2 border-[var(--ep-accent)]"
                  : "text-[var(--ep-muted)] hover:text-[var(--ep-heading)]"
              }`}
              onClick={() => setActiveTab("details")}
            >
              Details
            </button>
            <button
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "receipt"
                  ? "text-[var(--ep-accent)] border-b-2 border-[var(--ep-accent)]"
                  : "text-[var(--ep-muted)] hover:text-[var(--ep-heading)]"
              }`}
              onClick={() => setActiveTab("receipt")}
            >
              Receipt
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "details" && (
              <motion.div
                key="details"
                className="px-6 py-5 space-y-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className="flex flex-col gap-3">
                  {amount && (
                    <DetailRow label="Amount" value={`${amount} ${currency}`} />
                  )}

                  {recipient && (
                    <DetailRow label="Recipient" value={recipient} />
                  )}

                  <DetailRow label="Payment Method" value={paymentMethod} />

                  {date && (
                    <DetailRow label="Date" value={formatToLocal(date)} />
                  )}

                  {tokenSymbol && tokenAmount && (
                    <DetailRow
                      label="Crypto Val"
                      value={`${tokenAmount} ${tokenSymbol}`}
                    />
                  )}

                  {receiptNumber && receiptNumber !== "N/A" && (
                    <DetailRow label="Ref Number" value={receiptNumber} copyable />
                  )}

                  {txHash && txHash !== "N/A" && txHash !== "Pending" && (
                    <DetailRow
                      label="Tx Hash"
                      value={`${txHash.substring(0, 8)}...${txHash.slice(-8)}`}
                      fullValue={txHash}
                      copyable
                    />
                  )}
                </div>

                {/* Export options */}
                <div className="mt-5 pt-4 border-t border-[var(--ep-border)]">
                  <div className="text-xs font-medium text-[var(--ep-muted)] mb-3 text-center">
                    Export Receipt
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={printReceipt}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-[var(--ep-heading)] bg-[var(--ep-accent-subtle)] rounded-xl hover:bg-[var(--ep-accent-muted)] transition-colors border border-[var(--ep-border)]/50"
                    >
                      <Printer size={15} /> Print
                    </button>
                    <button
                      onClick={downloadReceiptAsImage}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-[var(--ep-accent)] rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                    >
                      <Download size={15} /> Download
                    </button>
                  </div>

                  {/* Email receipt */}
                  {sendReceiptEmail && (
                    <div className="mt-3">
                      <div className="flex items-center rounded-xl border border-[var(--ep-border)] overflow-hidden bg-[var(--ep-bg-input)]">
                        <div className="pl-3 flex items-center text-[var(--ep-muted)]">
                          <Mail size={15} />
                        </div>
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="Email receipt to..."
                          className="flex-1 px-2 py-2.5 text-sm bg-transparent text-[var(--ep-heading)] placeholder:text-[var(--ep-muted)] outline-none"
                        />
                        <button
                          onClick={sendReceiptViaEmail}
                          disabled={!emailInput || sendingEmail}
                          className={`px-3.5 py-2.5 text-sm font-medium transition-colors ${
                            emailSent
                              ? "bg-green-500 text-white"
                              : "bg-[var(--ep-accent)] text-white hover:opacity-90"
                          } disabled:opacity-40`}
                        >
                          {sendingEmail ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : emailSent ? (
                            <CheckCheck size={15} />
                          ) : (
                            "Send"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "receipt" && (
              <motion.div
                key="receipt"
                className="px-6 py-5"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                {/* Printable receipt card */}
                <div
                  ref={receiptRef}
                  className="bg-[var(--ep-bg)] rounded-xl border border-[var(--ep-border)] p-5 text-left"
                >
                  {/* Receipt header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--ep-border)]">
                    <div>
                      <h4 className="text-base font-bold text-[var(--ep-heading)]">
                        {branding.companyName || "Element Pay"}
                      </h4>
                      <span className="text-xs text-[var(--ep-muted)]">
                        {branding.receiptTitle || "Payment Receipt"}
                      </span>
                    </div>
                    <div className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                      Settled
                    </div>
                  </div>

                  {/* Receipt body */}
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--ep-muted)]">Receipt #</span>
                      <span className="font-medium text-[var(--ep-heading)]">
                        {receiptNumber || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--ep-muted)]">Date</span>
                      <span className="font-medium text-[var(--ep-heading)]">
                        {formatToLocal(date)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--ep-muted)]">Recipient</span>
                      <span className="font-medium text-[var(--ep-heading)]">
                        {recipient || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--ep-muted)]">Payment Method</span>
                      <span className="font-medium text-[var(--ep-heading)]">
                        {paymentMethod}
                      </span>
                    </div>
                    {tokenSymbol && (
                      <div className="flex justify-between">
                        <span className="text-[var(--ep-muted)]">Token</span>
                        <span className="font-medium text-[var(--ep-heading)]">
                          {tokenSymbol}
                          {network ? ` on ${network}` : ""}
                        </span>
                      </div>
                    )}
                    {tokenAmount && (
                      <div className="flex justify-between">
                        <span className="text-[var(--ep-muted)]">Token Amount</span>
                        <span className="font-medium text-[var(--ep-heading)]">
                          {tokenAmount} {tokenSymbol}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between text-base font-bold mt-4 pt-3 border-t border-[var(--ep-border)]">
                    <span className="text-[var(--ep-heading)]">Total</span>
                    <span className="text-[var(--ep-heading)]">
                      {amount} {currency}
                    </span>
                  </div>

                  {/* Tx hash */}
                  {txHash && txHash !== "N/A" && (
                    <div className="mt-3 pt-2">
                      <div className="text-xs text-[var(--ep-muted)]">Transaction ID</div>
                      <div className="font-mono text-xs text-[var(--ep-accent)] break-all mt-0.5">
                        {txHash}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  {branding.footerMessage && (
                    <div className="mt-5 text-xs text-[var(--ep-muted)] text-center border-t border-[var(--ep-border)] pt-3">
                      {branding.footerMessage}
                    </div>
                  )}
                </div>

                {/* Print/Download outside receipt */}
                <div className="flex gap-2 justify-end mt-4">
                  <button
                    onClick={printReceipt}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-[var(--ep-heading)] bg-[var(--ep-accent-subtle)] rounded-xl hover:bg-[var(--ep-accent-muted)] transition-colors border border-[var(--ep-border)]/50"
                  >
                    <Printer size={15} /> Print
                  </button>
                  <button
                    onClick={downloadReceiptAsImage}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-[var(--ep-accent)] rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <Download size={15} /> Download
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Failed Body ────────────────────────────────────────────── */}
      {status === "failed" && (
        <motion.div
          className="px-6 py-5 bg-[var(--ep-bg-card)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Failure reason */}
          <div className="rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/15 p-4 mb-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">
                {transactionDetails?.failureReason ||
                  statusMessage ||
                  "The payment could not be processed at this time."}
              </p>
            </div>
          </div>

          {/* Technical Details toggle */}
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-[var(--ep-accent-subtle)] rounded-xl hover:bg-[var(--ep-accent-muted)] transition-colors mb-4"
          >
            <span className="text-sm text-[var(--ep-muted)]">Technical Details</span>
            <ChevronDown
              className={`w-4 h-4 text-[var(--ep-muted)] transform transition-transform ${
                showTechnicalDetails ? "rotate-180" : ""
              }`}
            />
          </button>
          <AnimatePresence>
            {showTechnicalDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mb-4"
              >
                <div className="bg-[var(--ep-accent-subtle)] rounded-xl p-3">
                  <div className="text-xs text-[var(--ep-muted)]">
                    Error: {transactionDetails?.failureReason || "CUST_TYPE_UNSUPPORTED"}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => window.open("mailto:support@elementpay.com", "_blank")}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--ep-accent)] text-white rounded-xl hover:opacity-90 transition-opacity font-medium shadow-sm text-sm"
            >
              <ExternalLink size={16} />
              Contact Support
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[var(--ep-accent-subtle)] text-[var(--ep-heading)] border border-[var(--ep-border)] rounded-xl hover:bg-[var(--ep-accent-muted)] transition-colors font-medium text-sm"
            >
              Close
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Processing: bottom padding ─────────────────────────────── */}
      {status === "processing" && <div className="pb-6" />}
    </div>
  );
};

export default ProgressPopup;
