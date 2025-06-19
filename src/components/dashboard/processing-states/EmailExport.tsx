import { motion } from "framer-motion";
import { Loader2, CheckCheck, Mail } from "lucide-react";
import React from "react";

interface EmailExportProps {
  emailInput: string;
  setEmailInput: (val: string) => void;
  sendReceiptViaEmail: () => void;
  sendingEmail: boolean;
  emailSent: boolean;
}

export const EmailExport: React.FC<EmailExportProps> = ({ emailInput, setEmailInput, sendReceiptViaEmail, sendingEmail, emailSent }) => (
  <div className="flex items-center relative w-full mt-2">
    <input
      type="email"
      value={emailInput}
      onChange={(e) => setEmailInput(e.target.value)}
      placeholder="Enter email address"
      className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
    />
    <button
      onClick={sendReceiptViaEmail}
      disabled={!emailInput || sendingEmail}
      className={`flex items-center gap-1 px-3 py-2 ${emailSent ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} rounded-r-md transition-colors text-sm whitespace-nowrap`}
    >
      {sendingEmail ? (
        <Loader2 size={14} className="animate-spin" />
      ) : emailSent ? (
        <CheckCheck size={14} />
      ) : (
        <Mail size={14} />
      )}
      <span>{emailSent ? "Sent" : "Email"}</span>
    </button>
  </div>
);
