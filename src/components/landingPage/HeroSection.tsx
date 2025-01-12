"use client";
import React from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { useWallet } from '@/context/WalletContext';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownBasename, 
  WalletDropdownFundLink, 
  WalletDropdownLink, 
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance, 
} from '@coinbase/onchainkit/identity';

// Import images directly
import happyCouple from "@/assets/happy-couple.png";
import ethereumLogo from "@/assets/ethereum-logo.svg";
import bitcoinLogo from "@/assets/bitcoin-logo.svg";

// Constants for image metadata
const IMAGES = {
  heroMain: {
    src: happyCouple,
    alt: "Happy couple using ElementsPay",
    width: 600,
    height: 700,
  },
  ethereumLogo: {
    src: ethereumLogo,
    alt: "Ethereum",
    width: 64,
    height: 64,
  },
  bitcoinLogo: {
    src: bitcoinLogo,
    alt: "Bitcoin",
    width: 64,
    height: 64,
  },
};

const Hero = () => {
  const { connectWallet, disconnectWallet, isConnected, address } = useWallet();

  return (
    <div className="bg-gradient-to-r from-white to-[#c7c7ff] min-h-[calc(100vh-64px)] overflow-x-hidden">
      <div className="max-w-[2000px] mx-auto h-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 md:py-8 relative">
        {/* Top Navigation Pills - Updated Design */}
        <div className="inline-flex items-center bg-white/90 backdrop-blur-md rounded-full px-3 py-2 gap-2 sm:gap-4 shadow-sm text-sm sm:text-base">
          <div className="flex items-center gap-1 bg-[#d1c6bc] rounded-full px-2 sm:px-3 py-1.5">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#0514eb]" />
            <span className="text-gray-800 font-medium">New</span>
          </div>
          <span className="bg-gradient-to-r from-[#0514eb] to-[#de0413] bg-clip-text text-transparent font-semibold whitespace-nowrap">
            Create a Virtual Card
          </span>
          <span className="text-gray-400">→</span>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 xl:gap-12 mt-6 sm:mt-8">
          {/* Left Column */}
          <div className="flex flex-col justify-center max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold leading-tight mb-4 sm:mb-6 text-black/90">
              Pay for anything with Crypto, as simply as saying Cheese!
            </h1>
            <p className="text-base sm:text-lg xl:text-xl text-gray-600 mb-6 sm:mb-8">
              ElementsPay is removing the mystery from crypto by making your
              tokens pay for your every day expenditures. Pay for anything
              instantly, easily.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-8 sm:mb-12 xl:mb-16">
              <button className="bg-gradient-to-r from-[#0514eb] to-[#de0413] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg xl:text-xl font-medium hover:opacity-90 transition-all whitespace-nowrap">
                Create a Wallet
              </button>
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
                    <WalletDropdownDisconnect />
                  </WalletDropdown>
                </Wallet>
              ) : (
                <ConnectWallet 
                  className='bg-white text-[#0514eb] px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg xl:text-xl font-medium border-2 border-[#0514eb] hover:bg-blue-50 transition-all whitespace-nowrap'
                  onConnect={connectWallet}
                >
                  Connect a Wallet
                </ConnectWallet>
              )}
              <div className="flex items-center gap-2 text-gray-600 mt-2 sm:mt-0">
                <div className="text-[#0514eb]">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <span className="text-base sm:text-lg">No KYC required</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-black/20">
                  12
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7280]">
                  Banks supported
                </p>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-black/20">
                  $2M
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7280]">
                  Gross payments processed
                </p>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-black/20">
                  600K+
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7280]">
                  Satisfied users
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative w-full min-h-[400px] lg:h-full flex items-center justify-center lg:justify-end mt-8 lg:mt-0">
            <div className="relative w-full max-w-md lg:max-w-none h-[400px] lg:h-[600px]">
              <Image
                src={IMAGES.heroMain.src}
                alt={IMAGES.heroMain.alt}
                fill
                className="object-contain object-center lg:object-right rounded-2xl"
                priority
                sizes="(max-width: 1024px) 90vw, 45vw"
              />

              {/* Floating Card */}
              <div className="absolute bottom-4 sm:bottom-8 right-4 sm:right-8 bg-[#2f0238] text-white p-3 sm:p-4 rounded-xl shadow-lg w-64 sm:w-72 scale-90 sm:scale-100">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#36B37E] rounded-full"></div>
                  <span className="text-xs sm:text-sm font-medium">
                    LEDGER LIVE
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#3366FF] rounded-full"></div>
                    <span className="text-xs sm:text-sm">USDC:</span>
                    <span className="text-xs sm:text-sm opacity-60">
                      $09.98
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm">8x1</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#F7931A] rounded-full"></div>
                    <span className="text-xs sm:text-sm">BTC:</span>
                    <span className="text-xs sm:text-sm opacity-60">
                      0.00000025
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold">
                    $2679.90
                  </span>
                </div>
              </div>

              {/* Crypto Logos */}
              <div className="absolute left-4 sm:left-8 bottom-32 sm:bottom-44 scale-75 sm:scale-100">
                <Image
                  src={IMAGES.ethereumLogo.src}
                  alt={IMAGES.ethereumLogo.alt}
                  width={IMAGES.ethereumLogo.width}
                  height={IMAGES.ethereumLogo.height}
                  className="animate-bounce"
                />
              </div>
              <div className="absolute left-16 sm:left-24 bottom-20 sm:bottom-28 scale-75 sm:scale-100">
                <Image
                  src={IMAGES.bitcoinLogo.src}
                  alt={IMAGES.bitcoinLogo.alt}
                  width={IMAGES.bitcoinLogo.width}
                  height={IMAGES.bitcoinLogo.height}
                  className="animate-bounce [animation-delay:200ms]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
