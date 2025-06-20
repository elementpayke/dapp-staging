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

  // Debug logging for status changes
  React.useEffect(() => {
    console.log("ProgressPopup - Status changed to:", status, "Message:", statusMessage);
  }, [status, statusMessage]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
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
      {status === "success" && transactionDetails && (
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
          <AnimatePresence mode="wait">
            {activeTab === "details" && (
              <motion.div
                key="details-tab"
                className="text-left mt-2 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">
                    {transactionDetails.amount} {transactionDetails.currency}
                  </span>
                </div>

                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Recipient:</span>
                  <span className="font-medium">
                    {transactionDetails.recipient || "N/A"}
                  </span>
                </div>

                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">
                    {transactionDetails.paymentMethod || "Mobile Money"}
                  </span>
                </div>

                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                    {formatToLocal(transactionDetails.date || fallbackDate)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
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
                </div>
              </div>

              {/* Download options */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
            )}
          </AnimatePresence>

          {/* Receipt Tab */}
          <AnimatePresence mode="wait">
            {activeTab === "receipt" && (
              <motion.div
                key="receipt-tab"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="mt-2 mb-4"
                ref={receiptRef}
              >
              <div className="bg-white border-0 rounded-2xl shadow-2xl overflow-hidden relative backdrop-blur-sm">
                {/* Decorative Header Pattern - Enhanced */}
                <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 opacity-90"></div>
                <div className="absolute top-3 left-0 right-0 h-1 bg-gradient-to-r from-emerald-200 via-blue-200 to-purple-200 opacity-60"></div>
                
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}></div>
                </div>
                
                {/* Receipt Header - Enhanced */}
                <div className="px-8 py-6 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 relative">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <motion.div 
                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-xl ring-4 ring-white/50"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", damping: 15 }}
                      >
                        <span className="text-white font-bold text-xl tracking-wide">
                          {branding.companyName?.charAt(0) || "E"}
                        </span>
                      </motion.div>
                      <div>
                        <div className="text-2xl font-bold text-gray-800 tracking-tight">
                          {branding.companyName}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center mt-1">
                          <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full mr-3 animate-pulse shadow-sm"></div>
                          <span className="font-medium">Official Payment Receipt</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Receipt ID</div>
                      <div className="text-sm font-mono font-bold bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                        {transactionDetails.receiptNumber || "R-" + Date.now().toString().slice(-6)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Banner - Enhanced */}
                <div className="px-8 py-6 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-l-4 border-emerald-400 relative overflow-hidden">
                  {/* Animated background elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full opacity-20 -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-100 rounded-full opacity-30 translate-y-12 -translate-x-12"></div>
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center space-x-4">
                      <motion.div 
                        className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 tracking-tight">
                          {branding.receiptTitle || "Payment Receipt"}
                        </h3>
                        <div className="flex items-center mt-2">
                          <motion.div 
                            className="w-3 h-3 bg-emerald-400 rounded-full mr-3 shadow-sm"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          ></motion.div>
                          <span className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                            {transactionDetails.paymentStatus || "Completed Successfully"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-emerald-600 tracking-tight">
                        {transactionDetails.amount || "0"}{" "}
                        <span className="text-xl font-bold text-gray-600">
                          {transactionDetails.currency || "KES"}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Total Amount</div>
                    </div>
                  </div>
                </div>

                {/* Payment Information - Enhanced */}
                <div className="px-8 py-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                        <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Transaction Date
                        </div>
                        <div className="text-base font-bold text-gray-800 flex items-center">
                          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3 shadow-md">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          {formatToLocal(transactionDetails.date || fallbackDate)}
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                        <div className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Recipient
                        </div>
                        <div className="text-base font-bold text-gray-800 flex items-center">
                          <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3 shadow-md">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          {transactionDetails.recipient || "N/A"}
                        </div>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                        <div className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2 flex items-center">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Payment Method
                        </div>
                        <div className="text-base font-bold text-gray-800 flex items-center">
                          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3 shadow-md">
                            <CreditCard size={16} className="text-white" />
                          </div>
                          {transactionDetails.paymentMethod || "Mobile Money"}
                        </div>
                      </div>

                      {transactionDetails.customerName && (
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100">
                          <div className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Customer
                          </div>
                          <div className="text-base font-bold text-gray-800 flex items-center">
                            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3 shadow-md">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            {transactionDetails.customerName}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>

                {/* Transaction Details - Enhanced */}
                <div className="px-8 py-6 bg-gradient-to-br from-slate-50 to-gray-50">
                  <motion.div 
                    className="text-base font-bold text-gray-700 mb-4 flex items-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    Transaction Details
                  </motion.div>
                  <motion.div 
                    className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-lg relative overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-50 -translate-y-10 translate-x-10"></div>
                    
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3 flex items-center relative z-10">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Transaction ID
                    </div>
                    <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200 relative z-10">
                      <div className="text-sm font-mono text-gray-700 break-all flex-1 mr-4 select-all">
                        {transactionDetails.transactionHash || "Generating..."}
                      </div>
                      <motion.button
                        onClick={() => copyToClipboard(transactionDetails.transactionHash || "")}
                        className="flex-shrink-0 text-gray-500 hover:text-gray-700 focus:outline-none p-2 hover:bg-gray-200 rounded-lg transition-all duration-200 group"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {copied ? (
                          <CheckCheck size={16} className="text-emerald-600" />
                        ) : (
                          <Copy size={16} className="group-hover:text-blue-600" />
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                </div>

                {/* Summary Section - Enhanced */}
                <div className="px-8 py-6 border-t border-gray-200">
                  <motion.div 
                    className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100 relative overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {/* Animated background pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 left-0 w-32 h-32 bg-blue-400 rounded-full -translate-x-16 -translate-y-16"></div>
                      <div className="absolute bottom-0 right-0 w-24 h-24 bg-purple-400 rounded-full translate-x-12 translate-y-12"></div>
                    </div>
                    
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-700">Transaction Summary</div>
                          <div className="text-sm text-gray-600 mt-1 flex items-center">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                            Processed on {formatToLocal(transactionDetails.date || fallbackDate)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Final Amount</div>
                        <div className="text-2xl font-black text-blue-600 tracking-tight">
                          {transactionDetails.amount || "0"} 
                          <span className="text-lg font-bold text-gray-600 ml-1">
                            {transactionDetails.currency || "KES"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Receipt Footer - Enhanced */}
                <div className="px-8 py-6 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 border-t border-gray-200 relative">
                  {/* Decorative bottom border */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 opacity-60"></div>
                  
                  <div className="text-center space-y-4">
                    <motion.div 
                      className="flex items-center justify-center space-x-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-lg font-bold text-gray-700">
                        {branding.footerMessage || "Thank you for your business!"}
                      </span>
                    </motion.div>
                    
                    <div className="text-sm text-gray-600 leading-relaxed">
                      For questions about this transaction, please contact our customer support team
                    </div>
                    
                    <motion.div 
                      className="flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-gray-200"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      <div className="flex items-center space-x-2 text-emerald-600">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <span className="text-xs font-semibold uppercase tracking-wide">Secure</span>
                      </div>
                      <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                      <div className="flex items-center space-x-2 text-blue-600">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-xs font-semibold uppercase tracking-wide">Verified</span>
                      </div>
                      <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                      <div className="flex items-center space-x-2 text-purple-600">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-xs font-semibold uppercase tracking-wide">Encrypted</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Download options for receipt view - Enhanced */}
              <motion.div 
                className="mt-8 p-6 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 rounded-2xl border border-gray-200 relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                {/* Decorative background */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-400 rounded-full translate-y-12 -translate-x-12"></div>
                </div>
                
                <div className="text-center space-y-4 relative z-10">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                      <Download size={16} className="text-white" />
                    </div>
                    <div className="text-lg font-bold text-gray-700">Export & Share Receipt</div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <motion.button
                      onClick={printReceipt}
                      className="flex items-center justify-center gap-3 px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-lg border border-gray-200 font-semibold min-w-[140px] group"
                      whileHover={{ scale: 1.05, y: -3, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Printer size={18} className="group-hover:text-blue-600 transition-colors" />
                      <span>Print Receipt</span>
                    </motion.button>

                    <motion.button
                      onClick={downloadReceiptAsImage}
                      className="flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-xl font-semibold min-w-[140px] relative overflow-hidden group"
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Animated shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700 transform -translate-x-full"></div>
                      <Download size={18} className="relative z-10" />
                      <span className="relative z-10">Download</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
            )}
          </AnimatePresence>
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
