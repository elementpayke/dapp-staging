import { useMemo } from 'react';
import { ethers } from 'ethers';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { CONTRACT_ABI } from '../app/api/abi';

/**
 * Custom hook to instantiate and return an ethers.js Contract instance
 * using the connected wallet's signer obtained via wagmi.
 *
 * IMPORTANT: This hook now uses wagmi's provider system instead of directly
 * accessing window.ethereum. This ensures we use the correct provider for the
 * connected wallet, avoiding issues with multiple wallet extensions (like Bybit)
 * that might intercept window.ethereum.
 *
 * @param contractAddress - The address of the contract to interact with
 * @returns An object containing:
 *   - `contract`: The instantiated ethers.js Contract with signer (or null if not connected)
 *   - `contractWithProvider`: Read-only contract with provider (for view functions)
 *   - `address`: The connected wallet address (or undefined if not connected)
 *   - `CONTRACT_ABI`: The contract ABI
 *   - `CONTRACT_ADDRESS`: The contract address passed in
 */
export const useContract = (contractAddress: string) => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  /**
   * Create signer from wagmi's wallet client
   * This ensures we use the correct wallet that the user connected with,
   * not whatever is at window.ethereum
   */
  const signer = useMemo(() => {
    return walletClient ? (walletClient as unknown as ethers.Signer) : null;
  }, [walletClient]);

  /**
   * Create provider from wagmi's public client
   * This uses the configured RPC endpoints from wagmi-config.ts
   * instead of relying on potentially hijacked window.ethereum
   */
  const provider = useMemo(() => {
    if (!publicClient) return null;
    
    // Get the current chain's RPC URL from the public client's transport
    const transport = publicClient.transport;
    if (transport?.url) {
      return new ethers.JsonRpcProvider(transport.url);
    }
    
    // Fallback: Use the chain's configured RPC URL
    const chain = publicClient.chain;
    if (chain?.rpcUrls?.default?.http?.[0]) {
      return new ethers.JsonRpcProvider(chain.rpcUrls.default.http[0]);
    }
    
    return null;
  }, [publicClient]);

  /**
   * Contract instance with signer for write operations
   */
  const contract = useMemo(() => {
    if (!isConnected || !address || !signer || !contractAddress) return null;
    return new ethers.Contract(
      contractAddress,
      CONTRACT_ABI,
      signer
    );
  }, [isConnected, address, signer, contractAddress]);

  /**
   * Contract instance with provider for read-only operations
   */
  const contractWithProvider = useMemo(() => {
    if (!provider || !contractAddress) return null;
    return new ethers.Contract(
      contractAddress,
      CONTRACT_ABI,
      provider
    );
  }, [provider, contractAddress]);

  return { 
    contract, 
    contractWithProvider, 
    address, 
    CONTRACT_ABI, 
    CONTRACT_ADDRESS: contractAddress 
  };
};
