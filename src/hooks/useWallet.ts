import { useWalletStore } from "@/lib/useWallet";
import { useEffect, useCallback, useMemo } from "react";
import { useAccount, useEnsName, useBalance, useDisconnect } from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/authStore";
import { withRetry } from "@/lib/wagmi-config";

export const useWallet = () => {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const {
    authenticated,
    user,
    logout: privyLogout,
    ready: privyReady,
  } = usePrivy();
  const { wallets } = useWallets();
  const walletPreference = useAuthStore((s) => s.walletPreference);

  // Resolve wallet address based on the user's wallet preference.
  // user?.wallet?.address always returns the first (embedded) wallet,
  // so we must look at useWallets() to find the correct one.
  const walletAddress = useMemo(() => {
    if (walletPreference === "external") {
      const ext = wallets.find((w) => w.walletClientType !== "privy");
      if (ext?.address) return ext.address;
      return wagmiAddress || null;
    }
    if (walletPreference === "embedded") {
      const emb = wallets.find((w) => w.walletClientType === "privy");
      if (emb?.address) return emb.address;
    }
    // walletPreference is null — user hasn't chosen yet. Do NOT fall back
    // to the embedded wallet; wait for an explicit choice.
    return null;
  }, [walletPreference, wallets, wagmiAddress]);
  const isConnected = authenticated || wagmiConnected;

  const { data: ensName } = useEnsName({
    address: walletAddress as `0x${string}` | undefined,
    query: {
      retry: (failureCount, error: any) => {
        if (error?.code === -32005) return false; // Don't retry rate limit errors immediately
        return failureCount < 2;
      },
    },
  });
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { disconnect: storeDisconnect } = useWalletStore();
  const { data: usdcBalanceData, refetch: fetchUSDCBalance } = useBalance({
    address: walletAddress as `0x${string}` | undefined,
    token: `${process.env.NEXT_PUBLIC_USDC_ADDRESS}` as `0x${string}`,
    query: {
      staleTime: 30_000, // Increased to reduce API calls
      refetchInterval: 30_000, // Reduced frequency to avoid rate limits
      retry: (failureCount, error: any) => {
        if (error?.code === -32005) return false; // Don't retry rate limit errors immediately
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  });

  const { setWalletData, setUsdcBalance, ...store } = useWalletStore();

  // Enhanced balance fetching with retry logic
  const fetchBalanceWithRetry = useCallback(async () => {
    try {
      await withRetry(async () => {
        const result = await fetchUSDCBalance();
        return result;
      });
    } catch (error: any) {
      console.warn(
        "Failed to fetch USDC balance after retries:",
        error?.message,
      );
    }
  }, [fetchUSDCBalance]);

  useEffect(() => {
    if (usdcBalanceData?.formatted) {
      setUsdcBalance(parseFloat(usdcBalanceData.formatted));
      console.log("Fetched USDC Balance:", usdcBalanceData.formatted);
    }
  }, [usdcBalanceData, setUsdcBalance]);

  useEffect(() => {
    setWalletData(walletAddress || null, isConnected);
  }, [walletAddress, isConnected, setWalletData]);

  useEffect(() => {
    useWalletStore.setState({ fetchUSDCBalance: fetchBalanceWithRetry });
  }, [fetchBalanceWithRetry]);

  const connectWallet = useCallback(async () => {
    try {
      // Any additional connection logic with retry
      await withRetry(async () => {
        // Connection logic here if needed
        return Promise.resolve();
      });
    } catch (error: any) {
      console.warn("Wallet connection error:", error?.message);
    }
  }, []);

  const disconnect = useCallback(async () => {
    // Disconnect from Privy first (async — must await to avoid race conditions)
    try {
      if (authenticated) {
        await privyLogout();
      }
    } catch (err) {
      console.warn("Privy logout error (non-fatal):", err);
    }
    // Then disconnect wagmi
    wagmiDisconnect();
    storeDisconnect();

    if (typeof window !== "undefined") {
      localStorage.removeItem("wallet-storage");
    }
  }, [authenticated, privyLogout, wagmiDisconnect, storeDisconnect]);

  return {
    ...store,
    isConnected,
    address: walletAddress || null,
    ensName: ensName || null,
    fetchUSDCBalance: fetchBalanceWithRetry,
    disconnect,
    disconnectWallet: disconnect,
    connectWallet,
    ready: privyReady,
  };
};
