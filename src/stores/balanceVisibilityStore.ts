import { create } from "zustand";
import { persist } from "zustand/middleware";

export type HideMode = "blur" | "stars";

interface BalanceVisibilityState {
  balanceHidden: boolean;
  hideMode: HideMode;
  toggleBalanceHidden: () => void;
  setBalanceHidden: (value: boolean) => void;
  setHideMode: (mode: HideMode) => void;
}

export const useBalanceVisibilityStore = create<BalanceVisibilityState>()(
  persist(
    (set) => ({
      balanceHidden: false,
      hideMode: "blur",
      toggleBalanceHidden: () => set((s) => ({ balanceHidden: !s.balanceHidden })),
      setBalanceHidden: (value) => set({ balanceHidden: value }),
      setHideMode: (mode) => set({ hideMode: mode }),
    }),
    { name: "ep-balance-visibility" },
  ),
);
