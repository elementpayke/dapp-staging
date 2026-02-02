import { FC, useState } from "react";
import { X, Copy, ExternalLink, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

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

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Get status icon and styling
  const getStatusInfo = (status: string) => {
    switch (status.toUpperCase()) {
      case "SETTLED":
        return {
          icon: <CheckCircle className="w-6 h-6" />,
          color: "text-green-600",
          bgColor: "bg-green-50",
          label: "Success",
        };
      case "PENDING":
        return {
          icon: <Clock className="w-6 h-6" />,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          label: "Pending",
        };
      case "PROCESSING":
        return {
          icon: <Clock className="w-6 h-6" />,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          label: "Processing",
        };
      case "FAILED":
      case "REFUNDED":
        return {
          icon: <XCircle className="w-6 h-6" />,
          color: "text-red-600",
          bgColor: "bg-red-50",
          label: status === "FAILED" ? "Declined" : "Refunded",
        };
      default:
        return {
          icon: <AlertCircle className="w-6 h-6" />,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          label: status,
        };
    }
  };

  const statusInfo = getStatusInfo(transaction.status);

  // Open in explorer
  const openInExplorer = () => {
    if (transaction.fullHash && transaction.fullHash !== "—") {
      window.open(`https://basescan.org/tx/${transaction.fullHash}`, "_blank");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-900">
            Transaction Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Status Section */}
          <div className={`${statusInfo.bgColor} rounded-xl p-6 flex items-center justify-between`}>
            <div className="flex items-center gap-4">
              <div className={statusInfo.color}>{statusInfo.icon}</div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`text-2xl font-bold ${statusInfo.color}`}>
                  {statusInfo.label}
                </p>
              </div>
            </div>
            {transaction.processingTime && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Processing Time</p>
                <p className="text-lg font-semibold text-gray-900">
                  {transaction.processingTime}
                </p>
              </div>
            )}
          </div>

          {/* Amount Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">Fiat Amount</p>
              <p className="text-2xl font-bold text-gray-900">{transaction.amount}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">Crypto Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {transaction.cryptoAmount}
              </p>
            </div>
          </div>

          {/* Transaction Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Transaction Information</h3>
            
            <DetailRow
              label="Order ID"
              value={transaction.id}
              copyable
            />
            
            <DetailRow
              label="Type"
              value={transaction.orderType}
            />
            
            <DetailRow
              label="Direction"
              value={transaction.direction}
            />
            
            <DetailRow
              label="Date & Time"
              value={`${transaction.date} at ${transaction.time}`}
            />

            {transaction.exchangeRate && (
              <DetailRow
                label="Exchange Rate"
                value={`1 ${transaction.tokenSymbol} = ${transaction.exchangeRate.toFixed(2)} KES`}
              />
            )}

            <DetailRow
              label="Payment Method"
              value={transaction.paymentMethod}
            />

            {transaction.receiverDisplay !== "Unknown" && (
              <DetailRow
                label="Recipient"
                value={transaction.receiverDisplay}
              />
            )}

            {transaction.invoiceId && (
              <DetailRow
                label="Invoice ID"
                value={transaction.invoiceId}
                copyable
              />
            )}

            {transaction.receiptNumber && (
              <DetailRow
                label="Receipt Number"
                value={transaction.receiptNumber}
                copyable
              />
            )}
          </div>

          {/* Blockchain Info */}
          {transaction.fullHash !== "—" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Blockchain Information</h3>
              
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-2">Transaction Hash</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-sm font-mono text-gray-900 break-all flex-1">
                    {transaction.fullHash}
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
                    title="View on explorer"
                  >
                    <ExternalLink size={16} className="text-blue-600" />
                  </button>
                </div>
              </div>

              <DetailRow
                label="Network"
                value="Base"
              />
              
              <DetailRow
                label="Token"
                value={transaction.tokenSymbol}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 rounded-b-2xl">
          {transaction.fullHash !== "—" && (
            <button
              onClick={openInExplorer}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <ExternalLink size={18} />
              View on Explorer
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

// Detail Row Component
interface DetailRowProps {
  label: string;
  value: string;
  copyable?: boolean;
}

const DetailRow: FC<DetailRowProps> = ({ label, value, copyable }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-900 text-right max-w-xs break-words">
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
