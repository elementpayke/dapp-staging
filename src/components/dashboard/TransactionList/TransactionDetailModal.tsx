import React, { FC, useState, useRef, useCallback } from "react";
import { X, Copy, ExternalLink, CheckCircle, Clock, XCircle, AlertCircle, RotateCcw, Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import { getExplorerInfo } from "@/utils/explorerUtils";
import { SUPPORTED_TOKENS } from "@/constants/supportedTokens";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { formatAmount } from "@/utils/formatAmount";

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
    fee?: string | number;
    phoneNumber?: string;
    mpesaReceiptNumber?: string;
    [key: string]: any;
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

  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusInfo = (status: string) => {
    switch (status.toUpperCase()) {
      case "SETTLED":
        return {
          icon: <CheckCircle className="w-6 h-6" />,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-100 dark:bg-green-500/10",
          borderColor: "border-green-200 dark:border-green-500/20",
          label: "Success",
        };
      case "PENDING":
        return {
          icon: <Clock className="w-6 h-6" />,
          color: "text-yellow-600 dark:text-yellow-400",
          bgColor: "bg-yellow-100 dark:bg-yellow-500/10",
          borderColor: "border-yellow-200 dark:border-yellow-500/20",
          label: "Pending",
        };
      case "PROCESSING":
        return {
          icon: <Clock className="w-6 h-6" />,
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-100 dark:bg-blue-500/10",
          borderColor: "border-blue-200 dark:border-blue-500/20",
          label: "Processing",
        };
      case "FAILED":
      case "REFUNDED":
        return {
          icon: <XCircle className="w-6 h-6" />,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-100 dark:bg-red-500/10",
          borderColor: "border-red-200 dark:border-red-500/20",
          label: status === "FAILED" ? "Declined" : "Refunded",
        };
      default:
        return {
          icon: <AlertCircle className="w-6 h-6" />,
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-100 dark:bg-gray-500/10",
          borderColor: "border-gray-200 dark:border-gray-500/20",
          label: status,
        };
    }
  };

  const statusInfo = getStatusInfo(transaction.status);
  const explorerInfo =
    transaction.fullHash && transaction.fullHash !== "—"
      ? getExplorerInfo(transaction.tokenSymbol, transaction.fullHash)
      : null;

  // Attempt to find the full token object to retrieve its chain logo.
  const tokenMetadata = SUPPORTED_TOKENS.find(
    (t) => t.symbol === transaction.tokenSymbol || (explorerInfo && t.chain === explorerInfo.network)
  );

  const openInExplorer = () => {
    if (explorerInfo) window.open(explorerInfo.url, "_blank");
  };

  const setLandingForm = useOnboardingStore((s) => s.setLandingForm);
  const setInitiatedFromLanding = useOnboardingStore((s) => s.setInitiatedFromLanding);

  /** Pre-fill the SendCrypto modal with this transaction's details and close */
  const handleTransactAgain = () => {
    // Parse amount — strip " KES" suffix
    const rawAmount = transaction.amount?.replace(/\s*KES\s*/i, "").trim() || "";

    // Resolve token symbol from API format "USDC_BASE" → "USDC"
    const apiToken = transaction.tokenSymbol?.replace(/_/g, " ") || "";
    const [symbolPart, chainPart] = apiToken.split(" ");
    // Try to find a matching supported token for accurate symbol
    const matchedToken = SUPPORTED_TOKENS.find(
      (t) =>
        t.symbol.toLowerCase() === (symbolPart || "").toLowerCase() &&
        (!chainPart || t.chain.toLowerCase() === chainPart.toLowerCase()),
    );

    // Determine off-ramp method from payment method string
    const pm = (transaction.paymentMethod || "").toLowerCase();
    const offRampMethod = pm.includes("paybill") || pm.includes("pay bill")
      ? "PAYBILL" as const
      : pm.includes("till") || pm.includes("buy goods")
        ? "TILL" as const
        : "PHONE" as const;

    // Parse receiver: might be phone, "PayBill: 123 - Acc", "Till: 123", or a name
    let phoneNumber = "";
    let paybillNumber = "";
    let accountNumber = "";
    let tillNumber = "";
    const receiver = transaction.receiverDisplay || "";

    if (offRampMethod === "PAYBILL") {
      const parts = receiver.replace(/^PayBill:\s*/i, "").split(/\s*-\s*/);
      paybillNumber = parts[0]?.trim() || "";
      accountNumber = parts[1]?.trim() || "";
    } else if (offRampMethod === "TILL") {
      tillNumber = receiver.replace(/^Till:\s*/i, "").trim();
    } else {
      // Prefer the raw phone_number field from the API when available
      if (transaction.phoneNumber) {
        const raw = transaction.phoneNumber.replace(/\D/g, "");
        phoneNumber = raw.startsWith("254") ? raw.slice(3) : raw.startsWith("0") ? raw.slice(1) : raw;
      } else {
        // Fallback: extract digits from receiver display
        const digits = receiver.replace(/\D/g, "");
        if (digits.length >= 9) {
          phoneNumber = digits.startsWith("254") ? digits.slice(3) : digits.slice(-9);
        }
      }
    }

    setLandingForm({
      flow: "offramp",
      offRampMethod,
      amount: rawAmount,
      phoneNumber,
      paybillNumber,
      accountNumber,
      tillNumber,
      tokenSymbol: matchedToken?.symbol || symbolPart || null,
      initiatedFromLanding: true,
    });
    setInitiatedFromLanding(true);
    onClose();
  };

  /** Download a styled receipt as PNG */
  const handleDownloadReceipt = useCallback(async () => {
    if (!receiptRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(receiptRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `ElementPay-Receipt-${transaction.receiptNumber || transaction.id || "tx"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("[Receipt] Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading, transaction.receiptNumber, transaction.id]);

  const isReceive = transaction.direction === 'Receive';
  const amountSign = isReceive ? '+' : '-';

  // Strip the " KES" suffix and apply proper thousands formatting
  const parsedAmount = formatAmount(transaction.amount?.replace(/\s*KES\s*/i, "").trim());

  // Crypto amount: strip the token symbol suffix, format with 6 decimal places
  const parsedCryptoAmount = formatAmount(transaction.cryptoAmount?.split(" ")[0], 6);

  return (
    <div
      className="fixed inset-0 z-overlay flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-[var(--ep-bg-card)] w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-[var(--ep-border)] max-h-[75vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-5 sm:slide-in-from-bottom-0 sm:fade-in-0 sm:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top action bar */}
        <div className="flex justify-between items-center p-4 pb-0 bg-[var(--ep-bg-card)]">
           {explorerInfo && tokenMetadata ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--ep-accent-subtle)] rounded-full mr-auto shadow-sm border border-[var(--ep-border)]/50">
                 <img src={tokenMetadata.chainLogo} alt={explorerInfo.network} className="w-5 h-5 object-contain rounded-full bg-white shadow-sm" />
                 <span className="text-sm font-semibold text-[var(--ep-heading)]">{explorerInfo.network}</span>
              </div>
           ) : <div />}

          <button
            onClick={onClose}
            className="p-2 bg-[var(--ep-accent-subtle)] text-[var(--ep-muted)] hover:text-[var(--ep-heading)] rounded-full transition-colors ml-auto"
          >
            <X size={20} />
          </button>
        </div>

        {/* Receipt Header */}
        <div className="flex flex-col items-center px-6 pt-2 pb-3 sm:pb-6 bg-[var(--ep-bg-card)]">
          <div className={`p-2 sm:p-3 rounded-full mb-2 sm:mb-3 ${statusInfo.bgColor} ${statusInfo.color}`}>
            {statusInfo.icon}
          </div>

          <div className="text-[var(--ep-muted)] text-sm mb-1 font-medium">
            {isReceive ? 'Received from' : 'Sent to'}
          </div>

          {transaction.receiverDisplay && transaction.receiverDisplay !== "Unknown" ? (
             <div className="text-xl md:text-2xl font-bold text-[var(--ep-accent)] text-center tracking-tight leading-tight w-full max-w-[85%] truncate mb-2" title={transaction.receiverDisplay}>
                 {transaction.receiverDisplay}
             </div>
          ) : (
            <div className="text-xl md:text-2xl font-bold text-[var(--ep-heading)] tracking-tight mb-2">
                 Unknown Recipient
            </div>
          )}

          {/* Amount — formatted with thousands separators */}
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--ep-heading)] tracking-tight">
            {amountSign}KES {parsedAmount}
          </div>

          <div className={`mt-2 sm:mt-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border ${statusInfo.color} ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
            {statusInfo.label}
          </div>
        </div>

        {/* Receipt Divider line */}
        <div className="relative w-full overflow-hidden flex justify-center bg-[var(--ep-bg-card)]">
          <div className="absolute inset-y-1/2 left-0 w-3 h-6 bg-black/60 rounded-r-full sm:hidden -translate-y-1/2" />
          <div className="w-full mx-6 border-t-[1.5px] border-dashed border-[var(--ep-border)]" />
          <div className="absolute inset-y-1/2 right-0 w-3 h-6 bg-black/60 rounded-l-full sm:hidden -translate-y-1/2" />
        </div>

        {/* Body content */}
        <div className="px-6 py-4 sm:py-6 pb-6 sm:pb-8 space-y-4 flex-1 min-h-0 overflow-y-auto bg-[var(--ep-bg-card)] custom-scrollbar">
          <div className="flex flex-col gap-3.5">
            {/* M-Pesa Receipt — prominent, always visible when present */}
            {transaction.mpesaReceiptNumber && (
              <div className="flex items-center justify-between rounded-xl bg-[var(--ep-accent-muted)] px-3.5 py-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ep-accent)]">M-Pesa Receipt</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--ep-accent)] tracking-wide">{transaction.mpesaReceiptNumber}</span>
                  <CopyButton value={transaction.mpesaReceiptNumber} />
                </div>
              </div>
            )}

            {transaction.fee !== undefined && (
              <DetailRow label="Fee Charged" value={`KES ${formatAmount(transaction.fee)}`} />
            )}

            {/* Crypto value — 6 decimal places with thousands separator */}
            <DetailRow
              label="Crypto Val"
              value={`${parsedCryptoAmount} ${transaction.tokenSymbol?.replace(/_/g, " ") || ""}`}
            />

            <DetailRow label="Date" value={`${transaction.date} at ${transaction.time}`} />

            {(transaction.direction || transaction.orderType) && (
              <DetailRow label="Type" value={transaction.orderType || transaction.direction} />
            )}

            {transaction.exchangeRate && (
              <DetailRow
                label="Exchange Rate"
                value={`1 ${transaction.tokenSymbol} = KES ${formatAmount(transaction.exchangeRate)}`}
              />
            )}

            <DetailRow label="Payment Method" value={transaction.paymentMethod} />

            {/* Show receiptNumber as fallback if mpesaReceiptNumber is not available */}
            {!transaction.mpesaReceiptNumber && transaction.receiptNumber && (
              <DetailRow label="Ref Number" value={transaction.receiptNumber} copyable />
            )}

            {transaction.invoiceId && (
              <DetailRow label="Invoice ID" value={transaction.invoiceId} />
            )}

            {transaction.id && (
              <DetailRow
                label="Order ID"
                value={transaction.id.length > 20 ? `${transaction.id.substring(0, 10)}...${transaction.id.slice(-6)}` : transaction.id}
                fullValue={transaction.id}
                copyable
              />
            )}

            {transaction.fullHash && transaction.fullHash !== "—" && (
              <DetailRow
                label="Tx Hash"
                value={`${transaction.fullHash.substring(0, 8)}...${transaction.fullHash.slice(-8)}`}
                fullValue={transaction.fullHash}
                copyable
              />
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[var(--ep-bg)] border-t border-[var(--ep-border)] flex flex-col gap-2">
          {/* Outline action buttons row */}
          <div className="flex items-center gap-2">
            {/* Re-transact — only for outgoing (Send) transactions */}
            {!isReceive && (
              <button
                onClick={handleTransactAgain}
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-[var(--ep-accent)] border border-[var(--ep-accent)]/20 bg-[var(--ep-accent-muted)] hover:bg-[var(--ep-accent)]/15 hover:border-[var(--ep-accent)]/30 transition-all duration-200"
              >
                <RotateCcw size={13} />
                Transact Again
              </button>
            )}

            {/* Download receipt */}
            <button
              onClick={handleDownloadReceipt}
              disabled={isDownloading}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-[var(--ep-accent)] border border-[var(--ep-accent)]/20 bg-[var(--ep-accent-muted)] hover:bg-[var(--ep-accent)]/15 hover:border-[var(--ep-accent)]/30 transition-all duration-200 disabled:opacity-50 ml-auto"
            >
              {isDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              Receipt
            </button>
          </div>

          {transaction.fullHash !== "—" && explorerInfo && (
            <button
              onClick={openInExplorer}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--ep-accent)] text-white rounded-full hover:bg-[var(--ep-accent-hover)] shadow-[0_2px_16px_rgba(67,57,202,0.25)] hover:shadow-[0_4px_24px_rgba(67,57,202,0.35)] transition-all duration-200 text-sm font-semibold"
            >
              <ExternalLink size={16} />
              View on {explorerInfo.name}
            </button>
          )}
        </div>
      </div>

      {/* ── Off-screen receipt for PNG export ──────────────────────────── */}
      <div className="fixed" style={{ left: "-9999px", top: 0 }} aria-hidden>
        <ReceiptCard ref={receiptRef} transaction={transaction} statusInfo={statusInfo} />
      </div>
    </div>
  );
};

// ── Downloadable Receipt Card ──────────────────────────────────────────────
// Rendered off-screen and captured with html-to-image.

interface ReceiptCardProps {
  transaction: TransactionDetailModalProps["transaction"];
  statusInfo: {
    label: string;
    color: string;
    bgColor: string;
  };
}

const ReceiptCard = React.forwardRef<HTMLDivElement, ReceiptCardProps>(
  ({ transaction, statusInfo }, ref) => {
    // Strip " KES" and format with thousands separators
    const parsedAmount = formatAmount(transaction.amount?.replace(/\s*KES\s*/i, "").trim());
    const isReceive = transaction.direction === "Receive";
    const sign = isReceive ? "+" : "-";

    // Crypto amount formatted to 6 decimal places
    const parsedCryptoAmount = formatAmount(transaction.cryptoAmount?.split(" ")[0], 6);

    return (
      <div
        ref={ref}
        style={{
          width: 400,
          fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
          backgroundColor: "#ffffff",
          color: "#1A1A1A",
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        {/* Brand header bar */}
        <div
          style={{
            background: "linear-gradient(135deg, #4339CA 0%, #5B52E0 100%)",
            padding: "24px 28px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 5,
                  backgroundColor: "#ffffff",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "-0.02em",
              }}
            >
              ElementPay
            </span>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(255,255,255,0.7)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Transaction Receipt
          </span>
        </div>

        {/* Amount section */}
        <div style={{ padding: "28px 28px 20px", textAlign: "center" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#78716C",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: 6,
            }}
          >
            {isReceive ? "Amount Received" : "Amount Sent"}
          </div>
          {/* Amount with thousands separators */}
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: "#1A1A1A",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            {sign}KES {parsedAmount}
          </div>

          {/* Status badge */}
          <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
            <span
              style={{
                display: "inline-block",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                padding: "4px 14px",
                borderRadius: 100,
                backgroundColor:
                  statusInfo.label === "Success"
                    ? "#ecfdf5"
                    : statusInfo.label === "Declined" || statusInfo.label === "Refunded"
                      ? "#fef2f2"
                      : "#fffbeb",
                color:
                  statusInfo.label === "Success"
                    ? "#059669"
                    : statusInfo.label === "Declined" || statusInfo.label === "Refunded"
                      ? "#dc2626"
                      : "#d97706",
              }}
            >
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Dashed divider */}
        <div style={{ padding: "0 28px" }}>
          <div
            style={{
              borderTop: "1.5px dashed #E5E3EF",
            }}
          />
        </div>

        {/* Detail rows */}
        <div style={{ padding: "20px 28px 24px" }}>
          {transaction.receiverDisplay && transaction.receiverDisplay !== "Unknown" && (
            <ReceiptRow label={isReceive ? "From" : "To"} value={transaction.receiverDisplay} />
          )}

          <ReceiptRow label="Date & Time" value={`${transaction.date} at ${transaction.time}`} />

          {transaction.receiptNumber && (
            <ReceiptRow label="M-Pesa Receipt" value={transaction.receiptNumber} bold />
          )}

          <ReceiptRow label="Payment Method" value={transaction.paymentMethod} />

          {/* Crypto — formatted to 6 decimal places */}
          <ReceiptRow
            label="Crypto"
            value={`${parsedCryptoAmount} ${transaction.tokenSymbol?.replace(/_/g, " ") || ""}`}
          />

          {transaction.exchangeRate && (
            <ReceiptRow
              label="Rate"
              value={`1 ${transaction.tokenSymbol?.replace(/_/g, " ")} = KES ${formatAmount(transaction.exchangeRate)}`}
            />
          )}

          {transaction.fee !== undefined && (
            <ReceiptRow label="Fee" value={`KES ${formatAmount(transaction.fee)}`} />
          )}

          {transaction.id && (
            <ReceiptRow label="Order ID" value={transaction.id} mono />
          )}

          {transaction.fullHash && transaction.fullHash !== "—" && (
            <ReceiptRow
              label="Tx Hash"
              value={`${transaction.fullHash.substring(0, 12)}...${transaction.fullHash.slice(-10)}`}
              mono
            />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 28px",
            borderTop: "1px solid #E5E3EF",
            backgroundColor: "#FAF9FC",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 10, color: "#78716C" }}>
            elementpay.io
          </span>
          <span style={{ fontSize: 10, color: "#78716C" }}>
            {new Date().toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" })}
          </span>
        </div>
      </div>
    );
  },
);

ReceiptCard.displayName = "ReceiptCard";

/** Single row in the downloadable receipt */
const ReceiptRow: FC<{
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
}> = ({ label, value, bold, mono }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 0",
      borderBottom: "1px solid #f3f2f8",
    }}
  >
    <span style={{ fontSize: 12, fontWeight: 500, color: "#78716C" }}>{label}</span>
    <span
      style={{
        fontSize: 12,
        fontWeight: bold ? 700 : 600,
        color: bold ? "#4339CA" : "#1A1A1A",
        fontFamily: mono ? "'SF Mono', 'Cascadia Code', 'Consolas', monospace" : "inherit",
        maxWidth: 220,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        textAlign: "right",
      }}
    >
      {value}
    </span>
  </div>
);

// ── Inline Copy Button (used in the M-Pesa receipt highlight row) ────────────
const CopyButton: FC<{ value: string }> = ({ value }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1 hover:bg-[var(--ep-accent)]/10 rounded transition flex-shrink-0" title="Copy">
      {copied ? <CheckCircle size={13} className="text-green-500" /> : <Copy size={13} className="text-[var(--ep-accent)]" />}
    </button>
  );
};

// ── Detail Row Component ─────────────────────────────────────────────────────
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
      <span className="text-sm font-medium text-[var(--ep-muted)] whitespace-nowrap mr-4">{label}</span>
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

export default TransactionDetailModal;
