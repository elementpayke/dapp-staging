import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck, Copy, Mail } from "lucide-react";
import React from "react";

interface TechnicalDetailsProps {
  show: boolean;
  transactionHash: string;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setShow: (show: boolean) => void;
}

export const TechnicalDetails: React.FC<TechnicalDetailsProps> = ({ show, transactionHash, copied, copyToClipboard, setShow }) => (
  <div className="mt-6">
    <button
      onClick={() => setShow(!show)}
      className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <span className="text-sm text-gray-700 font-medium">Technical Details</span>
      <motion.svg
        className={`w-4 h-4 text-gray-500 transform transition-transform ${show ? "rotate-180" : ""}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        animate={{ rotate: show ? 180 : 0 }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </motion.svg>
    </button>
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-2 bg-gray-50 rounded-lg overflow-hidden"
        >
          <div className="p-3">
            <div className="text-xs text-gray-500 mb-1">Transaction ID</div>
            <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-200">
              <div className="text-xs font-mono text-gray-700 break-all flex-1">{transactionHash || "N/A"}</div>
              <button
                onClick={() => copyToClipboard(transactionHash || "")}
                className="flex-shrink-0 text-gray-500 hover:text-gray-700 focus:outline-none p-1 hover:bg-gray-100 rounded transition-colors"
              >
                {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
