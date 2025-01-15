import { useMemo } from 'react';
import { ethers } from 'ethers';
import { useAccount, useWalletClient } from 'wagmi';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../app/api/abi';

/**
 * Custom hook to instantiate and return an ethers.js Contract instance
 * using the connected wallet's signer obtained via wagmi/OnChainKit.
 *
 * @returns An object containing:
 *   - `contract`: The instantiated ethers.js Contract (or null if not connected).
 *   - `address`: The connected wallet address (or null if not connected).
 *
 * This hook does the following:
 * 1. Uses the `useAccount` hook from wagmi to obtain the connected wallet address and connection status.
 * 2. Uses the `useWalletClient` hook from wagmi to obtain the wallet client (which we assume acts as the signer).
 * 3. Creates a signer from the wallet client by casting it to an `ethers.Signer`.
 * 4. Instantiates an ethers.js Contract with the provided contract address, ABI, and signer.
 * 5. Returns the contract instance along with the connected wallet address.
 */
export const useContract = () => {
  // Get the connected wallet address and connection status from wagmi.
  const { address, isConnected } = useAccount();
  
  // Get the wallet client from wagmi; it provides methods for sending transactions.
  // In our setup, the wallet client is assumed to behave as an ethers.Signer.
  const { data: walletClient } = useWalletClient();

  // Hard-code the contract address for now. 
  // TODO: Replace this with a dynamic contract address from the env
  // You can alternatively import this from an environment variable or config file.
  const contractAddress = CONTRACT_ADDRESS;

  // Derive the signer from the wallet client.
  // If walletClient exists, we assume it acts as a signer.
  const signer = useMemo(() => {
    return walletClient ? (walletClient as unknown as ethers.Signer) : null;
  }, [walletClient]);

  // Create an ethers.js Contract instance.
  // This contract instance can be used to call smart contract methods.
  const contract = useMemo(() => {
    if (!isConnected || !address || !signer) return null;
    // Instantiating the contract with the testnet contract address, ABI, and signer.
    return new ethers.Contract(
      contractAddress,  // The deployed contract address (testnet for now)
      CONTRACT_ABI,     // The contract's ABI
      signer            // The signer for sending transactions
    );
  }, [isConnected, address, signer]);

  // Return the contract instance and the connected wallet address.
  return { contract, address };
};
