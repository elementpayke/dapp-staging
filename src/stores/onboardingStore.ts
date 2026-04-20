/**
 * Onboarding / Landing form state for auth/KYC sprint.
 * Persists preview form data so dashboard can pre-fill after login.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OnRampOffRampFlow = "offramp" | "onramp";

export type OffRampMethod = "PHONE" | "PAYBILL" | "TILL";

export interface LandingFormState {
  flow: OnRampOffRampFlow;
  offRampMethod: OffRampMethod;
  amount: string;
  amountFiat: number;
  currency: string;
  phoneNumber: string;
  paybillNumber: string;
  accountNumber: string;
  tillNumber: string;
  tokenSymbol: string | null;
  tokenChain: string | null;
  /** Set when user clicks CTA from landing (for analytics / pre-fill source) */
  initiatedFromLanding: boolean;
}

const defaultState: LandingFormState = {
  flow: "offramp",
  offRampMethod: "PHONE",
  amount: "",
  amountFiat: 0,
  currency: "KES",
  phoneNumber: "",
  paybillNumber: "",
  accountNumber: "",
  tillNumber: "",
  tokenSymbol: null,
  tokenChain: null,
  initiatedFromLanding: false,
};

export interface OnboardingStore extends LandingFormState {
  setFlow: (flow: OnRampOffRampFlow) => void;
  setOffRampMethod: (method: OffRampMethod) => void;
  setAmount: (amount: string, amountFiat?: number) => void;
  setPhoneNumber: (phone: string) => void;
  setPaybill: (paybillNumber: string, accountNumber: string) => void;
  setTillNumber: (till: string) => void;
  setTokenSymbol: (symbol: string | null) => void;
  setTokenChain: (chain: string | null) => void;
  setInitiatedFromLanding: (value: boolean) => void;
  setLandingForm: (state: Partial<LandingFormState>) => void;
  clearPersistedForm: () => void;
}

const STORAGE_KEY = "elementpay-onboarding-preview";

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      ...defaultState,

      setFlow: (flow) => set({ flow }),

      setOffRampMethod: (offRampMethod) => set({ offRampMethod }),

      setAmount: (amount, amountFiat) =>
        set((s) => ({
          amount,
          amountFiat: amountFiat ?? (amount ? parseFloat(amount) || 0 : s.amountFiat),
        })),

      setPhoneNumber: (phoneNumber) => set({ phoneNumber }),

      setPaybill: (paybillNumber, accountNumber) =>
        set({ paybillNumber, accountNumber }),

      setTillNumber: (tillNumber) => set({ tillNumber }),

      setTokenSymbol: (tokenSymbol) => set({ tokenSymbol }),

      setTokenChain: (tokenChain) => set({ tokenChain }),

      setInitiatedFromLanding: (initiatedFromLanding) =>
        set({ initiatedFromLanding }),

      setLandingForm: (state) => set((prev) => ({ ...prev, ...state })),

      clearPersistedForm: () => set(defaultState),
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        flow: s.flow,
        offRampMethod: s.offRampMethod,
        amount: s.amount,
        amountFiat: s.amountFiat,
        currency: s.currency,
        phoneNumber: s.phoneNumber,
        paybillNumber: s.paybillNumber,
        accountNumber: s.accountNumber,
        tillNumber: s.tillNumber,
        tokenSymbol: s.tokenSymbol,
        tokenChain: s.tokenChain,
        initiatedFromLanding: s.initiatedFromLanding,
      }),
    }
  )
);
