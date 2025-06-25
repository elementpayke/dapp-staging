  import { motion } from "framer-motion";
import React from "react";

interface ProgressBarProps {
  status: string;
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ status, progress }) => (
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
);

export default ProgressBar;
