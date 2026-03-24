/**
 * Lightweight store to expose PrivyAuthSync's internal state to other components.
 * Lets WalletStep / WalletChoiceStep detect when JWT sync has silently failed
 * so they can show a retry or fallback instead of spinning forever.
 */

import { create } from "zustand";

type AuthSyncStatus = "idle" | "loading" | "authenticated" | "failed";

interface AuthSyncState {
  status: AuthSyncStatus;
  setStatus: (status: AuthSyncStatus) => void;
  reset: () => void;
}

export const useAuthSyncStore = create<AuthSyncState>((set) => ({
  status: "idle",
  setStatus: (status) => set({ status }),
  reset: () => set({ status: "idle" }),
}));
