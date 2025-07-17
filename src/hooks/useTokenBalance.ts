import { useBalance, useChainId } from "wagmi";
import { useAccount } from "wagmi";
import { SupportedToken } from "@/constants/supportedTokens";

interface UseTokenBalanceProps {
  token: SupportedToken;
  enabled?: boolean;
}

export const useTokenBalance = ({ token, enabled = true }: UseTokenBalanceProps) => {
  const { address } = useAccount();
  const currentChainId = useChainId();
  
  // Map chain names to chain IDs
  const chainNameToId: Record<string, number> = {
    "Base": 8453,
    "Lisk": 1135,
    "Scroll": 534352,
    "Arbitrum": 42161
  };
  
  const requiredChainId = chainNameToId[token.chain];
  const isCorrectNetwork = currentChainId === requiredChainId;
  
  const { data: tokenBalanceData, isLoading, error, refetch } = useBalance({
    address: address,
    token: token.tokenAddress as `0x${string}`,
    query: {
      enabled: enabled && isCorrectNetwork && !!address,
      staleTime: 30_000,
      refetchInterval: 30_000,
      retry: (failureCount, error: any) => {
        if (error?.code === -32005) return false; 
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  });

  const tokenBalance = parseFloat(tokenBalanceData?.formatted || "0");
  
  return {
    balance: tokenBalance,
    formattedBalance: tokenBalanceData?.formatted || "0",
    isLoading,
    error,
    refetch,
    isCorrectNetwork,
    requiredChainId,
    currentChainId
  };
};
