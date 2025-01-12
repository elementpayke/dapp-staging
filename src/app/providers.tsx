'use client';

import type { ReactNode } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base, baseSepolia } from 'wagmi/chains';
import { WalletProvider } from '@/context/WalletContext';

export function Providers(props: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.ONCHAINKIT_API_KEY}
      chain={baseSepolia}
      config={{
        appearance: {
          name: 'Your App Name',
          logo: 'https://your-logo.com',
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