import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import React from "react";

interface StatusIconProps {
  status: string;
  statusMessage: string;
  transactionDetails: any;
  showTechnicalDetails: boolean;
  setShowTechnicalDetails: (show: boolean) => void;
}

const StatusIcon: React.FC<StatusIconProps> = ({ status, statusMessage, transactionDetails }) => {
  return (
    <div className="mb-4">
      {status === "processing" && (
        <motion.div
          className="flex justify-center mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-16 h-16 text-blue-500" />
            </motion.div>
          </div>
        </motion.div>
      )}
      
      {status === "success" && (
        <motion.div
          className="flex justify-center mb-4"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
            >
              <CheckCircle className="w-16 h-16 text-green-500" />
            </motion.div>
            <motion.div
              className="absolute inset-0 rounded-full bg-green-100"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ delay: 0.3, duration: 1 }}
            />
          </div>
        </motion.div>
      )}
      
      {status === "failed" && (
        <motion.div
          className="flex justify-center mb-4"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <XCircle className="w-16 h-16 text-red-500" />
        </motion.div>
      )}
    </div>
  );
};

export default StatusIcon;
