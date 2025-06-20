import { motion } from "framer-motion";
import { CheckCheck, Copy, FileText, Mail, Printer, Loader2 } from "lucide-react";
import React from "react";
import { formatToLocal } from "@/utils/helpers";

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

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

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
}) => (
  <motion.div
    className="text-left mt-2 mb-4"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
  >
    {/* ...existing Transaction Details Tab content... */}
  </motion.div>
);

export default TransactionDetailsTab;
