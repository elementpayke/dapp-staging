import { http } from "wagmi";
import { base, arbitrum, polygon, bsc } from "wagmi/chains"; // ← added bsc
import type { Chain } from "wagmi/chains";
import { createConfig } from "@privy-io/wagmi";

// Multiple RPC endpoints for fallback
const baseRpcUrls = [
  process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org",
  process.env.NEXT_PUBLIC_FALLBACK_RPC_URL || "https://base-rpc.publicnode.com",
  "https://base.gateway.tenderly.co",
  "https://base.drpc.org",
];

// Arbitrum RPC endpoints (CORS-friendly)
const arbitrumRpcUrls = [
  process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL ||
    "https://arbitrum-one.publicnode.com",
  "https://arbitrum.drpc.org",
  "https://arbitrum-one.public.blastapi.io",
  "https://arbitrum.blockpi.network/v1/rpc/public",
];

// Polygon RPC endpoints (CORS-friendly)
const polygonRpcUrls = [
  process.env.NEXT_PUBLIC_POLYGON_RPC_URL ||
    "https://polygon-bor-rpc.publicnode.com",
  "https://polygon.drpc.org",
  "https://polygon.public.blastapi.io",
  "https://polygon.blockpi.network/v1/rpc/public",
];

// BNB Chain RPC endpoints (CORS-friendly)
const bnbRpcUrls = [
  process.env.NEXT_PUBLIC_BNB_RPC_URL || "https://bsc-dataseed.binance.org",
  "https://bsc-dataseed1.defibit.io",
  "https://bsc-dataseed1.ninicoin.io",
  "https://bsc.publicnode.com",
];

// Create HTTP transport with retry and fallback logic
const createTransportWithFallback = (urls: string[]) => {
  return http(urls[0], {
    batch: true,
    retryCount: 3,
    retryDelay: 1000,
    onFetchRequest: (request) => {
      console.log("Fetching request:", request.url);
    },
    onFetchResponse: (response) => {
      if (!response.ok) {
        console.warn("RPC request failed, will retry with fallback");
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
  name: "Lisk",
  nativeCurrency: { name: "Lisk", symbol: "LSK", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.api.lisk.com"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://blockscout.lisk.com" },
  },
} as const satisfies Chain;

/**
 * Scroll chain definition (chainId: 534352)
 */
export const scroll = {
  id: 534352,
  name: "Scroll",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.scroll.io/"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://scrollscan.com" },
  },
} as const satisfies Chain;

/**
 * Wagmi configuration using @privy-io/wagmi adapter
 *
 * IMPORTANT: Do NOT pass connectors here. Privy manages all wallet connectors
 * internally (MetaMask, WalletConnect, Coinbase, etc.) through its modal.
 * Adding connectors here would create duplicate instances that conflict
 * with Privy's connection flow and cause the modal to hang.
 */
export const wagmiConfig = createConfig({
  chains: [base, lisk, scroll, arbitrum, polygon, bsc], // ← added bsc
  transports: {
    [base.id]: createTransportWithFallback(baseRpcUrls),
    [lisk.id]: http("https://rpc.api.lisk.com"),
    [scroll.id]: http("https://rpc.scroll.io/"),
    [arbitrum.id]: http("https://arb1.arbitrum.io/rpc"),
    [polygon.id]: createTransportWithFallback(polygonRpcUrls),
    [bsc.id]: createTransportWithFallback(bnbRpcUrls), // ← added bsc
  },
  ssr: true,
});

// Rate limit handler
export const handleRateLimitError = (error: any) => {
  if (error?.code === -32005 || error?.message?.includes("Too Many Requests")) {
    console.warn("Rate limit hit, implementing exponential backoff");
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
  delay: number = 1000,
): Promise<T> => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      if (i === maxRetries) throw error;

      // Handle rate limiting
      if (
        error?.code === -32005 ||
        error?.message?.includes("Too Many Requests")
      ) {
        const backoffDelay = delay * Math.pow(2, i) + Math.random() * 1000;
        console.warn(
          `Rate limit hit, retrying in ${backoffDelay}ms (attempt ${i + 1}/${maxRetries + 1})`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        continue;
      }

      // Handle other network errors
      if (error?.code === "NETWORK_ERROR" || error?.code === "SERVER_ERROR") {
        console.warn(
          `Network error, retrying in ${delay}ms (attempt ${i + 1}/${maxRetries + 1})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
};