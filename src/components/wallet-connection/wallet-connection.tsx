"use client";

import React, { useEffect } from "react";
import {
  Wallet,
  WalletDropdown,
  WalletDropdownBasename,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import { twMerge } from "tailwind-merge";
import { redirect, usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import ClientOnly from "@/components/shared/ClientOnly";

const buttonStyles = {
  default:
    "w-full bg-blue-800 !text-white px-6 py-3 sm:py-4 rounded-full text-base sm:text-lg font-medium hover:bg-blue-700 transition-colors",
  hero: "w-full bg-gradient-to-r from-[#0514eb] to-[#de0413] !text-white px-8 py-4 rounded-full text-base sm:text-lg font-medium hover:opacity-90 transition-opacity",
  desktop:
    "bg-blue-800 !text-white px-6 py-2.5 rounded-full flex items-center space-x-2 hover:bg-blue-700 transition-colors",
  desktopHero:
    "bg-gradient-to-r from-[#0514eb] to-[#de0413] !text-white px-8 py-3.5 rounded-full flex items-center space-x-2 hover:opacity-90 transition-opacity",
};

const WalletConnection = ({
  isMobile = false,
  isHero = false,
  buttonClassName = "",
}: {
  isMobile?: boolean;
  isHero?: boolean;
  buttonClassName?: string;
}) => {
  const { login, authenticated, ready, user } = usePrivy();
  const pathname = usePathname();

  useEffect(() => {
    if (authenticated && pathname === "/") {
      redirect("/dashboard");
    }
  }, [authenticated, pathname]);

  const getButtonClassName = () => {
    let style;
    if (isMobile) {
      style = isHero ? buttonStyles.hero : buttonStyles.default;
    } else {
      style = isHero ? buttonStyles.desktopHero : buttonStyles.desktop;
    }
    return twMerge(style, buttonClassName);
  };
  const walletAddress = user?.wallet?.address;

  const MobileWalletComponent = () => (
    <div className="mt-8 space-y-4">
      {authenticated && walletAddress ? (
        <Wallet>
          <Identity
            address={walletAddress as `0x${string}`}
            className="px-4 pt-3 pb-2"
          >
            <Avatar className="h-6 w-6" />
            <Name />
          </Identity>
        </Wallet>
      ) : (
        <button
          className={getButtonClassName()}
          onClick={login}
          disabled={!ready}
        >
          {!ready ? "Loading..." : "Connect Wallet"}
        </button>
      )}
    </div>
  );

  const DesktopWalletComponent = () => (
    <div className="hidden md:block">
      {authenticated && walletAddress ? (
        <Wallet>
          <Identity
            address={walletAddress as `0x${string}`}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Avatar className="h-6 w-6" />
            <Name />
          </Identity>
          <WalletDropdown>
            <Identity
              address={walletAddress as `0x${string}`}
              className="px-4 pt-3 pb-2"
              hasCopyAddressOnClick
            >
              <Avatar />
              <Name />
              <Address />
              <EthBalance />
            </Identity>
            <WalletDropdownBasename />
            <WalletDropdownLink icon="wallet" href="https://keys.coinbase.com">
              Wallet
            </WalletDropdownLink>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      ) : (
        <button
          className={getButtonClassName()}
          onClick={login}
          disabled={!ready}
        >
          {!ready ? "Loading..." : "Connect Wallet"}
        </button>
      )}
    </div>
  );

  return (
    <ClientOnly
      fallback={
        <div className={isMobile ? "mt-8 space-y-4" : "hidden md:block"}>
          <button className={getButtonClassName()} disabled>
            Loading...
          </button>
        </div>
      }
    >
      {isMobile ? <MobileWalletComponent /> : <DesktopWalletComponent />}
    </ClientOnly>
  );
};

export default WalletConnection;
