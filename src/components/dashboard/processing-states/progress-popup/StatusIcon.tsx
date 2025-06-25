import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import React from "react";

interface StatusIconProps {
  status: string;
  statusMessage: string;
  transactionDetails: any;
  showTechnicalDetails: boolean;
  setShowTechnicalDetails: (show: boolean) => void;
}

const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  // ...existing code for status icon rendering (processing, success, failed)...
  // Copy the icon rendering logic from the main file here
  return (
    <>
      {/* ...status icon rendering logic... */}
    </>
  );
};

export default StatusIcon;
