import { useWalletStore } from "@/lib/useWallet";
import { useEffect, useCallback } from "react";
import { useAccount, useEnsName, useBalance } from "wagmi";
import { withRetry } from "@/lib/wagmi-config";

export const useWallet = () => {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { data: ensName } = useEnsName({ 
    address: wagmiAddress,
    query: {
      retry: (failureCount, error: any) => {
        if (error?.code === -32005) return false; // Don't retry rate limit errors immediately
        return failureCount < 2;
      }
    }
  });
  
  const { data: usdcBalanceData, refetch: fetchUSDCBalance } = useBalance({
    address: wagmiAddress,
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
      console.warn('Failed to fetch USDC balance after retries:', error?.message);
      // Don't throw the error, just log it to prevent UI breaking
    }
  }, [fetchUSDCBalance]);

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
      console.warn('Wallet connection error:', error?.message);
    }
  }, []);

  return {
    ...store,
    ensName: ensName || null,
    fetchUSDCBalance: fetchBalanceWithRetry,
    connectWallet,
  };
};
