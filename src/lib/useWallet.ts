import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface WalletState {
  isConnected: boolean;
  address: string | null;
  ensName: string | null;
  usdcBalance: number;
  fetchUSDCBalance: () => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  setWalletData: (address: string | null, isConnected: boolean) => void;
  setUsdcBalance: (balance: number) => void;
  setConnected: (connected: boolean) => void;
  setAddress: (address: string | null) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      isConnected: false,
      address: null,
      ensName: null,
      usdcBalance: 0,
      fetchUSDCBalance: () => {},
      connectWallet: async () => {
        console.log("Connecting wallet...");
      },
      disconnectWallet: () => {
        try {
          set({
            isConnected: false,
            address: null,
            ensName: null,
            usdcBalance: 0,
          });
          localStorage.clear();
        } catch (error) {
          console.error("Error disconnecting wallet:", error);
        }
      },
      setWalletData: (address: string | null, isConnected: boolean) =>
        set({ address, isConnected }),
      setUsdcBalance: (balance: number) => set({ usdcBalance: balance }),
      setConnected: (connected) => set({ isConnected: connected }),
      setAddress: (address) => set({ address }),
      disconnect: () => set({ isConnected: false, address: null }),
    }),
    {
      name: "wallet-storage",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true, // This enables manual rehydration
    }
  )
);
