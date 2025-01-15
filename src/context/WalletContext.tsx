import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useAccount, useEnsName } from "wagmi";

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  ensName: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  address: null,
  ensName: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

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
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
