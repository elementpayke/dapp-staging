"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
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
import { useRouter } from "next/navigation";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { connectWallet, isConnected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh";
      document.body.style.touchAction = "none";

      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.height = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.body.style.width = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.height = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.body.style.width = "";
    };
  }, [isMenuOpen]);

  return (
    <header className="bg-gradient-to-r from-white to-[#c7c7ff]">
      <nav className="mx-auto max-w-[2000px] px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#4339CA] flex items-center justify-center">
              <div className="w-4 h-4 rounded-sm bg-white"></div>
            </div>
            <span className="text-lg font-semibold text-gray-900">
              ElementPay
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 items-center justify-center space-x-12">
            <Link
              href="/payments"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              Payments
            </Link>
            <Link
              href="/virtual-cards"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              Virtual Cards
            </Link>

            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              FAQs
            </Link>
            <Link
              href="/hakiba"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              Hakiba
            </Link>
          </div>

          {/* Wallet Connection */}
          <div className="hidden md:block">
            {isConnected ? (
              <Wallet>
                <ConnectWallet>
                  <Avatar className="h-6 w-6" />
                  <Name />
                </ConnectWallet>
                <WalletDropdown>
                  <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick
                  >
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
                className="bg-blue-800 text-white px-6 py-2.5 rounded-full flex items-center space-x-2 hover:bg-blue-700 transition-colors"
                onConnect={connectWallet} text="Connect Wallet"
              />
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden ml-auto p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-white z-50">
            <div className="h-full flex flex-col">
              {/* Close Button */}
              <div className="flex justify-end p-4 border-b border-gray-100">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 px-6 py-4 space-y-6">
                <Link
                  href="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-xl sm:text-2xl font-medium text-gray-900"
                >
                  Home
                </Link>
                <Link
                  href="/payments"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-xl sm:text-2xl font-medium text-gray-900"
                >
                  Payments
                </Link>
                <Link
                  href="/virtual-cards"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-xl sm:text-2xl font-medium text-gray-900"
                >
                  Virtual cards
                </Link>
                <Link
                  href="/faqs"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-xl sm:text-2xl font-medium text-gray-900"
                >
                  FAQs
                </Link>
                <Link
                  href="/faqs"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-xl sm:text-2xl font-medium text-gray-900"
                >
                  Hakiba
                </Link>
              </div>

              {/* Footer Links */}
              <div className="px-6 py-8 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-y-6">
                  <Link
                    href="/about"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-base sm:text-lg font-medium text-gray-600"
                  >
                    About us
                  </Link>
                  <Link
                    href="/support"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-base sm:text-lg font-medium text-gray-600"
                  >
                    Support
                  </Link>
                  <Link
                    href="/legal"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-base sm:text-lg font-medium text-gray-600"
                  >
                    Legal
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-base sm:text-lg font-medium text-gray-600"
                  >
                    Contact
                  </Link>
                </div>

                <Link
                  href="/cookie-settings"
                  onClick={() => setIsMenuOpen(false)}
                  className="block mt-6 text-base sm:text-lg font-medium text-gray-600"
                >
                  Cookie settings
                </Link>

                {/* Mobile Wallet Connection */}
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
                      className="w-full bg-blue-800 text-white px-6 py-3 sm:py-4 rounded-full text-base sm:text-lg font-medium"
                      onConnect={connectWallet}
                    >
                      Sign Up
                    </ConnectWallet>
                  )}
                </div>

                {/* No KYC Required */}
                <div className="flex items-center justify-center mt-6 space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#0514eb] flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span className="text-base sm:text-lg font-medium text-gray-900">
                    No KYC required
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
  