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
        {/* Branded Top Bar with Logo and Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-[#4339CA] bg-[#f5f6ff]">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-2">
            <img src="/logo.png" alt="ElementPay Logo" className="w-8 h-8 rounded-lg shadow" />
            <span className="text-xl font-bold text-[#4339CA] tracking-tight">ElementPay</span>
          </Link>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 text-gray-600 hover:text-gray-900"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-6 py-8 space-y-8">
          <Link
            href="/"
            onClick={() => setIsMenuOpen(false)}
            className="block text-2xl font-semibold text-gray-900"
          >
            Home
          </Link>
          <a
            href="https://docs.elementpay.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-2xl font-semibold text-gray-900"
            onClick={() => setIsMenuOpen(false)}
          >
            Docs
          </a>
          {/* Legal Dropdown (as section) */}
          <div>
            <span className="block text-2xl font-bold text-[#4339CA] mb-2">Legal</span>
            <Link
              href="/privacy-policy"
              onClick={() => setIsMenuOpen(false)}
              className="block pl-4 text-lg text-gray-700 py-1 hover:text-blue-700"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-and-conditions"
              onClick={() => setIsMenuOpen(false)}
              className="block pl-4 text-lg text-gray-700 py-1 hover:text-blue-700"
            >
              Terms & Conditions
            </Link>
            <Link
              href="/code-of-conduct"
              onClick={() => setIsMenuOpen(false)}
              className="block pl-4 text-lg text-gray-700 py-1 hover:text-blue-700"
            >
              Code of Conduct
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
