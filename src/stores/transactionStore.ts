/**
 * Transaction State Store - Zustand store for managing offramp transaction state
 *
 * This provides a centralized state machine for transaction lifecycle:
 * idle → validating → approving → signing → submitted → polling → settled | failed
 */

import { create } from "zustand";
import { SupportedToken } from "@/constants/supportedTokens";

export type TransactionPhase =
  | "idle"
  | "validating" // Validating form inputs
  | "switching-network" // Switching to correct network
  | "approving" // Token approval in progress
  | "signing" // Signing the message
  | "submitting" // Creating order on backend
  | "submitted" // Order created, waiting for settlement
  | "polling" // Polling for settlement (fallback)
  | "settled" // Order settled successfully
  | "failed"; // Transaction failed

export interface TransactionDetails {
  // Form data
  amount: string;
  amountFiat: number;
  amountToken: number;
  recipient: string;
  paymentMethod: "PHONE" | "PAYBILL" | "TILL";
  phoneNumber?: string;
  paybillNumber?: string;
  accountNumber?: string;
  tillNumber?: string;

  // Token/chain info
  token: SupportedToken | null;
  contractAddress: string;

  // Transaction data
  orderId: string | null;
  txHash: string | null;
  messageHash: string | null;

  // Receipt data
  mpesaReceiptNumber?: string;
  receiverName?: string;
  settledAt?: string;

  // Fee info
  feeAmount: number;
  effectiveRate: number;
}

export interface TransactionError {
  code: string;
  message: string;
  details?: any;
}

interface TransactionState {
  // Current phase
  phase: TransactionPhase;

  // Transaction details
  details: TransactionDetails;

  // Error state
  error: TransactionError | null;

  // Timestamps
  startedAt: number | null;
  completedAt: number | null;

  // Actions
  setPhase: (phase: TransactionPhase) => void;
  updateDetails: (updates: Partial<TransactionDetails>) => void;
  setError: (error: TransactionError | null) => void;
  start: (details: Partial<TransactionDetails>) => void;
  complete: (receipt?: Partial<TransactionDetails>) => void;
  fail: (error: TransactionError) => void;
  reset: () => void;
}

const initialDetails: TransactionDetails = {
  amount: "",
  amountFiat: 0,
  amountToken: 0,
  recipient: "",
  paymentMethod: "PHONE",
  token: null,
  contractAddress: "",
  orderId: null,
  txHash: null,
  messageHash: null,
  feeAmount: 0,
  effectiveRate: 0,
};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  phase: "idle",
  details: initialDetails,
  error: null,
  startedAt: null,
  completedAt: null,

  setPhase: (phase) => {
    console.log(`[TransactionStore] Phase: ${get().phase} → ${phase}`);
    set({ phase });
  },

  updateDetails: (updates) => {
    set((state) => ({
      details: { ...state.details, ...updates },
    }));
  },

  setError: (error) => set({ error }),

  start: (details) => {
    set({
      phase: "validating",
      details: { ...initialDetails, ...details },
      error: null,
      startedAt: Date.now(),
      completedAt: null,
    });
  },

  complete: (receipt) => {
    set((state) => ({
      phase: "settled",
      details: receipt ? { ...state.details, ...receipt } : state.details,
      completedAt: Date.now(),
    }));
  },

  fail: (error) => {
    console.error("[TransactionStore] Failed:", error);
    set({
      phase: "failed",
      error,
      completedAt: Date.now(),
    });
  },

  reset: () => {
    set({
      phase: "idle",
      details: initialDetails,
      error: null,
      startedAt: null,
      completedAt: null,
    });
  },
}));

// Selectors for common state derivations
export const selectIsProcessing = (state: TransactionState) =>
  !["idle", "settled", "failed"].includes(state.phase);

export const selectCanRetry = (state: TransactionState) =>
  state.phase === "failed";

export const selectProgress = (state: TransactionState): number => {
  const progressMap: Record<TransactionPhase, number> = {
    idle: 0,
    validating: 10,
    "switching-network": 20,
    approving: 40,
    signing: 60,
    submitting: 70,
    submitted: 80,
    polling: 85,
    settled: 100,
    failed: 0,
  };
  return progressMap[state.phase];
};

export const selectPhaseMessage = (state: TransactionState): string => {
  const messages: Record<TransactionPhase, string> = {
    idle: "",
    validating: "Validating transaction...",
    "switching-network": "Switching network...",
    approving: "Approve token spending in your wallet...",
    signing: "Sign the transaction in your wallet...",
    submitting: "Creating order...",
    submitted: "Transaction submitted! Waiting for settlement...",
    polling: "Checking settlement status...",
    settled: "Transaction complete!",
    failed: "Transaction failed",
  };
  return messages[state.phase];
};
