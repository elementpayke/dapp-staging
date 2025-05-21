import { useWalletStore } from "@/lib/useWallet";
import { useEffect } from "react";
import { useAccount, useEnsName, useBalance } from "wagmi";

export const useWallet = () => {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { data: ensName } = useEnsName({ address: wagmiAddress });
  const { data: usdcBalanceData, refetch: fetchUSDCBalance } = useBalance({
    address: wagmiAddress,
    token: `${process.env.NEXT_PUBLIC_USDC_ADDRESS}` as `0x${string}`,
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
