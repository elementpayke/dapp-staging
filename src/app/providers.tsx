'use client';

import type { ReactNode } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { baseSepolia } from 'wagmi/chains';
import { WalletProvider } from '@/context/WalletContext';
import LogoImage from "@/assets/logo.png";

export function Providers(props: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.ONCHAINKIT_API_KEY}
      chain={baseSepolia}
      config={{
        appearance: {
          name: 'ElementPay',
          logo: LogoImage.src,
          mode: 'auto',
          theme: 'default',
        },
        wallet: { 
          display: 'modal', 
          termsUrl: 'https://...', 
          privacyUrl: 'https://...', 
        },
      }}
    >
      <WalletProvider>
        {props.children}
      </WalletProvider>
    </OnchainKitProvider>
  );
}