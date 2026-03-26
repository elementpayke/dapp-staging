"use client";

import Link from "next/link";
import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useDisconnect } from "wagmi";
import { useMenuStore } from "@/lib/useMobileNav";
import { useAuthModalStore } from "@/stores/authModalStore";
import { useAuthStore } from "@/stores/authStore";
import { useWalletStore } from "@/lib/useWallet";
import { useTheme } from "@/lib/useTheme";

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

const LEGAL_LINKS = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/code-of-conduct", label: "Code of Conduct" },
];

const MobileNav = () => {
  const { isMenuOpen, setIsMenuOpen } = useMenuStore();
  const { openAuthModal, resumeAuthModal, setStep } = useAuthModalStore();
  const {
    isAuthenticated,
    user,
    clearAuth,
    isOtpVerified,
    isWalletRegistered,
  } = useAuthStore();
  const { logout: privyLogout } = usePrivy();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { disconnect: storeDisconnect } = useWalletStore();
  const { theme, toggle: toggleTheme, mounted } = useTheme();
  const router = useRouter();

  const close = useCallback(() => setIsMenuOpen(false), [setIsMenuOpen]);

  const handleLogout = useCallback(async () => {
    close();
    try {
      await privyLogout();
    } catch (err) {
      console.warn("[MobileNav] Privy logout error:", err);
    }
    wagmiDisconnect();
    storeDisconnect();
    clearAuth();
    localStorage.removeItem("wallet-storage");
    router.push("/");
  }, [close, privyLogout, wagmiDisconnect, storeDisconnect, clearAuth, router]);

  const handleAuthClick = useCallback(() => {
    close();
    if (isOtpVerified && !isWalletRegistered) {
      setStep("wallet-choice");
      resumeAuthModal();
    } else {
      openAuthModal();
    }
  }, [close, isOtpVerified, isWalletRegistered, setStep, resumeAuthModal, openAuthModal]);

  const initials = user?.email ? user.email.charAt(0).toUpperCase() : "?";

  return (
    <>
      {/*
       * Dim backdrop — tap anywhere outside the drawer to close.
       * Fades in/out via opacity transition; pointer-events gated by isMenuOpen.
       */}
      <div
        className={`md:hidden fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm transition-opacity duration-200 landing-page ${
          isMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={close}
        aria-hidden="true"
      />

      {/*
       * Drawer — slides in from the left, same width as the dashboard sidebar.
       * Uses translate instead of display:none so the CSS transition runs.
       */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-screen w-72 z-[100] landing-page
          bg-[var(--landing-card-bg)] border-r border-[var(--landing-card-border)]
          flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        aria-label="Mobile navigation"
      >
        {/* ── Drawer header ────────────────────────────────────────── */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-[var(--landing-card-border)] flex-shrink-0">
          <Link
            href="/"
            onClick={close}
            className="flex items-center gap-2.5"
            aria-label="ElementPay home"
          >
            <div className="w-9 h-9 rounded-xl bg-[var(--landing-accent)] flex items-center justify-center">
              <div className="w-4 h-4 rounded-md bg-white" />
            </div>
            <span className="text-lg font-bold text-[var(--landing-heading)] tracking-tight">
              ElementPay
            </span>
          </Link>

          {/* Large close button — easy to tap */}
          <button
            onClick={close}
            className="flex items-center justify-center w-10 h-10 rounded-xl
              text-[var(--landing-body)] hover:text-[var(--landing-heading)]
              hover:bg-[var(--landing-input-bg)] transition-colors"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* ── Nav links ────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          {/* Home */}
          <Link
            href="/"
            onClick={close}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-[var(--landing-heading)] font-semibold hover:bg-[var(--landing-input-bg)] transition-colors"
          >
            Home
          </Link>

          {/* Main links */}
          {NAV_LINKS.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-[var(--landing-heading)] font-semibold hover:bg-[var(--landing-input-bg)] transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                onClick={close}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-[var(--landing-heading)] font-semibold hover:bg-[var(--landing-input-bg)] transition-colors"
              >
                {item.label}
              </Link>
            )
          )}

          {/* Legal section */}
          <div className="pt-4">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--landing-muted)]">
              Legal
            </p>
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="flex items-center px-3 py-2.5 rounded-xl text-sm text-[var(--landing-body)] hover:text-[var(--landing-heading)] hover:bg-[var(--landing-input-bg)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/*
           * Auth CTA — only shown when the user is NOT yet authenticated.
           * Once isOtpVerified is true the user profile footer below handles
           * all auth-related actions.
           */}
          {!isOtpVerified && (
            <div className="pt-5 mt-2 border-t border-[var(--landing-card-border)] space-y-2.5">
              <button
                onClick={handleAuthClick}
                className="flex items-center justify-center w-full py-3 px-6 rounded-xl
                  bg-[var(--landing-accent)] hover:bg-[var(--landing-accent-hover)]
                  text-white font-semibold transition-colors"
              >
                Get Started
              </button>
              <button
                onClick={handleAuthClick}
                className="flex items-center justify-center w-full py-3 px-6 rounded-xl
                  font-medium text-[var(--landing-body)] hover:text-[var(--landing-heading)]
                  hover:bg-[var(--landing-input-bg)] transition-colors
                  border border-[var(--landing-card-border)]"
              >
                Sign In
              </button>
            </div>
          )}

          {/*
           * Wallet step CTA — shown mid-auth (OTP done but wallet not yet connected).
           */}
          {isOtpVerified && !isWalletRegistered && (
            <div className="pt-5 mt-2 border-t border-[var(--landing-card-border)]">
              <button
                onClick={handleAuthClick}
                className="flex items-center justify-center w-full py-3 px-6 rounded-xl
                  bg-[var(--landing-accent)] hover:bg-[var(--landing-accent-hover)]
                  text-white font-semibold transition-colors"
              >
                Connect Wallet
              </button>
            </div>
          )}

          {/* Dashboard shortcut — shown when fully authenticated */}
          {isAuthenticated && isWalletRegistered && (
            <div className="pt-5 mt-2 border-t border-[var(--landing-card-border)]">
              <Link
                href="/dashboard"
                onClick={close}
                className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl
                  bg-[var(--landing-accent)] hover:bg-[var(--landing-accent-hover)]
                  text-white font-semibold transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            </div>
          )}
        </nav>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <div className="border-t border-[var(--landing-card-border)] flex-shrink-0">
          {/*
           * User profile row — shown after step 2 (isOtpVerified).
           * Mirrors the dashboard sidebar footer exactly:
           *   [Avatar]  [email / status]  [logout icon]
           */}
          {isOtpVerified && (
            <div className="px-4 py-3 border-b border-[var(--landing-card-border)]">
              <div className="flex items-center gap-3">
                {/* Avatar initial circle */}
                <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center
                  rounded-full bg-[var(--landing-accent)] text-white font-semibold text-sm select-none">
                  {initials}
                </div>

                {/* Email + status */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium text-[var(--landing-heading)] truncate"
                    title={user?.email}
                  >
                    {user?.email || ""}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        isOtpVerified && isWalletRegistered
                          ? "bg-emerald-500"
                          : "bg-yellow-400 animate-pulse"
                      }`}
                    />
                    <span className="text-xs text-[var(--landing-muted)]">
                      {isOtpVerified && isWalletRegistered
                        ? "Signed in"
                        : "Awaiting wallet"}
                    </span>
                  </div>
                </div>

                {/* Logout icon button */}
                <button
                  onClick={handleLogout}
                  className="flex-shrink-0 flex items-center justify-center w-9 h-9
                    rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                  aria-label="Log out"
                >
                  <LogOut
                    size={18}
                    className="text-[var(--landing-muted)] group-hover:text-red-500 transition-colors"
                  />
                </button>
              </div>
            </div>
          )}

          {/* Theme toggle */}
          <div className="p-4">
            {mounted && (
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl
                  text-[var(--landing-body)] hover:bg-[var(--landing-input-bg)] transition-colors"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? (
                  <Sun size={18} className="text-[var(--landing-muted)]" />
                ) : (
                  <Moon size={18} className="text-[var(--landing-muted)]" />
                )}
                <span className="text-sm font-medium">
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default MobileNav;
