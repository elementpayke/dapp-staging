"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-white to-[#c7c7ff] border-b border-gray-200">
      <nav className="mx-auto max-w-[2000px] px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex h-16 justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#4339CA] flex items-center justify-center">
              <div className="w-4 h-4 rounded-sm bg-white"></div>
            </div>
            <span className="text-lg font-semibold text-gray-900">
              ElementsPay
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
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
            <button className="bg-gradient-to-r from-[#0514eb] to-[#de0413] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              Create a Wallet
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 bg-white/95 backdrop-blur-sm shadow-lg z-50">
            <div className="px-4 py-3 space-y-1">
              <Link
                href="/payments"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Payments
              </Link>
              <Link
                href="/virtual-cards"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Virtual Cards
              </Link>
              <Link
                href="/faqs"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                FAQs
              </Link>
              <div className="pt-2 pb-1">
                <button className="w-full bg-gradient-to-r from-[#0514eb] to-[#de0413] text-white px-4 py-2 rounded-lg text-base font-medium hover:opacity-90 transition-opacity">
                  Create a Wallet
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
