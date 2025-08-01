"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useLockBodyScroll } from "@/lib/useScroll";
import MobileNav from "./MobileNav";
import { useMenuStore } from "@/lib/useMobileNav";
import WalletConnection from "../wallet-connection/wallet-connection";
import { useIsMobile } from "@/hooks/useIsMobile";

const Header = () => {
  const { toggleMenu, isMenuOpen } = useMenuStore();
  useLockBodyScroll(isMenuOpen);
  const isMobile = useIsMobile();
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-white to-[#c7c7ff] shadow-md rounded-b-xl">
      <nav className="mx-auto max-w-[2000px] px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            {/* If you have a logo image, replace the div below with an <img> tag */}
            <div className="w-10 h-10 rounded-xl bg-[#4339CA] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <div className="w-5 h-5 rounded-md bg-white"></div>
            </div>
            <span className="text-2xl font-extrabold text-gray-900 tracking-tight group-hover:text-blue-700 transition-colors">
              ElementPay
            </span>
          </Link>

          {/* Desktop Nav Links - Centered */}
          <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            {/* Home Link */}
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-700 font-semibold text-lg px-4 py-2 rounded transition-colors border border-transparent hover:border-blue-200"
            >
              Home
            </Link>
            {/* Docs Link */}
            <a
              href="https://docs.elementpay.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-blue-700 font-semibold text-lg px-4 py-2 rounded transition-colors border border-transparent hover:border-blue-200"
            >
              Developer Documentation
            </a>
            {/* Legal Dropdown */}
            <div className="relative group">
              <button
                className="text-gray-700 hover:text-blue-700 font-semibold text-lg px-4 py-2 rounded transition-colors border border-transparent hover:border-blue-200 focus:outline-none flex items-center"
              >
                Legal
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto transition-opacity z-20">
                <a href="/privacy-policy" className="block px-4 py-2 text-gray-700 hover:bg-blue-50">Privacy Policy</a>
                <a href="/terms-and-conditions" className="block px-4 py-2 text-gray-700 hover:bg-blue-50">Terms & Conditions</a>
                <a href="/code-of-conduct" className="block px-4 py-2 text-gray-700 hover:bg-blue-50">Code of Conduct</a>
              </div>
            </div>
          </div>

          {/* Spacer to push wallet connection to the right */}
          <div className="flex-1" />
          <div className="flex items-center space-x-2">
            <WalletConnection />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden ml-2 p-2 rounded hover:bg-blue-100 transition-colors"
            onClick={() => toggleMenu()}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        <MobileNav />
      </nav>
    </header>
  );
};

export default Header;
