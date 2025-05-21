import Link from "next/link";
import React from "react";
import { X } from "lucide-react";
import { useMenuStore } from "@/lib/useMobileNav";
import WalletConnection from "../wallet-connection/wallet-connection";

const MobileNav = ({}) => {
  const { isMenuOpen, setIsMenuOpen } = useMenuStore();

  if (!isMenuOpen) return null;

  return (
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
            sho Hakiba
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
          <WalletConnection isMobile={true} />

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
  );
};

export default MobileNav;
