import { motion } from "framer-motion";
import { Printer, FileText } from "lucide-react";
import React, { PropsWithChildren } from "react";

interface DownloadOptionsProps {
  printReceipt: () => void;
  downloadReceiptAsImage: () => void;
}

export const DownloadOptions: React.FC<PropsWithChildren<DownloadOptionsProps>> = ({ printReceipt, downloadReceiptAsImage, children }) => (
  <div className="mt-6 space-y-2">
    <div className="text-sm text-gray-600 mb-2">Export Receipt:</div>
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
      {children}
    </div>
  </div>
);
