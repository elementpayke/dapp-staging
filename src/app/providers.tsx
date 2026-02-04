"use client";

import type { ReactNode } from "react";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { base, arbitrum } from "wagmi/chains";
import { wagmiConfig, lisk, scroll } from "@/lib/wagmi-config";
import { useWalletStore } from "@/lib/useWallet";
import LogoImage from "@/assets/logo.png";
import { useEffect } from "react";
import { PrivyProvider } from "@privy-io/react-auth";

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

// Hydration component for Zustand store
function StoreHydration() {
  useEffect(() => {
    useWalletStore.persist.rehydrate();
  }, []);
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
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#0514eb",
          logo: LogoImage.src,
          showWalletLoginFirst: true,
          // Show these wallets first in the modal (in order)
          walletList: [
            "metamask",
            "phantom",
            "coinbase_wallet",
            "rabby_wallet",
            "detected_wallets", // Show any other detected wallets
            "wallet_connect", // WalletConnect for other wallets
          ],
        },
        loginMethods: ["wallet"],
        // Support multiple chains
        defaultChain: base,
        supportedChains: [base, arbitrum, lisk, scroll],
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
        // Enable WalletConnect for mobile wallet support
        externalWallets: {
          walletConnect: {
            enabled: true,
          },
        },
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <StoreHydration />
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
            {props.children}
          </OnchainKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  );
}
