import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useAccount, useEnsName, useBalance } from "wagmi";

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  ensName: string | null;
  usdcBalance: number;
  fetchUSDCBalance: () => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  address: null,
  ensName: null,
  usdcBalance: 0,
  fetchUSDCBalance: () => {},
  connectWallet: async () => {},
  disconnectWallet: () => {},
});
//read ca from .env
const USDC_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;

export const useWallet = () => useContext(WalletContext);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { data: ensName } = useEnsName({ address: wagmiAddress });
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();
  const { data: usdcBalanceData, refetch: fetchUSDCBalance } = useBalance({
    address: wagmiAddress, 
    token: USDC_CONTRACT_ADDRESS,
    query: {
      staleTime: 10_000,
      refetchInterval: 15_000,
    },
  });
  const [usdcBalance, setUsdcBalance] = useState(0);

  useEffect(() => {
    if (usdcBalanceData?.formatted) {
      setUsdcBalance(parseFloat(usdcBalanceData.formatted));
      console.log("Fetched USDC Balance:", usdcBalanceData.formatted);
    }
  }, [usdcBalanceData]);

  useEffect(() => {
    if (wagmiConnected && wagmiAddress) {
      setAddress(wagmiAddress);
      setIsConnected(true);
      localStorage.setItem("walletAddress", wagmiAddress);
      localStorage.setItem("isWalletConnected", "true");
    } else {
      setAddress(null);
      setIsConnected(false);
      localStorage.removeItem("walletAddress");
      localStorage.removeItem("isWalletConnected");
    }
  }, [wagmiConnected, wagmiAddress]);

  const connectWallet = async () => {
    console.log("Connecting wallet...");
    router.push("/dashboard");
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("isWalletConnected");
    router.push("/");
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        ensName: ensName || null,
        usdcBalance,
        fetchUSDCBalance,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
