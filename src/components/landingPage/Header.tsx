"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, LayoutDashboard, LogOut, Wallet, UserCircle } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useDisconnect } from "wagmi";
import { useLockBodyScroll } from "@/lib/useScroll";
import MobileNav from "./MobileNav";
import { useMenuStore } from "@/lib/useMobileNav";
import { useAuthModalStore } from "@/stores/authModalStore";
import { useAuthStore } from "@/stores/authStore";
import { useWalletStore } from "@/lib/useWallet";

const NAV_LINKS = [
  { href: "/#services", label: "Services" },
  { href: "/#blog", label: "Blog" },
  { href: "/#faqs", label: "FAQs" },
  {
    href: "https://docs.elementpay.net/",
    label: "Documentation",
    external: true,
  },
];

const Header = () => {
  const { toggleMenu, isMenuOpen } = useMenuStore();
  useLockBodyScroll(isMenuOpen);
  const openAuthModal = useAuthModalStore((s) => s.openAuthModal);
  const resumeAuthModal = useAuthModalStore((s) => s.resumeAuthModal);
  const setStep = useAuthModalStore((s) => s.setStep);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isOtpVerified = useAuthStore((s) => s.isOtpVerified);
  const isWalletRegistered = useAuthStore((s) => s.isWalletRegistered);
  const userEmail = useAuthStore((s) => s.user?.email);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { logout: privyLogout } = usePrivy();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { disconnect: storeDisconnect } = useWalletStore();
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  console.log("Auth status:", 
    isOtpVerified, 
    isWalletRegistered
  )

  /** Open the auth modal, resuming at the wallet step if OTP is already done */
  const handleAuthClick = useCallback(() => {
    if (isOtpVerified && !isWalletRegistered) {
      setStep("wallet");
      resumeAuthModal();
    } else {
      openAuthModal();
    }
  }, [isOtpVerified, isWalletRegistered, setStep, resumeAuthModal, openAuthModal]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [dropdownOpen]);

  const handleLogout = useCallback(async () => {
    setDropdownOpen(false);
    try { await privyLogout(); } catch (err) { console.warn("[Header] Privy logout error:", err); }
    wagmiDisconnect();
    storeDisconnect();
    clearAuth();
    localStorage.removeItem("wallet-storage");
    router.push("/");
  }, [privyLogout, wagmiDisconnect, storeDisconnect, clearAuth, router]);

  // Avatar initials from email
  const initials = userEmail ? userEmail.charAt(0).toUpperCase() : "U";

  return (
    <header className="landing-page sticky top-0 z-30 border-b border-[var(--landing-card-border)]/60 bg-white/80 backdrop-blur-lg">
      <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8" aria-label="Main">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group"
            aria-label="ElementPay home"
          >
            <div className="w-9 h-9 rounded-xl bg-[var(--landing-accent)] flex items-center justify-center group-hover:opacity-90 transition-opacity">
              <div className="w-4 h-4 rounded-md bg-white" />
            </div>
            <span className=" text-xl font-bold text-[var(--landing-heading)] tracking-tight">
              ElementPay
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map((item) =>
              item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[var(--landing-muted)] hover:text-[var(--landing-heading)] transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium text-[var(--landing-muted)] hover:text-[var(--landing-heading)] transition-colors"
                >
                  {item.label}
                </Link>
              )
            )}
            <div className="relative group">
              <button
                type="button"
                className="text-sm font-medium text-[var(--landing-muted)] hover:text-[var(--landing-heading)] transition-colors flex items-center gap-1"
                aria-expanded="false"
                aria-haspopup="true"
              >
                Legal
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute left-0 mt-1 w-44 py-1 rounded-xl border border-[var(--landing-card-border)] bg-[var(--landing-card-bg)] shadow-[var(--landing-card-shadow)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-dropdown">
                <Link
                  href="/privacy-policy"
                  className="block px-4 py-2.5 text-sm text-[var(--landing-body)] hover:bg-[var(--landing-input-bg)] hover:text-[var(--landing-heading)] rounded-lg mx-1"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms-and-conditions"
                  className="block px-4 py-2.5 text-sm text-[var(--landing-body)] hover:bg-[var(--landing-input-bg)] hover:text-[var(--landing-heading)] rounded-lg mx-1"
                >
                  Terms & Conditions
                </Link>
                <Link
                  href="/code-of-conduct"
                  className="block px-4 py-2.5 text-sm text-[var(--landing-body)] hover:bg-[var(--landing-input-bg)] hover:text-[var(--landing-heading)] rounded-lg mx-1"
                >
                  Code of Conduct
                </Link>
              </div>
            </div>
          </div>

          <div className="flex-1" />
          <div className="flex items-center gap-3">
            { isOtpVerified ? (
              <div className="relative hidden md:block" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-[var(--landing-input-bg)] transition-colors"
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--landing-accent)] flex items-center justify-center text-white text-sm font-bold select-none">
                    {initials}
                  </div>
                  <svg
                    className={`w-4 h-4 text-[var(--landing-muted)] transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--landing-card-border)] bg-[var(--landing-card-bg)] shadow-lg py-1 z-[60]">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-[var(--landing-card-border)]">
                      <p className="text-sm font-medium text-[var(--landing-heading)] truncate">
                        {userEmail}
                      </p>
                      <div className="flex flex-row items-center mt-0.5">
                        <span 
                         className={`w-2.5 h-2.5 rounded-full mr-2 ${isOtpVerified && isWalletRegistered ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`}
                        ></span>
                      <p className="text-xs text-[var(--landing-muted)]">{isOtpVerified && isWalletRegistered ? "Signed in" : "Awaiting Wallet Connection"}</p>
                      </div>
                    </div>

                    {
                      isOtpVerified && isWalletRegistered && (
                      <>
                      <Link
                      href={isOtpVerified && isWalletRegistered ? "/dashboard" : ""}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--landing-body)] hover:bg-[var(--landing-input-bg)] hover:text-[var(--landing-heading)] transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>

                    <Link
                      href="#"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--landing-body)] hover:bg-[var(--landing-input-bg)] hover:text-[var(--landing-heading)] transition-colors"
                    >
                      <Wallet className="w-4 h-4" />
                      Wallets
                    </Link>

                    <Link
                      href="#"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--landing-body)] hover:bg-[var(--landing-input-bg)] hover:text-[var(--landing-heading)] transition-colors"
                    >
                      <UserCircle className="w-4 h-4" />
                      Profile
                    </Link></>
                      )
                    }

                    <div className="border-t border-[var(--landing-card-border)] mt-1 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Not authenticated: Sign In (ghost) + Get Started (primary) */}
                <button
                  type="button"
                  onClick={handleAuthClick}
                  className="hidden md:inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium text-[var(--landing-body)] hover:text-[var(--landing-heading)] transition-colors"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={handleAuthClick}
                  className="hidden md:inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-semibold text-white bg-[var(--landing-accent)] hover:bg-[var(--landing-accent-hover)] transition-colors shadow-sm"
                >
                  Get Started
                </button>
              </>
            )}
            <button
              type="button"
              className="md:hidden p-2.5 rounded-xl text-[var(--landing-body)] hover:bg-[var(--landing-input-bg)] transition-colors"
              onClick={() => toggleMenu()}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        <MobileNav />
      </nav>
    </header>
  );
};

export default Header;
