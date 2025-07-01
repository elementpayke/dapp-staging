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
import StatusIcon from "./progress-popup/StatusIcon";
import StatusMessage from "./progress-popup/StatusMessage";
import ProgressBar from "./progress-popup/ProgressBar";
import Tabs from "./progress-popup/Tabs";
import TransactionDetailsTab from "./progress-popup/TransactionDetailsTab";
import ReceiptTab from "./progress-popup/ReceiptTab";
import CloseButton from "./progress-popup/CloseButton";
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

  // Temporary debug function to test success state
  const forceSuccessState = () => {
    if (status === "processing") {
      console.log("FORCE SUCCESS: Manually triggering success state for testing");
      const { setStatus, setStatusMessage, setProgress, setShowConfetti, setPopupLocked, setTransactionDetails } = useProcessingPopupStore.getState();
      
      const mockSuccessDetails = {
        ...transactionDetails,
        receiptNumber: "TEST123456",
        transactionHash: "0x123...abc",
        paymentStatus: "settled",
        status: 1,
      };
      
      setTransactionDetails(mockSuccessDetails);
      setStatus("success");
      setStatusMessage("Payment successful!");
      setProgress(100);
      setShowConfetti(true);
      setPopupLocked(true);
    }
  };

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
      {/* Status Icon */}
      <StatusIcon
        status={status}
        statusMessage={statusMessage}
        transactionDetails={transactionDetails}
        showTechnicalDetails={showTechnicalDetails}
        setShowTechnicalDetails={setShowTechnicalDetails}
      />

      {/* Status Message */}
      <StatusMessage status={status} statusMessage={statusMessage} />

      {/* Progress Bar */}
      <ProgressBar status={status} progress={progress} />

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

      {/* Debug button for testing - only show during processing */}
      {status === "processing" && process.env.NODE_ENV === "development" && (
        <motion.button
          onClick={forceSuccessState}
          className="mb-4 px-4 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          🔥 Force Success (Debug)
        </motion.button>
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
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Transaction Details Tab */}
          {activeTab === "details" && (
            <TransactionDetailsTab
              transactionDetails={transactionDetails}
              fallbackDate={fallbackDate}
              copyToClipboard={copyToClipboard}
              printReceipt={printReceipt}
              downloadReceiptAsImage={downloadReceiptAsImage}
              sendReceiptEmail={sendReceiptEmail}
              sendReceiptViaEmail={sendReceiptViaEmail}
              emailInput={emailInput}
              setEmailInput={setEmailInput}
              sendingEmail={sendingEmail}
              emailSent={emailSent}
              copied={copied}
            />
          )}

          {/* Receipt Tab */}
          {activeTab === "receipt" && (
            <ReceiptTab
              transactionDetails={transactionDetails}
              fallbackDate={fallbackDate}
              branding={branding}
              receiptRef={receiptRef}
              printReceipt={printReceipt}
              downloadReceiptAsImage={downloadReceiptAsImage}
            />
          )}
        </motion.div>
      )}

      {/* Close button */}
      {status !== "processing" && <CloseButton onClose={onClose} />}
    </div>
  );
};

export default ProgressPopup;
