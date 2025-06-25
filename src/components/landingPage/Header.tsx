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
          </div>
          <WalletConnection />

          {/* Mobile Menu Button */}
          <button
            className="md:hidden ml-auto p-2"
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
