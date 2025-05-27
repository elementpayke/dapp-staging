"use client";

import React, { useState, useEffect } from "react";
import {
  ConnectWallet,
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
import { useWallet } from "@/hooks/useWallet";

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
  const { connectWallet, isConnected } = useWallet();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && isConnected && pathname === "/") {
      redirect("/dashboard");
    }
  }, [isClient, isConnected, pathname]);

  const getButtonClassName = () => {
    let style;
    if (isMobile) {
      style = isHero ? buttonStyles.hero : buttonStyles.default;
    } else {
      style = isHero ? buttonStyles.desktopHero : buttonStyles.desktop;
    }
    return twMerge(style, buttonClassName);
  };

  if (!isClient) {
    return (
      <div className={isMobile ? "mt-8 space-y-4" : "hidden md:block"}>
        <button className={getButtonClassName()} disabled>
          Loading...
        </button>
      </div>
    );
  }

  return (
    <>
      {isMobile ? (
        <div className="mt-8 space-y-4">
          {isConnected ? (
            <Wallet>
              <ConnectWallet>
                <Avatar className="h-6 w-6" />
                <Name />
              </ConnectWallet>
            </Wallet>
          ) : (
            <ConnectWallet
              className={getButtonClassName()}
              onConnect={connectWallet}
            >
              Connect Wallet
            </ConnectWallet>
          )}
        </div>
      ) : (
        <div className="hidden md:block">
          {isConnected ? (
            <Wallet>
              <ConnectWallet>
                <Avatar className="h-6 w-6" />
                <Name />
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                  <Address />
                  <EthBalance />
                </Identity>
                <WalletDropdownBasename />
                <WalletDropdownLink
                  icon="wallet"
                  href="https://keys.coinbase.com"
                >
                  Wallet
                </WalletDropdownLink>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
          ) : (
            <ConnectWallet
              className={getButtonClassName()}
              onConnect={connectWallet}
            >
              Connect Wallet
            </ConnectWallet>
          )}
        </div>
      )}
    </>
  );
};

export default WalletConnection;
