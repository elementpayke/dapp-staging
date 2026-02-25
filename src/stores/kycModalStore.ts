/**
 * KYC Modal store — controls the visibility and state of the KYCRequiredModal
 * which is shown when a transaction is rejected because the user exceeded
 * their limit and needs to complete KYC verification.
 */

import { create } from "zustand";
import type { KYCLimitSnapshot } from "@/services/kycError";

interface KYCModalState {
  isOpen: boolean;
  /** SmileID KYC URL fetched from /kyc/initiate. */
  kycUrl: string | null;
  /** KYC reference ID returned by /kyc/initiate. */
  kycRefId: string | null;
  /** Optional limit details from backend LIMIT_EXCEEDED payload. */
  limitSnapshot: KYCLimitSnapshot | null;
  /** True while loading the KYC link. */
  loading: boolean;
  /** Error message if KYC link fetch failed. */
  error: string | null;
}

interface KYCModalActions {
  openKYCModal: (limitSnapshot?: KYCLimitSnapshot | null) => void;
  closeKYCModal: () => void;
  setKycLink: (url: string, refId: string) => void;
  setLimitSnapshot: (limitSnapshot: KYCLimitSnapshot | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export type KYCModalStore = KYCModalState & KYCModalActions;

export const useKYCModalStore = create<KYCModalStore>((set) => ({
  isOpen: false,
  kycUrl: null,
  kycRefId: null,
  limitSnapshot: null,
  loading: false,
  error: null,

  openKYCModal: (limitSnapshot = null) =>
    set({
      isOpen: true,
      kycUrl: null,
      kycRefId: null,
      limitSnapshot,
      loading: false,
      error: null,
    }),
  closeKYCModal: () => set({ isOpen: false }),
  setKycLink: (kycUrl, kycRefId) => set({ kycUrl, kycRefId, loading: false, error: null }),
  setLimitSnapshot: (limitSnapshot) => set({ limitSnapshot }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  reset: () =>
    set({
      isOpen: false,
      kycUrl: null,
      kycRefId: null,
      limitSnapshot: null,
      loading: false,
      error: null,
    }),
}));
