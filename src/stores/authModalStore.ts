/**
 * Auth modal store - controls visibility and current step of the auth modal.
 * UI-only state is kept separate from persisted auth state.
 */

import { create } from "zustand";
import type { AuthStep } from "./authStore";

interface AuthModalState {
  isOpen: boolean;
  step: AuthStep;
  /** True while Privy wallet modal is open, so our modal does not block it. */
  walletConnecting: boolean;
  /** Optional auth flow error shown in the modal. */
  errorMessage: string | null;
}

interface AuthModalActions {
  /** Open modal and always start at "email" step */
  openAuthModal: () => void;
  /** Re-open modal at its current step (for resuming OTP→wallet flow) */
  resumeAuthModal: () => void;
  /** Close modal AND reset walletConnecting (user-initiated close) */
  closeAuthModal: () => void;
  /** Close modal visibility only — keeps walletConnecting intact (programmatic hide) */
  hideModal: () => void;
  setStep: (step: AuthStep) => void;
  setWalletConnecting: (v: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  reset: () => void;
}

export type AuthModalStore = AuthModalState & AuthModalActions;

export const useAuthModalStore = create<AuthModalStore>((set) => ({
  isOpen: false,
  step: "email",
  walletConnecting: false,
  errorMessage: null,

  openAuthModal: () =>
    set({ isOpen: true, step: "email", walletConnecting: false, errorMessage: null }),
  resumeAuthModal: () =>
    set({ isOpen: true }),
  closeAuthModal: () =>
    set({ isOpen: false, walletConnecting: false, errorMessage: null }),
  hideModal: () =>
    set({ isOpen: false }),
  setStep: (step) => set({ step }),
  setWalletConnecting: (walletConnecting) => set({ walletConnecting }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  reset: () =>
    set({ isOpen: false, step: "email", walletConnecting: false, errorMessage: null }),
}));
