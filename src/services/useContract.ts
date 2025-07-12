import { useMemo } from 'react';
import { ethers } from 'ethers';
import { useAccount, useWalletClient } from 'wagmi';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../app/api/abi';

/* Custom hook to instantiate and return an ethers.js Contract instance
 * using the connected wallet's signer obtained via wagmi/OnChainKit.
 *
 * @returns An object containing:
 *   - `contract`: The instantiated ethers.js Contract (or null if not connected).
 *   - `address`: The connected wacontrllet address (or null if not connected).
 *
 * This hook does the following:
 * 1. Uses the `useAccount` hook from wagmi to obtain the connected wallet address and connection status.
 * 2. Uses the `useWalletClient` hook from wagmi to obtain the wallet client (which we assume acts as the signer).
 * 3. Creates a signer from the wallet client by casting it to an `ethers.Signer`.
 * 4. Instantiates an ethers.js Contract with the provided contract address, ABI, and signer.
 * 5. Returns the contract instance along with the connected wallet address.
 */

//@TODO maybe check and confirm if we realy need this hook
export const useContract = (contractAddress: string) => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const signer = useMemo(() => {
    return walletClient ? (walletClient as unknown as ethers.Signer) : null;
  }, [walletClient]);

  const provider = useMemo(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      return new ethers.BrowserProvider((window as any).ethereum);
    }
    return null;
  }, []);

  const contract = useMemo(() => {
    if (!isConnected || !address || !signer || !contractAddress) return null;
    return new ethers.Contract(
      contractAddress,
      CONTRACT_ABI,
      signer
    );
  }, [isConnected, address, signer, contractAddress]);

  const contractWithProvider = useMemo(() => {
    if (!provider || !contractAddress) return null;
    return new ethers.Contract(
      contractAddress,
      CONTRACT_ABI,
      provider
    );
  }, [provider, contractAddress]);

  return { contract, contractWithProvider, address, CONTRACT_ABI, CONTRACT_ADDRESS: contractAddress };
};
