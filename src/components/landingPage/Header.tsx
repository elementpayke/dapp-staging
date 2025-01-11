"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useWallet } from '@/context/WalletContext';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownBasename, 
  WalletDropdownLink, 
  WalletDropdownDisconnect
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance, 
} from '@coinbase/onchainkit/identity';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { connectWallet, disconnectWallet, isConnected, address } = useWallet();

  // Handle body scroll lock
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
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
              href="/faqs"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              FAQs
            </Link>
          </div>

          {/* Wallet Connection Button */}
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
                className='bg-blue-800 text-white px-6 py-2.5 rounded-full flex items-center space-x-2 hover:bg-blue-700 transition-colors'
                onConnect={connectWallet}
              >
                Sign Up
              </ConnectWallet>
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
          <div className="md:hidden absolute inset-x-0 top-16 bg-white shadow-lg">
            <div className="px-4 py-2 space-y-2">
              <Link
                href="/payments"
                className="block py-2 text-gray-600 hover:text-gray-900"
              >
                Payments
              </Link>
              <Link
                href="/virtual-cards"
                className="block py-2 text-gray-600 hover:text-gray-900"
              >
                Virtual Cards
              </Link>
              <Link
                href="/faqs"
                className="block py-2 text-gray-600 hover:text-gray-900"
              >
                FAQs
              </Link>
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
                  className='bg-blue-800 text-white px-6 py-2.5 rounded-full flex items-center space-x-2 hover:bg-blue-700 transition-colors'
                  onConnect={connectWallet}
                >
                  Sign Up
                </ConnectWallet>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
