import { motion } from "framer-motion";
import { CreditCard, Download, Printer } from "lucide-react";
import React, { RefObject } from "react";
import { formatToLocal } from "@/utils/helpers";

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
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="mt-2 mb-4"
    ref={receiptRef}
  >
    {/* ...existing Receipt Tab content... */}
  </motion.div>
);

export default ReceiptTab;
