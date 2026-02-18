import { FC, useState } from "react";
import { X, Copy, ExternalLink, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { getExplorerInfo } from "@/utils/explorerUtils";

interface TransactionDetailModalProps {
  transaction: {
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
    receiverName?: string;          // from orderData.receiver_name — e.g. "Anita Wambui"
    tokenSymbol: string;
    cryptoAmount: string;
    exchangeRate?: number;
    paymentMethod: string;
    direction: 'Send' | 'Receive';
    processingTime?: string;
    receiptNumber?: string;
    mpesaReceiptNumber?: string;    // from orderData.mpesa_receipt_number — the actual MPESA ID
    invoiceId?: string;
    orderType: string;
    rawDate?: Date;
  };
  isOpen: boolean;
  onClose: () => void;
}

const TransactionDetailModal: FC<TransactionDetailModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusInfo = (status: string) => {
    switch (status.toUpperCase()) {
      case "SETTLED":
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-100",
          label: "Success",
        };
      case "PENDING":
        return {
          icon: <Clock className="w-5 h-5" />,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-100",
          label: "Pending",
        };
      case "PROCESSING":
        return {
          icon: <Clock className="w-5 h-5" />,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-100",
          label: "Processing",
        };
      case "FAILED":
      case "REFUNDED":
        return {
          icon: <XCircle className="w-5 h-5" />,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-100",
          label: status === "FAILED" ? "Declined" : "Refunded",
        };
      default:
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-100",
          label: status,
        };
    }
  };

  const statusInfo = getStatusInfo(transaction.status);
  const explorerInfo =
    transaction.fullHash && transaction.fullHash !== "—"
      ? getExplorerInfo(transaction.tokenSymbol, transaction.fullHash)
      : null;

  const openInExplorer = () => {
    if (explorerInfo) window.open(explorerInfo.url, "_blank");
  };

  const hasBlockchain = transaction.fullHash !== "—" && explorerInfo;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-900">Transaction Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="p-6 space-y-6">

          {/* ── Summary Card ──────────────────────────────────────────────── */}
          {/* Row 1: Status | Fiat Amount | Crypto Amount */}
          {/* Row 2: Receiver Name (orderData.receiver_name) | MPESA ID (orderData.mpesa_receipt_number) */}
          <div className={`${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-xl divide-y divide-gray-200`}>

            {/* Row 1 */}
            <div className="grid grid-cols-3 divide-x divide-gray-200">
              {/* Status */}
              <div className="flex items-center gap-2.5 px-4 py-4">
                <span className={`flex-shrink-0 ${statusInfo.color}`}>{statusInfo.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 leading-none mb-0.5">Status</p>
                  <p className={`text-sm font-bold leading-snug ${statusInfo.color}`}>
                    {statusInfo.label}
                  </p>
                </div>
              </div>
              {/* Fiat Amount */}
              <div className="px-4 py-4">
                <p className="text-xs text-gray-500 mb-0.5">Fiat Amount</p>
                <p className="text-sm font-semibold text-gray-900 leading-snug">
                  {transaction.amount}
                </p>
              </div>
              {/* Crypto Amount */}
              <div className="px-4 py-4">
                <p className="text-xs text-gray-500 mb-0.5">Crypto Amount</p>
                <p className="text-sm font-semibold text-gray-900 leading-snug break-all">
                  {transaction.cryptoAmount}
                </p>
              </div>
            </div>

            {/* Row 2 — Receiver Name + MPESA ID (only if at least one is present) */}
            {/* Always shown for OffRamp. Falls back to phone number if registered
                M-Pesa name (receiver_name) is not yet available from backend. */}
            {(transaction.orderType === "OffRamp" || transaction.receiverName || transaction.mpesaReceiptNumber) && (
              <div className="grid grid-cols-2 divide-x divide-gray-200">
                {/* Receiver — shows name e.g. "Anita Wambui", falls back to phone */}
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-500 mb-0.5">Receiver</p>
                  <p className="text-sm font-semibold text-gray-900 leading-snug">
                    {transaction.receiverName || transaction.receiverDisplay || "—"}
                  </p>
                </div>
                {/* MPESA ID */}
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-500 mb-0.5">MPESA ID</p>
                  <p className="text-sm font-semibold text-gray-900 leading-snug">
                    {transaction.mpesaReceiptNumber ?? "—"}
                  </p>
                </div>
              </div>
            )}
          </div>
          {/* ─────────────────────────────────────────────────────────────── */}

          {/* ── Transaction Information ───────────────────────────────────── */}
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Transaction Information</h3>

            {/* Order ID — truncated on mobile */}
            <DetailRow
              label="Order ID"
              value={transaction.id}
              copyable
              truncate
            />

            {/* Type + orderType on same line — no Direction row */}
            <DetailRow label="Type" value={transaction.orderType} />

            {/* Payment Method */}
            <DetailRow label="Payment Method" value={transaction.paymentMethod} />

            {/* Recipient */}
            {transaction.receiverDisplay !== "Unknown" && (
              <DetailRow label="Recipient" value={transaction.receiverDisplay} />
            )}

    {/* Invoice ID */}
            {transaction.invoiceId && (
              <DetailRow label="Invoice ID" value={transaction.invoiceId} copyable />
            )}

            {/* ── Blockchain Information (moved up for priority) ──────────── */}
            {hasBlockchain && (
              <div className="pt-4 space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Blockchain Information</h3>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-2">Transaction Hash</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-sm font-mono text-gray-900 flex-1 break-all sm:break-normal" title={transaction.fullHash}>
                      {/* Truncated on mobile, full on desktop */}
                      <span className="sm:hidden">
                        {transaction.fullHash.length > 20
                          ? `${transaction.fullHash.slice(0, 10)}...${transaction.fullHash.slice(-6)}`
                          : transaction.fullHash}
                      </span>
                      <span className="hidden sm:inline">{transaction.fullHash}</span>
                    </code>
                    <button
                      onClick={() => copyToClipboard(transaction.fullHash)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition flex-shrink-0"
                      title="Copy hash"
                    >
                      <Copy size={16} className="text-gray-600" />
                    </button>
                    <button
                      onClick={openInExplorer}
                      className="p-2 hover:bg-gray-200 rounded-lg transition flex-shrink-0"
                      title={`View on ${explorerInfo!.name}`}
                    >
                      <ExternalLink size={16} className="text-blue-600" />
                    </button>
                  </div>
                </div>

                <DetailRow label="Network" value={explorerInfo!.network} />
                <DetailRow label="Token" value={transaction.tokenSymbol} />
              </div>
            )}

            {/* ── De-prioritised fields — moved to bottom ─────────────────── */}
            {transaction.exchangeRate && (
              <DetailRow
                label="Exchange Rate"
                value={`1 ${transaction.tokenSymbol} = ${transaction.exchangeRate.toFixed(2)} KES`}
              />
            )}

            <DetailRow
              label="Date & Time"
              value={`${transaction.date} at ${transaction.time}`}
            />
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 rounded-b-2xl">
          {hasBlockchain && (
            <button
              onClick={openInExplorer}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <ExternalLink size={18} />
              View on {explorerInfo!.name}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Detail Row Component ─────────────────────────────────────────────────────
interface DetailRowProps {
  label: string;
  value: string;
  copyable?: boolean;
  /** Truncates long values on small screens (e.g. Order ID) */
  truncate?: boolean;
}

const DetailRow: FC<DetailRowProps> = ({ label, value, copyable, truncate }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600 font-medium flex-shrink-0 mr-4">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`text-sm text-gray-900 text-right break-words ${
            truncate ? "truncate max-w-[120px] sm:max-w-xs" : "max-w-xs"
          }`}
          title={truncate ? value : undefined}
        >
          {value}
        </span>
        {copyable && (
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-gray-200 rounded transition flex-shrink-0"
            title="Copy"
          >
            {copied ? (
              <CheckCircle size={14} className="text-green-600" />
            ) : (
              <Copy size={14} className="text-gray-500" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default TransactionDetailModal;
