import { create } from "zustand";

interface LogoutOverlayState {
  /** When true, a full-screen loading overlay masks the transition. */
  isLoggingOut: boolean;
  setLoggingOut: (value: boolean) => void;
}

export const useLogoutOverlayStore = create<LogoutOverlayState>((set) => ({
  isLoggingOut: false,
  setLoggingOut: (value) => set({ isLoggingOut: value }),
}));
