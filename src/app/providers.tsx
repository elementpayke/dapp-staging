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

export function Providers(props: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
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
  );
}
