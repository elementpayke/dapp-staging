import { motion } from "framer-motion";
import React from "react";

interface StatusMessageProps {
  status: string;
  statusMessage: string;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ status, statusMessage }) => (
  <>
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
  </>
);

export default StatusMessage;
