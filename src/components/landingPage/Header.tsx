"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
              ElementsPay
            </span>
          </Link>

          {/* Desktop Navigation - Centered */}
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

          {/* CTA Button */}
          <div className="hidden md:block">
            <button className="bg-gradient-to-r from-[#0514eb] via-[#9400d3] to-[#de0413] text-white px-6 py-2.5 rounded-full text-base font-medium hover:opacity-90 transition-opacity">
              Create a Wallet
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden ml-auto">
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
          <div className="md:hidden fixed inset-0 bg-white z-50">
            <div className="flex flex-col h-full">
              {/* Close Button */}
              <div className="flex justify-end p-4">
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
                  className="block text-2xl font-medium text-gray-900"
                >
                  Home
                </Link>
                <Link
                  href="/payments"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-2xl font-medium text-gray-900"
                >
                  Payments
                </Link>
                <Link
                  href="/virtual-cards"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-2xl font-medium text-gray-900"
                >
                  Virtual cards
                </Link>
                <Link
                  href="/faqs"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-2xl font-medium text-gray-900"
                >
                  FAQs
                </Link>
              </div>

              {/* Footer Links */}
              <div className="px-6 py-8 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-y-6">
                  <Link
                    href="/about"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-lg font-medium text-gray-600"
                  >
                    About us
                  </Link>
                  <Link
                    href="/support"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-lg font-medium text-gray-600"
                  >
                    Support
                  </Link>
                  <Link
                    href="/legal"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-lg font-medium text-gray-600"
                  >
                    Legal
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-lg font-medium text-gray-600"
                  >
                    Contact
                  </Link>
                </div>
                <Link
                  href="/cookie-settings"
                  onClick={() => setIsMenuOpen(false)}
                  className="block mt-6 text-lg font-medium text-gray-600"
                >
                  Cookie settings
                </Link>

                {/* CTA Buttons */}
                <div className="mt-8 space-y-4">
                  <button className="w-full bg-gradient-to-r from-[#0514eb] via-[#9400d3] to-[#de0413] text-white px-6 py-4 rounded-full text-lg font-medium">
                    Create a Wallet
                  </button>
                  <button className="w-full bg-white text-[#0514eb] px-6 py-4 rounded-full text-lg font-medium border-2 border-[#0514eb]">
                    Connect a Wallet
                  </button>
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
                  <span className="text-lg font-medium text-gray-900">
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
