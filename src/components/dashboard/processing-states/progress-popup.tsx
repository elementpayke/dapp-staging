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

      {/* Transaction details tabs - only show on success */}
      {status === "success" && (
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
