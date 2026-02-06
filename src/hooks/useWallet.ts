import { useWalletStore } from "@/lib/useWallet";
import { useEffect, useCallback } from "react";
import { useAccount, useEnsName, useBalance, useDisconnect } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { withRetry } from "@/lib/wagmi-config";

export const useWallet = () => {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const {
    authenticated,
    user,
    logout: privyLogout,
    ready: privyReady,
  } = usePrivy();

  // Get wallet address from Privy user or wagmi
  const walletAddress = user?.wallet?.address || wagmiAddress;
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
