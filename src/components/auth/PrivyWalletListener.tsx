"use client";

/**
 * PrivyWalletListener — lives outside the AuthModal so it survives modal close/reopen.
 *
 * Flow:
 * 1. User completes OTP verification and authenticates with Privy via email
 * 2. WalletStep calls Privy's linkWallet() to add a wallet to the authenticated session
 * 3. User connects wallet in Privy's modal
 * 4. This listener detects Privy authenticated + wallet address
 * 5. Calls backend connectWallet API to link wallet to backend user
 * 6. Re-opens our AuthModal at the kyc-redirect step
 */

import { useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { connectWallet } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";
import { useAuthModalStore } from "@/stores/authModalStore";

export default function PrivyWalletListener() {
  const { authenticated, user: privyUser } = usePrivy();
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isOpen = useAuthModalStore((s) => s.isOpen);
  const walletConnecting = useAuthModalStore((s) => s.walletConnecting);
  const setWalletConnecting = useAuthModalStore((s) => s.setWalletConnecting);
  const linkingRef = useRef(false);
  const linkedRef = useRef(false);

  // Extract wallet address from Privy user
  // Privy stores the wallet address in linkedAccounts array
  const walletAccount = privyUser?.linkedAccounts?.find((account) => account.type === 'wallet');
  const walletAddress = walletAccount && 'address' in walletAccount ? walletAccount.address : null;

  useEffect(() => {
    // Only act when:
    // - Our auth store has a token (user passed OTP)
    // - Privy is authenticated (user authenticated via email)
    // - We flagged that wallet connection is in progress
    // - We haven't already linked
    
    console.log("[PrivyWalletListener] State check:", {
      walletConnecting,
      isAuthenticated,
      token: token ? "present" : "missing",
      privyAuthenticated: authenticated,
      walletAddress,
      linkingInProgress: linkingRef.current,
      alreadyLinked: linkedRef.current,
    });

    if (!walletConnecting || !isAuthenticated || !token) {
      console.log("[PrivyWalletListener] Skipping: wallet connection not in progress or user not authenticated");
      return;
    }
    if (!authenticated || !walletAddress) {
      console.log("[PrivyWalletListener] Skipping: Privy not authenticated or no wallet address");
      return;
    }
    if (linkingRef.current || linkedRef.current) {
      console.log("[PrivyWalletListener] Skipping: already linking or linked");
      return;
    }

    linkingRef.current = true;

    console.log("[PrivyWalletListener] Privy wallet connected:", walletAddress);
    console.log("[PrivyWalletListener] Privy user:", JSON.stringify(privyUser, null, 2));

    const link = async () => {
      try {
        const res = await connectWallet(token, walletAddress, "evm");
        console.log("[PrivyWalletListener] connectWallet response:", JSON.stringify(res, null, 2));
        linkedRef.current = true;
      } catch (err: any) {
        console.error("[PrivyWalletListener] connectWallet error:", err);
        // "already linked" is fine — treat as success
        if (err.message?.includes("already")) {
          linkedRef.current = true;
        }
      } finally {
        linkingRef.current = false;
      }

      // Re-open our modal at the KYC step
      if (linkedRef.current) {
        const store = useAuthModalStore.getState();
        // Reset wallet connecting flag
        store.setWalletConnecting(false);
        if (!store.isOpen) {
          store.openAuthModal();
        }
        // Small delay so modal mounts, then advance
        setTimeout(() => {
          useAuthModalStore.getState().setStep("kyc-redirect");
        }, 100);
      } else {
        // Error — re-open at wallet step so user can retry
        const store = useAuthModalStore.getState();
        store.setWalletConnecting(false);
        if (!store.isOpen) {
          store.openAuthModal();
        }
        setTimeout(() => {
          useAuthModalStore.getState().setStep("wallet");
        }, 100);
      }
    };

    link();
  }, [authenticated, walletAddress, token, isAuthenticated, walletConnecting, privyUser, isOpen]);

  // Reset refs when walletConnecting goes false (new flow started)
  useEffect(() => {
    if (!walletConnecting) {
      console.log("[PrivyWalletListener] Resetting state - wallet connection flow ended");
      linkingRef.current = false;
      linkedRef.current = false;
    }
  }, [walletConnecting]);

  return null; // Invisible — just a state listener
}
