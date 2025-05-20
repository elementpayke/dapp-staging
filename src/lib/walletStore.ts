import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useRouter } from "next/navigation";
import { useAccount, useEnsName, useBalance } from "wagmi";
import { useEffect } from "react";

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
        const router = useRouter();
        router.push("/dashboard");
      },
      disconnectWallet: () => {
        const router = useRouter();
        set({
          isConnected: false,
          address: null,
          ensName: null,
          usdcBalance: 0,
        });
        router.push("/");
      },
      setWalletData: (address: string | null, isConnected: boolean) =>
        set({ address, isConnected }),
      setUsdcBalance: (balance: number) => set({ usdcBalance: balance }),
    }),
    {
      name: "wallet-storage", // Storage key for localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isConnected: state.isConnected,
        address: state.address,
      }), // Only persist isConnected and address
    }
  )
);

export const useWallet = () => {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { data: ensName } = useEnsName({ address: wagmiAddress });
  const { data: usdcBalanceData, refetch: fetchUSDCBalance } = useBalance({
    address: wagmiAddress,
    token: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    query: {
      staleTime: 10_000,
      refetchInterval: 15_000,
    },
  });
  const { setWalletData, setUsdcBalance, ...store } = useWalletStore();

  useEffect(() => {
    if (usdcBalanceData?.formatted) {
      setUsdcBalance(parseFloat(usdcBalanceData.formatted));
      console.log("Fetched USDC Balance:", usdcBalanceData.formatted);
    }
  }, [usdcBalanceData, setUsdcBalance]);

  useEffect(() => {
    setWalletData(wagmiAddress || null, wagmiConnected);
  }, [wagmiAddress, wagmiConnected, setWalletData]);

  useEffect(() => {
    useWalletStore.setState({ fetchUSDCBalance });
  }, [fetchUSDCBalance]);

  return {
    ...store,
    ensName: ensName || null,
    fetchUSDCBalance,
  };
};
