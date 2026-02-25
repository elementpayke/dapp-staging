/**
 * Auth store — manages authentication state, tokens, and user profile.
 * Persisted to localStorage so sessions survive page reloads.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/services/auth";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AuthStep = "email" | "otp" | "wallet";

interface AuthState {
  /** JWT access token from backend */
  token: string | null;
  /** Refresh token */
  refreshToken: string | null;
  /** Authenticated user profile */
  user: AuthUser | null;
  /** Derived convenience flag */
  isAuthenticated: boolean;
  /** Email entered during auth flow (kept for OTP step) */
  pendingEmail: string | null;
  /** OTP entered during auth flow (kept for wallet step verification) */
  pendingOTP: string | null;
  /** All wallet addresses linked to this account */
  connectedWallets: string[];
}

interface AuthActions {
  /** Store credentials after successful verify-OTP */
  setAuth: (token: string, user: AuthUser, refreshToken?: string) => void;
  /** Clear all auth state (logout) */
  clearAuth: () => void;
  /** Update user's KYC status after SmileLinks callback */
  updateKYCStatus: (status: AuthUser["kyc_status"]) => void;
  /** Update the access token (e.g. after refresh) */
  setToken: (token: string) => void;
  /** Store email during auth flow */
  setPendingEmail: (email: string) => void;
  /** Store OTP during auth flow */
  setPendingOTP: (otp: string) => void;
  /** Clear pending auth flow data */
  clearPending: () => void;
  /** Add a wallet address to the connected wallets array (deduped) */
  addConnectedWallet: (address: string) => void;
  /** Remove a wallet address from the connected wallets array */
  removeConnectedWallet: (address: string) => void;
}

export type AuthStore = AuthState & AuthActions;

const STORAGE_KEY = "elementpay-auth";

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // ── State ──────────────────────────────────────────────────────────
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      pendingEmail: null,
      pendingOTP: null,
      connectedWallets: [],

      // ── Actions ────────────────────────────────────────────────────────
      setAuth: (token, user, refreshToken) =>
        set({
          token,
          refreshToken: refreshToken ?? null,
          user,
          isAuthenticated: true,
          pendingEmail: null,
          pendingOTP: null,
        }),

      clearAuth: () =>
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          pendingEmail: null,
          pendingOTP: null,
          connectedWallets: [],
        }),

      updateKYCStatus: (status) =>
        set((s) => ({
          user: s.user ? { ...s.user, kyc_status: status } : null,
        })),

      setToken: (token) => set({ token }),

      setPendingEmail: (email) => set({ pendingEmail: email }),

      setPendingOTP: (otp) => set({ pendingOTP: otp }),

      clearPending: () => set({ pendingEmail: null, pendingOTP: null }),

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
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        token: s.token,
        refreshToken: s.refreshToken,
        user: s.user,
        isAuthenticated: s.isAuthenticated,
        connectedWallets: s.connectedWallets,
      }),
    },
  ),
);
