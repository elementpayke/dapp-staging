"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useChainId, useSwitchChain, useAccount } from "wagmi";
import { readContract } from "@wagmi/core";
import { erc20Abi } from "viem";
import { SUPPORTED_TOKENS, SupportedToken } from "@/constants/supportedTokens";
import { wagmiConfig } from "@/lib/wagmi-config";

// Map chain IDs to chain names
const CHAIN_ID_TO_NAME: Record<number, string> = {
  8453: "Base",
  1135: "Lisk",
  534352: "Scroll",
  42161: "Arbitrum",
};

// Map chain names to chain IDs
const CHAIN_NAME_TO_ID: Record<string, number> = {
  "Base": 8453,
  "Lisk": 1135,
  "Scroll": 534352,
  "Arbitrum": 42161,
};

interface TokenContextType {
  selectedToken: SupportedToken;
  setSelectedToken: (token: SupportedToken) => void;
  selectTokenAndSwitchChain: (token: SupportedToken) => Promise<void>;
  isCorrectNetwork: boolean;
  currentChainId: number | undefined;
  isSwitchingChain: boolean;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

interface TokenProviderProps {
  children: ReactNode;
}

export const TokenProvider: React.FC<TokenProviderProps> = ({ children }) => {
  const currentChainId = useChainId();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const { address, isConnected } = useAccount();
  const [selectedToken, setSelectedTokenState] = useState<SupportedToken>(SUPPORTED_TOKENS[0]);
  const [prevChainId, setPrevChainId] = useState<number | undefined>(undefined);
  const autoDetectRanRef = useRef(false);

  // Check if we're on the correct network for the selected token
  const isCorrectNetwork = currentChainId === CHAIN_NAME_TO_ID[selectedToken.chain];

  // ── Auto-detect best token/chain on wallet connect ────────────────────
  // Probes ERC-20 balances across all supported chains (no chain switch needed).
  // Priority: Base > Lisk > Scroll > Arbitrum (SUPPORTED_TOKENS order).
  // Picks the first token with a non-zero balance; defaults to Base otherwise.
  useEffect(() => {
    if (!address || !isConnected) {
      autoDetectRanRef.current = false;
      return;
    }
    if (autoDetectRanRef.current) return;
    autoDetectRanRef.current = true;

    const detectBestToken = async () => {
      console.log("[TokenContext] Auto-detecting best chain for", address);

      // Read balances on every supported chain in parallel
      const results = await Promise.allSettled(
        SUPPORTED_TOKENS.map(async (token) => {
          const chainId = CHAIN_NAME_TO_ID[token.chain];
          if (!chainId) return { token, balance: 0n };
          try {
            const bal = await readContract(wagmiConfig, {
              address: token.tokenAddress as `0x${string}`,
              abi: erc20Abi,
              functionName: "balanceOf",
              args: [address as `0x${string}`],
              chainId,
            });
            return { token, balance: bal as bigint };
          } catch (e) {
            console.warn(`[TokenContext] Failed to read balance on ${token.chain}:`, e);
            return { token, balance: 0n };
          }
        }),
      );

      // Find the first token (in priority order) with a positive balance
      for (const r of results) {
        if (r.status === "fulfilled" && r.value.balance > 0n) {
          const best = r.value.token;
          console.log(`[TokenContext] Auto-selected ${best.symbol} on ${best.chain} (has balance)`);
          setSelectedTokenState(best);

          // Also switch chain so the user is ready to transact immediately
          const targetChainId = CHAIN_NAME_TO_ID[best.chain];
          if (currentChainId !== targetChainId) {
            try {
              await switchChainAsync({ chainId: targetChainId });
              console.log(`[TokenContext] Auto-switched to ${best.chain}`);
            } catch {
              // Non-fatal — UI will show network mismatch warning
            }
          }
          return;
        }
      }

      // No balances found anywhere — keep default (SUPPORTED_TOKENS[0] = Base)
      console.log("[TokenContext] No balances detected, defaulting to Base");
    };

    detectBestToken();
  }, [address, isConnected, currentChainId, switchChainAsync]);

  // Handle manual token selection (without chain switch)
  const setSelectedToken = useCallback((token: SupportedToken) => {
    console.log(`[TokenContext] Manual token selection: ${token.symbol} on ${token.chain}`);
    setSelectedTokenState(token);
  }, []);

  // Handle token selection WITH automatic chain switching
  const selectTokenAndSwitchChain = useCallback(async (token: SupportedToken) => {
    console.log(`[TokenContext] Token selection with chain switch: ${token.symbol} on ${token.chain}`);
    
    // Update the selected token first
    setSelectedTokenState(token);
    
    // Get the target chain ID for this token
    const targetChainId = CHAIN_NAME_TO_ID[token.chain];
    
    // If already on the correct chain, no need to switch
    if (currentChainId === targetChainId) {
      console.log(`[TokenContext] Already on ${token.chain}, no switch needed`);
      return;
    }
    
    // Switch to the token's chain
    try {
      console.log(`[TokenContext] Switching chain from ${currentChainId} to ${targetChainId} (${token.chain})`);
      await switchChainAsync({ chainId: targetChainId });
      console.log(`[TokenContext] Successfully switched to ${token.chain}`);
    } catch (error: any) {
      console.error(`[TokenContext] Failed to switch chain:`, error);
      // Don't revert token selection - user can manually switch or try again
      // The UI will show "wrong network" warning
    }
  }, [currentChainId, switchChainAsync]);

  // Auto-sync token when wallet chain changes externally (e.g., user switches in wallet)
  useEffect(() => {
    // Skip initial render
    if (prevChainId === undefined) {
      setPrevChainId(currentChainId);
      return;
    }

    // Skip if chain hasn't actually changed
    if (prevChainId === currentChainId) {
      return;
    }

    console.log(`[TokenContext] Wallet chain changed externally: ${prevChainId} -> ${currentChainId}`);
    setPrevChainId(currentChainId);

    if (!currentChainId) return;

    const chainName = CHAIN_ID_TO_NAME[currentChainId];
    if (!chainName) {
      console.log(`[TokenContext] Unknown chain ID: ${currentChainId}`);
      return;
    }

    // Check if current selected token matches the wallet's chain
    if (selectedToken.chain === chainName) {
      console.log(`[TokenContext] Token already matches chain: ${chainName}`);
      return;
    }

    // Find a token on the current chain
    const tokenOnCurrentChain = SUPPORTED_TOKENS.find(
      (token) => token.chain === chainName
    );

    if (tokenOnCurrentChain) {
      console.log(`[TokenContext] Auto-switching token to ${tokenOnCurrentChain.symbol} on ${chainName}`);
      setSelectedTokenState(tokenOnCurrentChain);
    } else {
      console.log(`[TokenContext] No supported token found for chain: ${chainName}`);
    }
  }, [currentChainId, prevChainId, selectedToken.chain]);

  return (
    <TokenContext.Provider
      value={{
        selectedToken,
        setSelectedToken,
        selectTokenAndSwitchChain,
        isCorrectNetwork,
        currentChainId,
        isSwitchingChain,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
};

export const useSelectedToken = (): TokenContextType => {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error("useSelectedToken must be used within a TokenProvider");
  }
  return context;
};

// Export utility functions
export { CHAIN_ID_TO_NAME, CHAIN_NAME_TO_ID };
