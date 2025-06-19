import { TransactionDetails } from "@/types/processing-popup";
import { create } from "zustand";

interface ProcessingPopupState {
  status: "processing" | "success" | "failed";
  statusMessage: string;
  progress: number;
  showConfetti: boolean;
  copied: boolean;
  emailInput: string;
  sendingEmail: boolean;
  emailSent: boolean;
  activeTab: "details" | "receipt";
  transactionDetails: TransactionDetails;
  fallbackDate: string;
  showTechnicalDetails: boolean;
  setStatus: (status: "processing" | "success" | "failed") => void;
  setStatusMessage: (message: string) => void;
  setProgress: (progress: number) => void;
  setShowConfetti: (show: boolean) => void;
  setCopied: (copied: boolean) => void;
  setEmailInput: (email: string) => void;
  setSendingEmail: (sending: boolean) => void;
  setEmailSent: (sent: boolean) => void;
  setActiveTab: (tab: "details" | "receipt") => void;
  setTransactionDetails: (details: TransactionDetails) => void;
  setFallbackDate: (date: string) => void;
  setShowTechnicalDetails: (show: boolean) => void;
  reset: (initialTransactionDetails: TransactionDetails) => void;
}

export const useProcessingPopupStore = create<ProcessingPopupState>((set) => ({
  status: "processing",
  statusMessage: "Processing your payment...",
  progress: 0,
  showConfetti: false,
  copied: false,
  emailInput: "",
  sendingEmail: false,
  emailSent: false,
  activeTab: "details",
  transactionDetails: {
    amount: "",
    currency: "",
    recipient: "",
    paymentMethod: "",
    transactionHash: "",
    date: "",
    receiptNumber: "",
    paymentStatus: "",
    status: 0,
  },
  fallbackDate: "",
  showTechnicalDetails: false,

  setStatus: (status) => {
    console.log("Store - Setting status to:", status);
    set({ status });
  },
  setStatusMessage: (statusMessage) => {
    console.log("Store - Setting status message to:", statusMessage);
    set({ statusMessage });
  },
  setProgress: (progress) => set({ progress }),
  setShowConfetti: (showConfetti) => set({ showConfetti }),
  setCopied: (copied) => set({ copied }),
  setEmailInput: (emailInput) => set({ emailInput }),
  setSendingEmail: (sendingEmail) => set({ sendingEmail }),
  setEmailSent: (emailSent) => set({ emailSent }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setTransactionDetails: (transactionDetails) => set({ transactionDetails }),
  setFallbackDate: (fallbackDate) => set({ fallbackDate }),
  setShowTechnicalDetails: (showTechnicalDetails) =>
    set({ showTechnicalDetails }),

  reset: (initialTransactionDetails) =>
    set({
      status: "processing",
      statusMessage: "Processing your payment...",
      progress: 0,
      showConfetti: false,
      copied: false,
      emailInput: "",
      sendingEmail: false,
      emailSent: false,
      activeTab: "details",
      showTechnicalDetails: false,
      transactionDetails: initialTransactionDetails,
    }),
}));
