import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAccount, useEnsName, useBalance, useWalletClient } from "wagmi";

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  signer: ethers.Signer | null;
  ensName: string | null;
  usdcBalance: number;
  fetchUSDCBalance: () => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  address: null,
  signer: null,
  ensName: null,
  usdcBalance: 0,
  fetchUSDCBalance: () => {},
  connectWallet: async () => {},
  disconnectWallet: () => {},
});


export const useWallet = () => useContext(WalletContext);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  // Use wagmi's useAccount to get the connected address
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  // Use wagmi's useWalletClient to get the wallet client (which will serve as our signer)
  const { data: walletClient } = useWalletClient();

  const { data: ensName } = useEnsName({ address: wagmiAddress });
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const router = useRouter();
  const { data: usdcBalanceData, refetch: fetchUSDCBalance } = useBalance({
    address: wagmiAddress, 
    token: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
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
    if (wagmiConnected && wagmiAddress && walletClient) {
      setAddress(wagmiAddress);
      setIsConnected(true);
      // Assume walletClient has a property "provider" which is an ethers Provider
      // and get the signer from it. If not, if walletClient itself is a signer, cast it.
      const s = walletClient as unknown as ethers.Signer;
      setSigner(s);
      console.log("The signer is: ", s);
      localStorage.setItem('walletAddress', wagmiAddress);
      localStorage.setItem('isWalletConnected', 'true');
    } else {
      setAddress(null);
      setIsConnected(false);
      setSigner(null);
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('isWalletConnected');
      localStorage.setItem("walletAddress", wagmiAddress);
      localStorage.setItem("isWalletConnected", "true");
    } else {
      setAddress(null);
      setIsConnected(false);
      localStorage.removeItem("walletAddress");
      localStorage.removeItem("isWalletConnected");
    }
  }, [wagmiConnected, wagmiAddress, walletClient]);

  // The connectWallet function simply triggers the OnChainKit connect flow,
  // because OnChainKit’s ConnectWallet component will update the state.
  const connectWallet = async () => {
    console.log("Connecting wallet...");
    router.push("/dashboard");
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
    setSigner(null);
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('isWalletConnected');
    router.push('/');
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
