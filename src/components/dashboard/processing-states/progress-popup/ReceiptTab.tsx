import { motion } from "framer-motion";
import { CreditCard, Download, Printer } from "lucide-react";
import React, { RefObject } from "react";
import { formatToLocal} from "@/utils/helpers";

interface ReceiptTabProps {
  transactionDetails: any;
  fallbackDate: string;
  branding: any;
  receiptRef: RefObject<HTMLDivElement | null>;
  printReceipt: () => void;
  downloadReceiptAsImage: () => void;
}

const ReceiptTab: React.FC<ReceiptTabProps> = ({
  transactionDetails,
  fallbackDate,
  branding,
  receiptRef,
  printReceipt,
  downloadReceiptAsImage,
}) => {
  const tx = transactionDetails || {};
  const date = tx.date || fallbackDate;
  const amount = tx.amount || tx.value;
  const currency = tx.currency || tx.tokenSymbol || tx.assetSymbol;
  const tokenSymbol = tx.tokenSymbol || tx.assetSymbol || "USDC"; // Get the actual token symbol
  const tokenAmount = tx.tokenAmount || "0"; // Get the token amount
  const network = tx.network || "Base"; // Get the network/chain information
  const to = tx.recipient || tx.to; // Prioritize recipient (receiver_name) over to (phone number)
  const from = tx.from || tx.sender;
  const txHash = tx.txHash || tx.hash || tx.transactionHash;
  const status = tx.paymentStatus || tx.status || "Success";
  const paymentMethod = tx.paymentMethod || tx.method || "Mobile Money";
  const receiptNumber = tx.receiptNumber || tx.mpesa_receipt_number || "N/A";
  const customerName = tx.customerName || to || "N/A";
  const items = tx.items || [];
  const subtotal = tx.subtotal || amount || "N/A";
  const total = amount || subtotal;

  // Debug logging to track recipient display
  React.useEffect(() => {
    console.log("🧾 ReceiptTab - Recipient display logic:", {
      recipient: tx.recipient,
      to: tx.to,
      finalDisplayedRecipient: to,
      customerName,
      hasRecipient: !!tx.recipient,
      hasTo: !!tx.to
    });
  }, [tx.recipient, tx.to, to, customerName]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="mt-2 mb-4"
    >
      {/* Receipt content for printing/downloading - excludes buttons */}
      <div ref={receiptRef} className="bg-white rounded-xl shadow-md border border-gray-200 max-w-lg mx-auto p-6 text-left">
        {/* Header: Logo and Company Name */}
        <div className="flex items-center justify-between mb-4">
          {branding.logo && (
            <img src={branding.logo} alt="Logo" className="h-10 w-auto mr-2" />
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800">{branding.companyName || "Element Pay"}</h2>
            <div className="text-xs text-gray-400 font-medium">{branding.receiptTitle || "Payment Receipt"}</div>
          </div>
          <CreditCard className="text-blue-500 w-8 h-8" />
        </div>

        {/* Receipt Info */}
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">Receipt #:</span> {receiptNumber}
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-semibold">Date:</span> {formatToLocal(date)}
          </div>
          <div className={`text-xs px-2 py-1 rounded font-semibold ${status?.toLowerCase() === "settled" || status === 1 || status?.toLowerCase() === "success" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
            {status?.toString().charAt(0).toUpperCase() + status?.toString().slice(1)}
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <div className="text-xs text-gray-500">Customer</div>
              <div className="font-medium text-gray-800">{customerName}</div>
            </div>
      
            <div>
              <div className="text-xs text-gray-500">Payment Method</div>
              <div className="font-medium text-gray-800">{paymentMethod}</div>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2">Transaction Details</div>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Token</span>
              <span className="font-medium text-gray-800">{tokenSymbol} on {network}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Token Amount</span>
              <span className="font-medium text-gray-800">{tokenAmount} {tokenSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Fiat Amount</span>
              <span className="font-medium text-gray-800">{amount} {currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Recipient</span>
              <span className="font-medium text-gray-800">{to || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Total Amount */}
        <div className="flex justify-between text-base font-bold border-t pt-2 mb-4">
          <span>Total Amount</span>
          <span>{amount} {currency}</span>
        </div>

        {/* Transaction Hash/ID */}
        <div className="mb-4">
          <div className="text-xs text-gray-500">Transaction ID</div>
          <div className="font-mono text-xs text-blue-700 break-all">{txHash || "Pending"}</div>
        </div>

        {/* Footer message */}
        {branding.footerMessage && (
          <div className="mt-8 text-xs text-gray-400 text-center border-t pt-4">{branding.footerMessage}</div>
        )}
      </div>

      {/* Print/Download Buttons - Outside receipt content */}
      <div className="flex gap-3 justify-end mt-4 max-w-lg mx-auto">
        <button
          onClick={printReceipt}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-200 font-medium shadow-sm"
        >
          <Printer size={16} /> Print
        </button>
        <button
          onClick={downloadReceiptAsImage}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium shadow-md"
        >
          <Download size={16} /> Download
        </button>
      </div>
    </motion.div>
  );
};

export default ReceiptTab;
