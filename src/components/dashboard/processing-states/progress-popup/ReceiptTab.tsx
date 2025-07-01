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
  const to =  tx.to || tx.recipient;
  const from = tx.from || tx.sender;
  const txHash = tx.txHash || tx.hash || tx.transactionHash;
  const status = tx.paymentStatus || tx.status || "Success";
  const paymentMethod = tx.paymentMethod || tx.method || "Mobile Money";
  const receiptNumber = tx.receiptNumber || tx.mpesa_receipt_number || "N/A";
  const customerName = tx.customerName || to || "N/A";
  const items = tx.items || [];
  const subtotal = tx.subtotal || amount || "N/A";
  const total = amount || subtotal;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="mt-2 mb-4"
      ref={receiptRef}
    >
      <div className="bg-white rounded-xl shadow-md border border-gray-200 max-w-lg mx-auto p-6 text-left">
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

        {/* Items Table */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">Items</div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-1 px-2 text-left font-semibold text-gray-700">Name</th>
                <th className="py-1 px-2 text-right font-semibold text-gray-700">Price</th>
                <th className="py-1 px-2 text-right font-semibold text-gray-700">Qty</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b last:border-b-0">
                    <td className="py-1 px-2">{item.name}</td>
                    <td className="py-1 px-2 text-right">{item.price} {currency}</td>
                    <td className="py-1 px-2 text-right">{item.quantity}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-1 px-2" colSpan={3}>No items</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex flex-col gap-1 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{subtotal} {currency}</span>
          </div>
        
          <div className="flex justify-between text-base font-bold border-t pt-2 mt-2">
            <span>Total</span>
            <span>{total} {currency}</span>
          </div>
        </div>

        {/* Transaction Hash/ID */}
        <div className="mb-4">
          <div className="text-xs text-gray-500">Transaction ID</div>
          <div className="font-mono text-xs text-blue-700 break-all">{txHash || "Pending"}</div>
        </div>

        {/* Print/Download Buttons */}
        <div className="flex gap-3 justify-end mt-6">
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

        {/* Footer message */}
        {branding.footerMessage && (
          <div className="mt-8 text-xs text-gray-400 text-center border-t pt-4">{branding.footerMessage}</div>
        )}
      </div>
    </motion.div>
  );
};

export default ReceiptTab;
