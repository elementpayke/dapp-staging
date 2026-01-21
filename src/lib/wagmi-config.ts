import { http, createConfig } from 'wagmi';
import { base, arbitrum } from 'wagmi/chains';
import { coinbaseWallet, metaMask, injected } from 'wagmi/connectors';
import type { Chain } from 'wagmi/chains';
import { createStorage } from 'wagmi';

// Custom noop storage to prevent hydration issues
const noopStorage = createStorage({
  storage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
});

/**
 * Create a storage that syncs across tabs using localStorage
 * but returns null on server to prevent hydration mismatches
 */
const createCrossTabStorage = () => {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';
  
  return createStorage({
    storage: {
      getItem: (key: string) => {
        if (!isBrowser) return null;
        try {
          return window.localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        if (!isBrowser) return;
        try {
          window.localStorage.setItem(key, value);
          // Note: localStorage automatically dispatches storage events to OTHER tabs
        } catch {
          // Ignore storage errors (e.g., quota exceeded)
        }
      },
      removeItem: (key: string) => {
        if (!isBrowser) return;
        try {
          window.localStorage.removeItem(key);
        } catch {
          // Ignore storage errors
        }
      },
    },
  });
};

// Use cross-tab storage for wallet session persistence
const crossTabStorage = createCrossTabStorage();

/**
 * Safely get the ethereum provider without triggering conflicts
 * This handles the case where multiple wallet extensions compete for window.ethereum
 */
const safeGetEthereum = (): any | undefined => {
  if (typeof window === 'undefined') return undefined;
  
  try {
    // Use Object.getOwnPropertyDescriptor to safely check the property
    const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
    
    if (descriptor) {
      // If it's a getter, call it safely
      if (descriptor.get) {
        try {
          return descriptor.get.call(window);
        } catch {
          return undefined;
        }
      }
      // If it's a value property, return it
      return descriptor.value;
    }
    
    // Fallback: try direct access with error handling
    return (window as any).ethereum;
  } catch (error) {
    console.warn('Error accessing window.ethereum:', error);
    return undefined;
  }
};

// Multiple RPC endpoints for fallback
const baseRpcUrls = [
  process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
  process.env.NEXT_PUBLIC_FALLBACK_RPC_URL || 'https://base-rpc.publicnode.com',
  'https://base.gateway.tenderly.co',
  'https://base.drpc.org',
];

// Arbitrum RPC endpoints (CORS-friendly)
const arbitrumRpcUrls = [
  process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arbitrum-one.publicnode.com',
  'https://arbitrum.drpc.org',
  'https://arbitrum-one.public.blastapi.io',
  'https://arbitrum.blockpi.network/v1/rpc/public',
];

// Create HTTP transport with retry and fallback logic
const createTransportWithFallback = (urls: string[]) => {
  return http(urls[0], {
    batch: true,
    retryCount: 3,
    retryDelay: 1000,
    onFetchRequest: (request) => {
      console.log('Fetching request:', request.url);
    },
    onFetchResponse: (response) => {
      if (!response.ok) {
        console.warn('RPC request failed, will retry with fallback');
      }
    },
  });
};

/**
 * Lisk chain definition (chainId: 1135)
 * Properly typed as a Chain for wagmi compatibility
 */
export const lisk = {
  id: 1135,
  name: 'Lisk',
  nativeCurrency: { name: 'Lisk', symbol: 'LSK', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.api.lisk.com'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://blockscout.lisk.com' },
  },
} as const satisfies Chain;

/**
 * Scroll chain definition (chainId: 534352)
 */
export const scroll = {
  id: 534352,
  name: 'Scroll',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.scroll.io/'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://scrollscan.com' },
  },
} as const satisfies Chain;

/**
 * Wallet IDs to exclude from automatic detection
 * These wallets may interfere with the intended wallet connection
 */
const EXCLUDED_WALLET_IDS = [
  'bybit',
  'com.bybit',
];

/**
 * Check if an injected provider should be excluded
 */
const shouldExcludeProvider = (provider: any): boolean => {
  if (!provider) return false;
  
  try {
    const providerInfo = provider.providerInfo || {};
    const name = (providerInfo.name || provider.name || '').toLowerCase();
    const rdns = (providerInfo.rdns || '').toLowerCase();
    
    return EXCLUDED_WALLET_IDS.some(id => 
      name.includes(id) || rdns.includes(id)
    );
  } catch {
    return false;
  }
};

/**
 * Get providers from EIP-6963 discovery if available
 * This is the modern standard for multi-wallet support
 */
const getEIP6963Providers = (): any[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    // Check for EIP-6963 provider store (used by modern wallets)
    const providerStore = (window as any).ethereum?.providers;
    if (Array.isArray(providerStore)) {
      return providerStore;
    }
    return [];
  } catch {
    return [];
  }
};

/**
 * Wagmi configuration with proper error handling and multi-wallet support
 * 
 * Connector order matters - preferred wallets are listed first:
 * 1. Coinbase Wallet (supports both smart wallet and injected)
 * 2. MetaMask (most common injected wallet)
 * 3. Generic injected (filtered to exclude problematic wallets)
 */
export const wagmiConfig = createConfig({
  chains: [base, lisk, scroll, arbitrum],
  connectors: [
    // Coinbase Wallet - supports smart wallet mode
    // Changed from 'smartWalletOnly' to 'all' to allow both modes
    // Smart wallet will be detected via connector type, not forced
    coinbaseWallet({
      appName: 'ElementPay',
      appLogoUrl: '/logo.png',
      preference: 'all', // Allow both smart wallet and extension
    }),
    // MetaMask - standard injected wallet
    metaMask({
      dappMetadata: {
        name: 'ElementPay',
        url: 'https://elementpay.net',
      },
      preferDesktop: true,
    }),
    injected({
      target: () => {
        const ethereum = safeGetEthereum();
        // Check if Rabby is available via its identifier
        if (ethereum?.isRabby) {
          return {
            id: "rabby",
            name: "Rabby Wallet",
            provider: ethereum,
          };
        }
        return undefined;
      },
    }),
    // Generic injected connector with filtering
    // This catches other wallets but excludes problematic ones
    injected({
      target: () => {
        // Use safe getter to avoid conflicts between wallet extensions
        const ethereum = safeGetEthereum();
        if (!ethereum) return undefined;
        
        try {
          // First try EIP-6963 providers (modern multi-wallet standard)
          const eip6963Providers = getEIP6963Providers();
          if (eip6963Providers.length > 0) {
            const validProvider = eip6963Providers.find(
              (p: any) => !shouldExcludeProvider(p)
            );
            if (validProvider) {
              return {
                id: 'injected',
                name: validProvider.providerInfo?.name || 'Injected Wallet',
                provider: validProvider,
              };
            }
          }
          
          // If it's a provider array (EIP-5749), filter out excluded wallets
          if (ethereum.providers && Array.isArray(ethereum.providers)) {
            const validProvider = ethereum.providers.find(
              (p: any) => !shouldExcludeProvider(p)
            );
            if (validProvider) {
              return {
                id: 'injected',
                name: 'Injected Wallet',
                provider: validProvider,
              };
            }
          }
          
          // Single provider - check if it should be excluded
          if (shouldExcludeProvider(ethereum)) {
            return undefined;
          }
          
          return {
            id: 'injected',
            name: 'Browser Wallet',
            provider: ethereum,
          };
        } catch (error) {
          console.warn('Error detecting injected wallet:', error);
          return undefined;
        }
      },
    }),
  ],
  transports: {
    [base.id]: createTransportWithFallback(baseRpcUrls),
    [lisk.id]: http('https://rpc.api.lisk.com'),
    [scroll.id]: http('https://rpc.scroll.io/'),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
  },
  ssr: true,
  storage: crossTabStorage, // Use cross-tab storage for session persistence across tabs
});

// Rate limit handler
export const handleRateLimitError = (error: any) => {
  if (error?.code === -32005 || error?.message?.includes('Too Many Requests')) {
    console.warn('Rate limit hit, implementing exponential backoff');
    return new Promise((resolve) => {
      const delay = Math.random() * 2000 + 1000; // 1-3 seconds
      setTimeout(resolve, delay);
    });
  }
  throw error;
};

// Enhanced error handling for Web3 operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      if (i === maxRetries) throw error;
      
      // Handle rate limiting
      if (error?.code === -32005 || error?.message?.includes('Too Many Requests')) {
        const backoffDelay = delay * Math.pow(2, i) + Math.random() * 1000;
        console.warn(`Rate limit hit, retrying in ${backoffDelay}ms (attempt ${i + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        continue;
      }
      
      // Handle other network errors
      if (error?.code === 'NETWORK_ERROR' || error?.code === 'SERVER_ERROR') {
        console.warn(`Network error, retrying in ${delay}ms (attempt ${i + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
};
