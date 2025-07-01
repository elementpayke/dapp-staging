import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet, metaMask } from 'wagmi/connectors';

// Multiple RPC endpoints for fallback
const rpcUrls = [
  process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
  process.env.NEXT_PUBLIC_FALLBACK_RPC_URL || 'https://base-rpc.publicnode.com',
  'https://base.gateway.tenderly.co',
  'https://base.drpc.org',
];

// Create HTTP transport with retry and fallback logic
const createTransportWithFallback = () => {
  return http(rpcUrls[0], {
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

// Wagmi configuration with proper error handling
export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'ElementPay',
      appLogoUrl: '/logo.png',
      preference: 'smartWalletOnly',
    }),
    metaMask({
      dappMetadata: {
        name: 'ElementPay',
        url: 'https://elementpay.net',
      },
    }),
  ],
  transports: {
    [base.id]: createTransportWithFallback(),
  },
  ssr: true,
  storage: null, // Disable storage to prevent hydration issues
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
