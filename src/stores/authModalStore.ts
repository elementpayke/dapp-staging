/**
 * Auth modal store — controls the visibility and current step of the AuthModal.
 * Separated from authStore to keep UI state out of persisted auth data.
 */

import { create } from "zustand";
import type { AuthStep } from "./authStore";

interface AuthModalState {
  isOpen: boolean;
  step: AuthStep;
  /** True while Privy's wallet modal is on screen — hides our modal so it doesn't block Privy's portal. */
  walletConnecting: boolean;
}

interface AuthModalActions {
  openAuthModal: () => void;
  closeAuthModal: () => void;
  setStep: (step: AuthStep) => void;
  setWalletConnecting: (v: boolean) => void;
  reset: () => void;
}

export type AuthModalStore = AuthModalState & AuthModalActions;

export const useAuthModalStore = create<AuthModalStore>((set) => ({
  isOpen: false,
  step: "email",
  walletConnecting: false,

  openAuthModal: () => set({ isOpen: true, step: "email" }),
  closeAuthModal: () => set((s) => ({ isOpen: false, walletConnecting: s.walletConnecting })),
  setStep: (step) => set({ step }),
  setWalletConnecting: (walletConnecting) => set({ walletConnecting }),
  reset: () => set({ isOpen: false, step: "email", walletConnecting: false }),
}));
