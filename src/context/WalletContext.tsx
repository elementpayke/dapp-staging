import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  address: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

export const useWallet = () => useContext(WalletContext);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (wagmiConnected && wagmiAddress) {
      setAddress(wagmiAddress);
      setIsConnected(true);
      localStorage.setItem('walletAddress', wagmiAddress);
      localStorage.setItem('isWalletConnected', 'true');
    } else {
      setAddress(null);
      setIsConnected(false);
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('isWalletConnected');
    }
  }, [wagmiConnected, wagmiAddress]);

  // The connectWallet function can now simply trigger the OnChainKit connect flow,
  // because the useAccount hook will then update our context automatically.
  const connectWallet = async () => {
    // OnChainKit’s ConnectWallet component will handle prompting the user.
    // Once connected, useAccount will update and our useEffect will handle it.
    console.log('Connecting wallet...');
    router.push('/dashboard');
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('isWalletConnected');
    router.push('/');
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
