"use client";

import Image from "next/image";
import { Wallet } from "lucide-react";
import LogoImage from "@/assets/logo.png";
import MetamaskLogo from "@/assets/metamask.svg";

interface WalletClientIconProps {
  clientType?: string | null;
  size?: number;
}

const normalizeClientType = (clientType?: string | null) =>
  clientType?.toLowerCase().replace(/\s+/g, "_") ?? "unknown";

export function walletLabel(clientType?: string | null): string {
  switch (normalizeClientType(clientType)) {
    case "privy":
      return "Element Wallet";
    case "metamask":
      return "MetaMask";
    case "coinbase_wallet":
      return "Coinbase Wallet";
    case "walletconnect":
    case "wallet_connect":
      return "WalletConnect";
    case "rainbow":
      return "Rainbow";
    case "phantom":
      return "Phantom";
    case "rabby":
    case "rabby_wallet":
      return "Rabby";
    default:
      return "Wallet";
  }
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function MetaMaskIcon({ size = 18 }: { size?: number }) {
  return (
    <Image src={MetamaskLogo} width={size} height={size} alt="MetaMask" aria-hidden="true" />
  );
}

function CoinbaseIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#0052FF" />
      <path
        d="M20.5 11.5h-4.7a4.9 4.9 0 1 0 0 9.8h4.7v-3.1h-4.4a1.8 1.8 0 0 1 0-3.6h4.4v-3.1Z"
        fill="white"
      />
    </svg>
  );
}

function WalletConnectIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M9.4 12.4a9.5 9.5 0 0 1 13.2 0" stroke="#3B99FC" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M6.4 9.4a13.8 13.8 0 0 1 19.2 0" stroke="#3B99FC" strokeWidth="2.8" strokeLinecap="round" />
      <path d="m11.4 18.1 3.1 3.1a2 2 0 0 0 2.9 0l3.1-3.1" stroke="#3B99FC" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

function RainbowIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M7 21a9 9 0 0 1 18 0" stroke="#FF4D4D" strokeWidth="3" strokeLinecap="round" />
      <path d="M10 21a6 6 0 0 1 12 0" stroke="#FFB648" strokeWidth="3" strokeLinecap="round" />
      <path d="M13 21a3 3 0 0 1 6 0" stroke="#4AA8FF" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function PhantomIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M8 21c0-6 4.2-10 10-10 3.7 0 6 1.7 6 4.5 0 4.7-4.2 9.5-9.8 9.5-3.8 0-6.2-1.8-6.2-4Z" fill="#AB9FF2" />
      <circle cx="14.2" cy="16.3" r="1.1" fill="#3B2B7C" />
      <circle cx="19.1" cy="16.3" r="1.1" fill="#3B2B7C" />
      <path d="M12.9 20.1c1.3.8 3.7.8 5 0" stroke="#3B2B7C" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function RabbyIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#F04A4A" />
      <path d="M10 22V10h6.4c3 0 5 1.6 5 4.2 0 1.7-.9 3-2.4 3.6L22 22h-4.2l-2.7-3.5H14V22h-4Z" fill="white" />
    </svg>
  );
}

function EmbeddedWalletIcon({ size = 18 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center overflow-hidden rounded-full bg-white"
      style={{ width: size, height: size }}
    >
      <Image src={LogoImage} alt="Element Wallet" width={size} height={size} className="object-cover" />
    </span>
  );
}

export function WalletClientIcon({ clientType, size = 18 }: WalletClientIconProps) {
  switch (normalizeClientType(clientType)) {
    case "privy":
      return <EmbeddedWalletIcon size={size} />;
    case "metamask":
      return <MetaMaskIcon size={size} />;
    case "coinbase_wallet":
      return <CoinbaseIcon size={size} />;
    case "walletconnect":
    case "wallet_connect":
      return <WalletConnectIcon size={size} />;
    case "rainbow":
      return <RainbowIcon size={size} />;
    case "phantom":
      return <PhantomIcon size={size} />;
    case "rabby":
    case "rabby_wallet":
      return <RabbyIcon size={size} />;
    default:
      return <Wallet size={size} className="text-[var(--ep-heading)]" strokeWidth={2.1} />;
  }
}
