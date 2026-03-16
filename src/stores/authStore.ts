/**
 * Auth store — manages authentication state and user profile.
 * Tokens are stored server-side in HTTP-only cookies (never in client JS).
 * Persisted to localStorage so sessions survive page reloads.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/services/auth";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AuthStep = "email" | "otp" | "wallet-choice" | "wallet" | "wallet-linking";

export type WalletPreference = "embedded" | "external" | null;

interface AuthState {
  /** Authenticated user profile */
  user: AuthUser | null;
  /** Derived convenience flag: OTP verified */
  isOtpVerified: boolean;
  /** Derived convenience flag: wallet registered */
  isWalletRegistered: boolean;
  /** Derived convenience flag: both OTP and wallet registered */
  isAuthenticated: boolean;
  /** Email entered during auth flow (kept for OTP step) */
  pendingEmail: string | null;
  /** OTP entered during auth flow (kept for wallet step verification) */
  pendingOTP: string | null;
  /** Timestamp (epoch ms) when the last OTP was requested — survives browser restart */
  otpRequestedAt: number | null;
  /** All wallet addresses linked to this account */
  connectedWallets: string[];
  /** User's wallet type selection — persists across modal close/reopen */
  walletPreference: WalletPreference;
  /** RS256 JWT for Privy auth — ephemeral, NOT persisted */
  privyToken: string | null;
}

interface AuthActions {
  /** Store user profile after successful verify-OTP */
  setAuth: (user: AuthUser) => void;
  /** Set wallet registration status */
  setWalletRegistered: (registered: boolean) => void;
  /** Clear all auth state (logout) */
  clearAuth: () => void;
  /** Update user's KYC status after SmileLinks callback */
  updateKYCStatus: (status: AuthUser["kyc_status"]) => void;
  /** Store email during auth flow */
  setPendingEmail: (email: string) => void;
  /** Store OTP during auth flow */
  setPendingOTP: (otp: string) => void;
  /** Record when an OTP was requested (epoch ms) */
  setOtpRequestedAt: (ts: number) => void;
  /** Clear pending auth flow data */
  clearPending: () => void;
  /** Add a wallet address to the connected wallets array (deduped) */
  addConnectedWallet: (address: string) => void;
  /** Remove a wallet address from the connected wallets array */
  removeConnectedWallet: (address: string) => void;
  /** Set user's wallet type preference (embedded vs external) */
  setWalletPreference: (pref: WalletPreference) => void;
  /** Store the pre-fetched RS256 Privy token (ephemeral) */
  setPrivyToken: (token: string | null) => void;
}

export type AuthStore = AuthState & AuthActions;

const STORAGE_KEY = "elementpay-auth";

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // ── State ──────────────────────────────────────────────────────────
      user: null,
      isOtpVerified: false,
      isWalletRegistered: false,
      isAuthenticated: false,
      pendingEmail: null,
      pendingOTP: null,
      otpRequestedAt: null,
      connectedWallets: [],
      walletPreference: null,
      privyToken: null,

      // ── Actions ────────────────────────────────────────────────────────

      setAuth: (user) =>
        set((state) => ({
          user,
          isOtpVerified: true,
          // isWalletRegistered will be set after wallet registration
          isWalletRegistered: state.isWalletRegistered,
          isAuthenticated: true && state.isWalletRegistered, // Only true if both are true
          pendingEmail: null,
          pendingOTP: null,
          otpRequestedAt: null,
        })),

      setWalletRegistered: (registered: boolean) =>
        set((state) => ({
          isWalletRegistered: registered,
          isAuthenticated: state.isOtpVerified && registered,
        })),

      clearAuth: () =>
        set({
          user: null,
          isOtpVerified: false,
          isWalletRegistered: false,
          isAuthenticated: false,
          pendingEmail: null,
          pendingOTP: null,
          otpRequestedAt: null,
          connectedWallets: [],
          walletPreference: null,
          privyToken: null,
        }),

      updateKYCStatus: (status) =>
        set((s) => ({
          user: s.user ? { ...s.user, kyc_status: status } : null,
        })),

      setPendingEmail: (email) => set({ pendingEmail: email }),

      setPendingOTP: (otp) => set({ pendingOTP: otp }),

      setOtpRequestedAt: (ts) => set({ otpRequestedAt: ts }),

      clearPending: () => set({ pendingEmail: null, pendingOTP: null, otpRequestedAt: null }),

      addConnectedWallet: (address) =>
        set((s) => ({
          connectedWallets: s.connectedWallets.includes(address)
            ? s.connectedWallets
            : [...s.connectedWallets, address],
        })),

      removeConnectedWallet: (address) =>
        set((s) => ({
          connectedWallets: s.connectedWallets.filter((a) => a !== address),
        })),

      setWalletPreference: (pref) => set({ walletPreference: pref }),

      setPrivyToken: (token) => set({ privyToken: token }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        user: s.user,
        isOtpVerified: s.isOtpVerified,
        isWalletRegistered: s.isWalletRegistered,
        isAuthenticated: s.isAuthenticated,
        pendingEmail: s.pendingEmail,
        otpRequestedAt: s.otpRequestedAt,
        connectedWallets: s.connectedWallets,
        walletPreference: s.walletPreference,
      }),
    },
  ),
);
