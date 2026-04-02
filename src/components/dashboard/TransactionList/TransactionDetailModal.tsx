import { FC, useState } from "react";
import { X, Copy, ExternalLink, CheckCircle, Clock, XCircle, AlertCircle, RotateCcw } from "lucide-react";
import { getExplorerInfo } from "@/utils/explorerUtils";
import { SUPPORTED_TOKENS } from "@/constants/supportedTokens";
import { useOnboardingStore } from "@/stores/onboardingStore";

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
    fee?: string | number; // Added possible fee metadata
    [key: string]: any; // Allow indexing any random transaction metadata that slipped through
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
    const offRampMethod = pm.includes("paybill")
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
      // Try to extract phone from receiver (digits only, strip name)
      const digits = receiver.replace(/\D/g, "");
      if (digits.length >= 9) {
        phoneNumber = digits.startsWith("254") ? digits.slice(3) : digits.slice(-9);
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

  const isReceive = transaction.direction === 'Receive';
  const amountSign = isReceive ? '+' : '-';
  const parsedAmount = transaction.amount ? transaction.amount.replace(' KES', '') : transaction.amount;

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

          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--ep-heading)] tracking-tight">
            {amountSign}KE {parsedAmount}
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
            {transaction.fee !== undefined && (
              <DetailRow label="Fee Charged" value={`${transaction.fee}`} />
            )}

            <DetailRow label="Crypto Val" value={`${transaction.cryptoAmount?.split(' ')[0] || transaction.cryptoAmount} ${transaction.tokenSymbol?.replace(/_/g, ' ') || ''}`} />
            
            <DetailRow label="Date" value={`${transaction.date} at ${transaction.time}`} />
            
            {(transaction.direction || transaction.orderType) && (
              <DetailRow label="Type" value={transaction.orderType || transaction.direction} />
            )}
            
            {transaction.exchangeRate && (
              <DetailRow
                label="Exchange Rate"
                value={`1 ${transaction.tokenSymbol} = ${transaction.exchangeRate.toFixed(2)} KES`}
              />
            )}

            <DetailRow label="Payment Method" value={transaction.paymentMethod} />

            {transaction.receiptNumber && (
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
          {/* Re-transact — only for outgoing (Send) transactions */}
          {!isReceive && (
            <button
              onClick={handleTransactAgain}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium text-[var(--ep-body)] hover:text-[var(--ep-heading)] hover:bg-[var(--ep-accent-subtle)] transition-colors duration-150"
            >
              <RotateCcw size={15} />
              Transact Again
            </button>
          )}

          {transaction.fullHash !== "—" && explorerInfo && (
            <button
              onClick={openInExplorer}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--ep-accent)] text-white rounded-xl hover:opacity-90 transition-opacity font-medium shadow-sm"
            >
              <ExternalLink size={18} />
              View on {explorerInfo.name}
            </button>
          )}
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
