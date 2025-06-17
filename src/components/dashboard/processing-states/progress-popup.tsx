import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  CreditCard,
  CheckCheck,
  Copy,
  FileText,
  Printer,
  Download,
  Mail,
} from "lucide-react";
import React, { RefObject } from "react";
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="flex flex-col items-center text-center relative z-10">
      <motion.div
        className="w-20 h-20 mb-6 flex items-center justify-center rounded-full"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {status === "processing" && (
          <div className="relative">
            {/* Pulsing rings */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`ring-${i}`}
                className="absolute inset-0 rounded-full border-4 border-blue-500 opacity-0"
                animate={{
                  scale: [1, 1.5, 2],
                  opacity: [0.3, 0.15, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.4,
                  ease: "easeOut",
                }}
              />
            ))}

            {/* Glowing background */}
            <motion.div
              className="absolute inset-0 rounded-full bg-blue-100 opacity-70"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
              }}
            />

            {/* Spinning loader */}
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.05, 1],
              }}
              transition={{
                rotate: {
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                },
                scale: {
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                },
              }}
            >
              <Loader2 className="w-12 h-12 text-blue-600" />
            </motion.div>
          </div>
        )}

        {status === "success" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.1,
            }}
            className="bg-green-100 rounded-full p-4 relative"
          >
            {/* Success animation with drawing effect */}
            <svg
              className="w-12 h-12 text-green-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
              <motion.path
                d="M22 4L12 14.01l-3-3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              />
            </svg>

            {/* Radial glow effect */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(74,222,128,0.4) 0%, rgba(74,222,128,0) 70%)",
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.2 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            />
          </motion.div>
        )}

        {status === "failed" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full px-4"
          >
            {/* Error severity indicator with animation */}
            <div className="flex items-center justify-center mb-6">
              <motion.div
                className="bg-red-50 rounded-full p-4 relative"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
              >
                {/* Pulsing background effect */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-red-100"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <svg
                  className="w-10 h-10 text-red-500 relative z-10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.circle
                    cx="12"
                    cy="12"
                    r="10"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                  <motion.line
                    x1="15"
                    y1="9"
                    x2="9"
                    y2="15"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  />
                  <motion.line
                    x1="9"
                    y1="9"
                    x2="15"
                    y2="15"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3, delay: 0.8 }}
                  />
                </svg>
              </motion.div>
            </div>

            {/* Error message with improved typography */}
            <div className="text-center mb-8 break-words">
              <motion.h3
                className="text-2xl font-bold text-gray-900 mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Payment Failed
              </motion.h3>
              <motion.p
                className="text-gray-600 text-base break-words"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {statusMessage}
              </motion.p>
            </div>

            {/* Error details card with improved layout */}
            <motion.div
              className="bg-red-50 rounded-xl p-4 mb-6 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-red-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-red-800 mb-1">
                    What happened?
                  </h4>
                  <p className="text-sm text-red-700 leading-relaxed">
                    {transactionDetails.failureReason ||
                      "The payment could not be processed at this time."}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Action button */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <motion.button
                onClick={() =>
                  window.open("mailto:support@elementpay.com", "_blank")
                }
                className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium flex items-center justify-center"
              >
                <Mail size={16} className="mr-2" />
                Contact Support
              </motion.button>
            </motion.div>

            {/* Technical details with improved collapsible UI */}
            <motion.div
              className="mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm text-gray-700 font-medium">
                  Technical Details
                </span>
                <motion.svg
                  className={`w-4 h-4 text-gray-500 transform transition-transform ${
                    showTechnicalDetails ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  animate={{ rotate: showTechnicalDetails ? 180 : 0 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </motion.svg>
              </button>

              <AnimatePresence>
                {showTechnicalDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-2 bg-gray-50 rounded-lg overflow-hidden"
                  >
                    <div className="p-3">
                      <div className="text-xs text-gray-500 mb-1">
                        Transaction ID
                      </div>
                      <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-200">
                        <div className="text-xs font-mono text-gray-700 break-all flex-1">
                          {transactionDetails.transactionHash || "N/A"}
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              transactionDetails.transactionHash || ""
                            )
                          }
                          className="flex-shrink-0 text-gray-500 hover:text-gray-700 focus:outline-none p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          {copied ? (
                            <CheckCheck size={14} />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Additional help section */}
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              <p className="text-xs text-gray-500">
                Need immediate assistance? Our support team is available 24/7
              </p>
              <a
                href="tel:+254110919165"
                className="inline-block mt-1 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                +254110919165
              </a>
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      <motion.h3
        className="text-xl font-semibold mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {status === "processing"
          ? "Processing Payment"
          : status === "success"
          ? "Payment Successful"
          : "Payment Failed"}
      </motion.h3>

      <motion.p
        className="text-gray-600 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {statusMessage}
      </motion.p>

      {/* Progress bar with animated fill */}
      <motion.div
        className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className={`h-3 rounded-full ${
            status === "success"
              ? "bg-green-500"
              : status === "failed"
              ? "bg-red-500"
              : "bg-blue-600"
          }`}
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 200,
          }}
        />
      </motion.div>

      {/* Payment method icon animation */}
      {status === "processing" && (
        <motion.div
          className="mb-4 opacity-70"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.7, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <CreditCard className="w-6 h-6 text-gray-500" />
        </motion.div>
      )}

      {/* Transaction details tabs - only show on success */}
      {status === "success" && (
        <motion.div
          className="w-full"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Tabs for switching between transaction details and receipt */}
          <div className="flex border-b mb-4">
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "details"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("details")}
            >
              Transaction Details
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "receipt"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("receipt")}
            >
              Receipt
            </button>
          </div>

          {/* Transaction Details Tab */}
          {activeTab === "details" && (
            <motion.div
              className="text-left mt-2 mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <motion.div
                  className="flex justify-between mb-2"
                  variants={itemVariants}
                >
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">
                    {transactionDetails.amount} {transactionDetails.currency}
                  </span>
                </motion.div>

                <motion.div
                  className="flex justify-between mb-2"
                  variants={itemVariants}
                >
                  <span className="text-gray-600">Recipient:</span>
                  <span className="font-medium">
                    {transactionDetails.recipient || "N/A"}
                  </span>
                </motion.div>

                <motion.div
                  className="flex justify-between mb-2"
                  variants={itemVariants}
                >
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">
                    {transactionDetails.paymentMethod || "Mobile Money"}
                  </span>
                </motion.div>

                <motion.div
                  className="flex justify-between mb-2"
                  variants={itemVariants}
                >
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                    {formatToLocal(transactionDetails.date || fallbackDate)}
                  </span>
                </motion.div>

                <motion.div
                  className="flex justify-between items-center"
                  variants={itemVariants}
                >
                  <span className="text-gray-600">Transaction ID:</span>
                  <div className="flex items-center">
                    <span className="font-medium text-xs truncate max-w-[120px] md:max-w-[180px]">
                      {transactionDetails.transactionHash || "Pending"}
                    </span>
                    <motion.button
                      onClick={() =>
                        copyToClipboard(
                          transactionDetails.transactionHash || ""
                        )
                      }
                      className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
                    </motion.button>
                  </div>
                </motion.div>
              </div>

              {/* Download options */}
              <motion.div className="mt-6 space-y-2" variants={itemVariants}>
                <div className="text-sm text-gray-600 mb-2">
                  Export Receipt:
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <motion.button
                    onClick={printReceipt}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Printer size={14} />
                    <span>Print</span>
                  </motion.button>

                  <motion.button
                    onClick={downloadReceiptAsImage}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FileText size={14} />
                    <span>Image</span>
                  </motion.button>

                  {sendReceiptEmail && (
                    <motion.div
                      className="flex items-center relative w-full mt-2"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="Enter email address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      />
                      <button
                        onClick={sendReceiptViaEmail}
                        disabled={!emailInput || sendingEmail}
                        className={`flex items-center gap-1 px-3 py-2 ${
                          emailSent
                            ? "bg-green-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        } rounded-r-md transition-colors text-sm whitespace-nowrap`}
                      >
                        {sendingEmail ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : emailSent ? (
                          <CheckCheck size={14} />
                        ) : (
                          <Mail size={14} />
                        )}
                        <span>{emailSent ? "Sent" : "Email"}</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Receipt Tab */}
          {activeTab === "receipt" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-2 mb-4"
              ref={receiptRef}
            >
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                {/* Receipt Header */}
                <div className="border-b border-gray-100 p-4 flex justify-between items-center">
                  <div>
                    <div className="text-lg font-bold text-gray-800">
                      {branding.companyName}
                    </div>
                    <div className="text-xs text-gray-500">
                      Official Payment Receipt
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Receipt ID</div>
                    <div className="text-sm font-medium">
                      {transactionDetails.receiptNumber || "Pending"}
                    </div>
                  </div>
                </div>

                {/* Receipt Title */}
                <div className="p-4 text-center">
                  <h3 className="text-xl font-bold text-gray-800">
                    {branding.receiptTitle || "Payment Receipt"}
                  </h3>
                  <div className="mt-2 inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    {transactionDetails.paymentStatus || "Processing"}
                  </div>
                </div>

                {/* Payment Information */}
                <div className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    Payment Information
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500">Date</div>
                      <div className="text-sm">
                        {formatToLocal(transactionDetails.date || fallbackDate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Recipient</div>
                      <div className="text-sm">
                        {transactionDetails.recipient || "N/A"}
                      </div>
                    </div>
                    {transactionDetails.customerName && (
                      <div>
                        <div className="text-xs text-gray-500">Customer</div>
                        <div className="text-sm">
                          {transactionDetails.customerName}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="px-4 py-3 bg-gray-50 flex items-center">
                  <div className="w-8 h-8 rounded-md bg-blue-500 flex items-center justify-center text-white mr-3">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {transactionDetails.paymentMethod || "Mobile Money"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Processed on{" "}
                      {formatToLocal(transactionDetails.date || fallbackDate)}
                    </div>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="px-4 py-3 border-t border-gray-100">
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    Transaction Details
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Transaction ID
                    </div>
                    <div className="text-xs font-mono bg-gray-50 p-2 rounded border border-gray-100 break-all">
                      {transactionDetails.transactionHash || "Pending"}
                    </div>
                  </div>
                </div>

                {/* Total Amount */}
                <div className="px-4 py-3 border-t border-gray-100 text-right">
                  <div className="text-xs text-gray-500 mb-1">Total Amount</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {transactionDetails.amount || "0"}{" "}
                    {transactionDetails.currency || "KES"}
                  </div>
                </div>

                {/* Receipt Footer */}
                <div className="p-4 border-t border-gray-100 text-center">
                  <div className="text-sm text-gray-600">
                    {branding.footerMessage || "Thank you for your business!"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    For questions about this transaction, please contact
                    customer support.
                  </div>
                </div>
              </div>

              {/* Download options for receipt view */}
              <div className="mt-4 flex justify-center gap-2">
                <motion.button
                  onClick={printReceipt}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Printer size={14} />
                  <span>Print</span>
                </motion.button>

                <motion.button
                  onClick={downloadReceiptAsImage}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Download size={14} />
                  <span>Download</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Close button */}
      {status !== "processing" && (
        <motion.button
          onClick={onClose}
          className="px-6 py-2 mt-4 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-800 font-medium transition-colors"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05, backgroundColor: "#e5e7eb" }}
          whileTap={{ scale: 0.95 }}
        >
          Close
        </motion.button>
      )}
    </div>
  );
};

export default ProgressPopup;
