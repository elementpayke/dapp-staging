"use client";

import type { ReactNode } from "react";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";
import { wagmiConfig } from "@/lib/wagmi-config";

import LogoImage from "@/assets/logo.png";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on rate limit errors immediately
        if (error?.code === -32005 || error?.message?.includes('Too Many Requests')) {
          return failureCount < 2;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

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
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={base} // Default chain for OnchainKit UI components
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
  );
}
