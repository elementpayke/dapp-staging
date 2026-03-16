"use client";

import type { ReactNode } from "react";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { base, arbitrum } from "wagmi/chains";
import { wagmiConfig, lisk, scroll } from "@/lib/wagmi-config";
import { useWalletStore } from "@/lib/useWallet";
import LogoImage from "@/assets/logo.png";
import { useEffect } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";
import { WagmiProvider } from "@privy-io/wagmi";
import { TokenProvider } from "@/context/TokenContext";
import PrivyWalletListener from "@/components/auth/PrivyWalletListener";
import PrivyAuthSync from "@/components/auth/PrivyAuthSync";
import AuthModal from "@/components/auth/AuthModal";
import { useSessionGuard } from "@/hooks/useSessionGuard";

/**
 * Repair corrupted WalletConnect IndexedDB.
 *
 * WalletConnect stores data in an IndexedDB database called
 * "WALLET_CONNECT_V2_INDEXED_DB" with an object store named
 * "keyvaluestorage". If the DB exists but the object store is missing
 * (e.g. after a failed migration or browser storage hiccup), every
 * subsequent read throws:
 *   NotFoundError: 'keyvaluestorage' is not a known object store name
 *
 * This helper opens the DB, checks for the store, and deletes the
 * entire database when it is corrupt so WalletConnect can recreate it
 * cleanly on next use.
 */
function repairWalletConnectDB(): Promise<void> {
  if (typeof indexedDB === "undefined") return Promise.resolve();

  const DB_NAME = "WALLET_CONNECT_V2_INDEXED_DB";
  const STORE_NAME = "keyvaluestorage";

  return new Promise<void>((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME);

      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.close();
          const delReq = indexedDB.deleteDatabase(DB_NAME);
          delReq.onsuccess = () => {
            console.info("[WC] Deleted corrupted IndexedDB — will recreate on next connect");
            resolve();
          };
          delReq.onerror = () => resolve();
          delReq.onblocked = () => resolve();
        } else {
          db.close();
          resolve();
        }
      };

      req.onerror = () => resolve();
      // If an upgrade is needed the DB didn't exist yet — nothing to fix.
      req.onupgradeneeded = () => {
        req.transaction?.abort();
        resolve();
      };
    } catch {
      resolve();
    }
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on rate limit errors immediately
        if (
          error?.code === -32005 ||
          error?.message?.includes("Too Many Requests")
        ) {
          return failureCount < 2;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Add staleTime to reduce unnecessary refetches across tabs
      staleTime: 1000 * 60, // 1 minute
    },
  },
});

// Hydration component for Zustand store + WalletConnect DB repair
function StoreHydration() {
  useEffect(() => {
    repairWalletConnectDB().then(() => {
      useWalletStore.persist.rehydrate();
    });
  }, []);
  return null;
}

/** Guards the session — triggers full logout on 401 / expired tokens. */
function SessionGuard() {
  useSessionGuard();
  return null;
}

/**
 * Providers wrapper for the application
 *
 * Note: OnchainKitProvider's chain prop is the "default" chain for the UI,
 * but our app supports multiple chains (Base, Lisk, Scroll, Arbitrum).
 * The actual chain used for transactions is determined by:
 * 1. The selected token's chain in the transaction modals
 * 2. wagmi's chain switching (for non-smart wallets)
 * 3. Smart wallet's internal chain selection
 */
export function Providers(props: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={"cmkn2mzls02apjp0cvfjkr4ab"}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#0514eb",
          logo: LogoImage.src,
          showWalletLoginFirst: true,
          // Show these wallets first in the modal (prioritized order)
          walletList: [
            "metamask",
            "coinbase_wallet", // Base chain support via Coinbase Wallet
            "phantom",
            "rabby_wallet",
            "wallet_connect", // WalletConnect for mobile wallet connections
            "rainbow",
            "detected_wallets", // Show any other detected wallets
          ],
        },
        loginMethods: ["wallet"],
        // Support multiple chains
        defaultChain: base,
        supportedChains: [base, arbitrum, lisk, scroll],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "off",
          },
        },
        // Enhanced WalletConnect configuration for mobile
        externalWallets: {
          walletConnect: {
            enabled: true,
          },
        },
        // Mobile-specific settings
        // Allow wallet connection from in-app browsers
        walletConnectCloudProjectId:
          process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <SmartWalletsProvider>
          <StoreHydration />
          <SessionGuard />
          <OnchainKitProvider
            apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
            chain={base}
            config={{
              appearance: {
                name: "ElementPay",
                logo: LogoImage.src,
                mode: "auto",
                theme: "default",
              },
              wallet: {
                display: "modal",
                termsUrl: "https://elementpay.net/terms",
                privacyUrl: "https://elementpay.net/privacy",
              },
            }}
          >
            <TokenProvider>
              <PrivyAuthSync />
              <PrivyWalletListener />
              <AuthModal />
              {props.children}
            </TokenProvider>
          </OnchainKitProvider>
          </SmartWalletsProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
