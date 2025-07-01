import { motion } from "framer-motion";
import { CheckCheck, Copy, FileText, Mail, Printer, Loader2 } from "lucide-react";
import React from "react";
import { formatToLocal, formatReceiverName } from "@/utils/helpers";

interface TransactionDetailsTabProps {
  transactionDetails: any;
  fallbackDate: string;
  copyToClipboard: (text: string) => void;
  printReceipt: () => void;
  downloadReceiptAsImage: () => void;
  sendReceiptEmail?: boolean;
  sendReceiptViaEmail: () => void;
  emailInput: string;
  setEmailInput: (val: string) => void;
  sendingEmail: boolean;
  emailSent: boolean;
  copied: boolean;
}

const TransactionDetailsTab: React.FC<TransactionDetailsTabProps> = ({
  transactionDetails,
  fallbackDate,
  copyToClipboard,
  printReceipt,
  downloadReceiptAsImage,
  sendReceiptEmail,
  sendReceiptViaEmail,
  emailInput,
  setEmailInput,
  sendingEmail,
  emailSent,
  copied,
}) => {
  const tx = transactionDetails || {};
  const date = tx.date || fallbackDate;
  const amount = tx.amount || tx.value;
  const currency = tx.currency || tx.tokenSymbol || tx.assetSymbol;
  const to = formatReceiverName(tx.to || tx.recipient);
  const from = tx.from || tx.sender;
  const txHash = tx.txHash || tx.hash || tx.transactionHash;
  const status = tx.status || "Success";
  const paymentMethod = tx.paymentMethod || tx.method;
  const receiptNumber = tx.receiptNumber || tx.mpesa_receipt_number;
  const paymentStatus = tx.paymentStatus || status;

  return (
    <motion.div
      className="text-left mt-2 mb-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Amount:</span>
          <span className="font-medium">
            {amount} {currency}
          </span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Recipient:</span>
          <span className="font-medium">{to || "N/A"}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Payment Method:</span>
          <span className="font-medium">{paymentMethod || "Mobile Money"}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Date:</span>
          <span className="font-medium">{formatToLocal(date)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Transaction ID:</span>
          <div className="flex items-center">
            <span className="font-medium text-xs truncate max-w-[120px] md:max-w-[180px]">
              {txHash || "Pending"}
            </span>
            <motion.button
              onClick={() => copyToClipboard(txHash)}
              className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
            </motion.button>
          </div>
        </div>
      </div>
      {/* Download/Export Section */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
        <div className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-center">
          <svg
            className="w-4 h-4 text-blue-600 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export Receipt
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <motion.button
            onClick={printReceipt}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200 font-medium"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Printer size={16} />
            <span>Print</span>
          </motion.button>
          <motion.button
            onClick={downloadReceiptAsImage}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md font-medium"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            <FileText size={16} />
            <span>Download</span>
          </motion.button>
          {sendReceiptEmail && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center mb-2">
                <Mail size={16} className="text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Email Receipt</span>
              </div>
              <motion.div
                className="flex items-center relative"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium"
                />
                <button
                  onClick={sendReceiptViaEmail}
                  disabled={!emailInput || sendingEmail}
                  className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm whitespace-nowrap transition-all duration-200 rounded-r-lg ${
                    emailSent
                      ? "bg-green-500 text-white"
                      : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
                  }`}
                >
                  {sendingEmail ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : emailSent ? (
                    <CheckCheck size={16} />
                  ) : (
                    <Mail size={16} />
                  )}
                  <span>{emailSent ? "Sent" : "Send"}</span>
                </button>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TransactionDetailsTab;
