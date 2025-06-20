import { motion } from "framer-motion";
import React from "react";

interface CloseButtonProps {
  onClose: () => void;
}

const CloseButton: React.FC<CloseButtonProps> = ({ onClose }) => (
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
);

export default CloseButton;
