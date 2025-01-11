import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

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
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const walletAddress = localStorage.getItem('walletAddress');
        const isConnected = localStorage.getItem('isWalletConnected');
        
        if (walletAddress && isConnected === 'true') {
          setIsConnected(true);
          setAddress(walletAddress);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkConnection();
  }, []);

  const connectWallet = async () => {
    try {
      // The actual wallet connection will be handled by OnchainKit's ConnectWallet component
      // We just need to handle the post-connection state management
      setIsConnected(true);
      const mockAddress = '0x...'; // This will be replaced by the actual address from OnchainKit
      setAddress(mockAddress);
      localStorage.setItem('walletAddress', mockAddress);
      localStorage.setItem('isWalletConnected', 'true');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setIsConnected(false);
      setAddress(null);
    }
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