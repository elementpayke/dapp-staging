/**
 * Wallet Utilities for Multi-Wallet DApp Support
 * 
 * This module provides utilities for:
 * - Detecting smart wallet vs injected wallet types
 * - Safe provider access that respects wagmi's connector system
 * - Chain switching with smart wallet fallbacks
 * - Provider priority management to avoid conflicts with unwanted extensions
 */

import type { Connector } from 'wagmi';

/**
 * List of wallet connector IDs that are known to be smart wallets
 * Smart wallets do NOT support wallet_switchEthereumChain (EIP-3326)
 */
export const SMART_WALLET_CONNECTOR_IDS = [
  'coinbaseWalletSDK', // Coinbase Smart Wallet
  'com.coinbase.wallet', // Alternative Coinbase ID
  'safe', // Safe (Gnosis Safe)
  'sequence', // Sequence Wallet
  'argent', // Argent Wallet
  'privy', // Privy Smart Wallet
];

/**
 * List of wallet extension connector IDs to deprioritize
 * These may interfere with intended wallet connections
 */
export const DEPRIORITIZED_WALLET_IDS = [
  'bybit', // Bybit Wallet - known to intercept connections
  'com.bybit', // Alternative Bybit ID
];

/**
 * Chain configurations for manual addition if not supported by wallet
 */
export const CHAIN_CONFIGS: Record<number, {
  chainId: string;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}> = {
  1135: {
    chainId: '0x46F', // 1135 in hex
    chainName: 'Lisk',
    nativeCurrency: { name: 'Lisk', symbol: 'LSK', decimals: 18 },
    rpcUrls: ['https://rpc.api.lisk.com'],
    blockExplorerUrls: ['https://blockscout.lisk.com'],
  },
  534352: {
    chainId: '0x82750', // 534352 in hex
    chainName: 'Scroll',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://rpc.scroll.io/'],
    blockExplorerUrls: ['https://scrollscan.com'],
  },
  42161: {
    chainId: '0xA4B1', // 42161 in hex
    chainName: 'Arbitrum One',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
  },
  8453: {
    chainId: '0x2105', // 8453 in hex
    chainName: 'Base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org'],
  },
};

/**
 * Checks if the given connector is a smart wallet
 * Smart wallets do not support chain switching via wallet_switchEthereumChain
 * 
 * @param connector - The wagmi connector to check
 * @returns true if the connector is a smart wallet
 */
export function isSmartWallet(connector: Connector | undefined): boolean {
  if (!connector) return false;
  
  const connectorId = connector.id?.toLowerCase() || '';
  const connectorName = connector.name?.toLowerCase() || '';
  
  // Check against known smart wallet IDs
  const isKnownSmartWallet = SMART_WALLET_CONNECTOR_IDS.some(
    id => connectorId.includes(id.toLowerCase()) || connectorName.includes(id.toLowerCase())
  );
  
  // Additional heuristic: check for smart wallet indicators in connector type
  const hasSmartWalletIndicators = 
    connectorName.includes('smart') ||
    connectorName.includes('account abstraction') ||
    connectorId.includes('smart');
  
  return isKnownSmartWallet || hasSmartWalletIndicators;
}

/**
 * Checks if the given connector is a deprioritized wallet (e.g., Bybit)
 * 
 * @param connector - The wagmi connector to check
 * @returns true if the connector should be deprioritized
 */
export function isDeprioritizedWallet(connector: Connector | undefined): boolean {
  if (!connector) return false;
  
  const connectorId = connector.id?.toLowerCase() || '';
  const connectorName = connector.name?.toLowerCase() || '';
  
  return DEPRIORITIZED_WALLET_IDS.some(
    id => connectorId.includes(id.toLowerCase()) || connectorName.includes(id.toLowerCase())
  );
}

/**
 * Checks if chain switching is supported by the current wallet
 * 
 * @param connector - The wagmi connector to check
 * @returns true if chain switching is supported
 */
export function supportsChainSwitching(connector: Connector | undefined): boolean {
  if (!connector) return false;
  
  // Smart wallets don't support chain switching
  if (isSmartWallet(connector)) {
    return false;
  }
  
  // Most injected wallets support chain switching
  return true;
}

/**
 * Result type for safe chain switch operation
 */
export interface ChainSwitchResult {
  success: boolean;
  method: 'switched' | 'skipped' | 'already-on-chain' | 'manual-required';
  message: string;
  error?: Error;
}

/**
 * Safely attempts to switch chains, with fallbacks for smart wallets
 * 
 * For smart wallets: Skips chain switching (smart wallets handle chains internally)
 * For injected wallets: Attempts switch, falls back to add chain if needed
 * 
 * @param params - Chain switch parameters
 * @returns Result of the chain switch attempt
 */
export async function safeChainSwitch(params: {
  connector: Connector | undefined;
  currentChainId: number;
  targetChainId: number;
  switchChainAsyncFn: (args: { chainId: number }) => Promise<any>;
  chainName: string;
}): Promise<ChainSwitchResult> {
  const { connector, currentChainId, targetChainId, switchChainAsyncFn, chainName } = params;
  
  // Already on correct chain
  if (currentChainId === targetChainId) {
    return {
      success: true,
      method: 'already-on-chain',
      message: `Already connected to ${chainName}`,
    };
  }
  
  // Smart wallet: Skip chain switching, proceed with transaction
  if (isSmartWallet(connector)) {
    console.log(`[wallet-utils] Smart wallet detected (${connector?.name}), skipping chain switch`);
    return {
      success: true,
      method: 'skipped',
      message: `Smart wallet detected. Proceeding without chain switch - the wallet will handle chain selection.`,
    };
  }
  
  // Injected wallet: Attempt chain switch
  try {
    console.log(`[wallet-utils] Attempting chain switch to ${chainName} (${targetChainId})`);
    await switchChainAsyncFn({ chainId: targetChainId });
    
    return {
      success: true,
      method: 'switched',
      message: `Successfully switched to ${chainName}`,
    };
  } catch (error: any) {
    console.error(`[wallet-utils] Chain switch failed:`, error);
    
    // Check if it's an unsupported method error
    const isUnsupportedMethod = 
      error?.message?.includes('unsupported') ||
      error?.message?.includes('wallet_switchEthereumChain') ||
      error?.code === 4200 || // Method not supported
      error?.code === -32601; // Method not found
    
    if (isUnsupportedMethod) {
      // Try to add the chain first, then switch
      const addChainResult = await tryAddChain(targetChainId, connector);
      if (addChainResult) {
        return {
          success: true,
          method: 'manual-required',
          message: `Chain added. Please manually switch to ${chainName} in your wallet.`,
        };
      }
    }
    
    return {
      success: false,
      method: 'manual-required',
      message: `Please manually switch to ${chainName} (Chain ID: ${targetChainId}) in your wallet.`,
      error: error as Error,
    };
  }
}

/**
 * Attempts to add a chain to the wallet using wallet_addEthereumChain
 * 
 * @param chainId - The chain ID to add
 * @param connector - The wagmi connector to use (ensures we use the correct wallet provider)
 * @returns true if chain was added successfully
 */
async function tryAddChain(chainId: number, connector: Connector | undefined): Promise<boolean> {
  const chainConfig = CHAIN_CONFIGS[chainId];
  if (!chainConfig || !connector) {
    console.warn(`[wallet-utils] No chain config or connector found for chainId ${chainId}`);
    return false;
  }
  
  try {
    // Use the connector's provider instead of window.ethereum
    // This ensures we're adding the chain to the wallet the user actually connected with,
    // not whatever wallet has hijacked window.ethereum
    const provider = await connector.getProvider();
    if (!provider) {
      console.warn(`[wallet-utils] No provider available from connector ${connector.name}`);
      return false;
    }
    
    await (provider as any).request({
      method: 'wallet_addEthereumChain',
      params: [chainConfig],
    });
    
    return true;
  } catch (error) {
    console.error(`[wallet-utils] Failed to add chain ${chainId}:`, error);
    return false;
  }
}

/**
 * Gets the proper provider from wagmi's wallet client
 * This ensures we use the correct provider that wagmi connected to,
 * not whatever is at window.ethereum (which could be Bybit or other unwanted wallets)
 * 
 * @param walletClient - The wagmi wallet client
 * @returns The provider from the wallet client, or null if not available
 */
export function getProviderFromWalletClient(walletClient: any): any {
  if (!walletClient) return null;
  
  // The wallet client from wagmi has the transport which contains the provider
  // This is the correct provider for the connected wallet
  return walletClient.transport || walletClient;
}

/**
 * Filters and sorts connectors to prioritize preferred wallets
 * and deprioritize problematic ones (like Bybit)
 * 
 * @param connectors - Array of available connectors
 * @returns Sorted array with preferred connectors first
 */
// export function prioritizeConnectors(connectors: readonly Connector[]): Connector[] {
//   return [...connectors].sort((a, b) => {
//     const aDeprioritized = isDeprioritizedWallet(a);
//     const bDeprioritized = isDeprioritizedWallet(b);
    
//     // Deprioritized wallets go to the end
//     if (aDeprioritized && !bDeprioritized) return 1;
//     if (!aDeprioritized && bDeprioritized) return -1;
    
//     // Prefer Coinbase and MetaMask
//     const preferredOrder = ['coinbase', 'metamask'];
//     const aIndex = preferredOrder.findIndex(p => a.id?.toLowerCase().includes(p));
//     const bIndex = preferredOrder.findIndex(p => b.id?.toLowerCase().includes(p));
    
//     if (aIndex !== -1 && bIndex === -1) return -1;
//     if (aIndex === -1 && bIndex !== -1) return 1;
//     if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    
//     return 0;
//   });
// }


