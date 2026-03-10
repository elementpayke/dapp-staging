"use client";

import Link from "next/link";
import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, LogOut, LayoutDashboard } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useDisconnect } from "wagmi";
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

const MobileNav = () => {
  const { isMenuOpen, setIsMenuOpen } = useMenuStore();
  const { openAuthModal } = useAuthModalStore();
  const { isAuthenticated, user, clearAuth, isOtpVerified, isWalletRegistered } = useAuthStore();
  const { logout: privyLogout } = usePrivy();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { disconnect: storeDisconnect } = useWalletStore();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    setIsMenuOpen(false);
    try { await privyLogout(); } catch (err) { console.warn("[MobileNav] Privy logout error:", err); }
    wagmiDisconnect();
    storeDisconnect();
    clearAuth();
    localStorage.removeItem("wallet-storage");
    router.push("/");
  }, [setIsMenuOpen, privyLogout, wagmiDisconnect, storeDisconnect, clearAuth, router]);

  if (!isMenuOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 bg-[var(--landing-bg)] z-[100] landing-page isolate">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--landing-card-border)]">
          <Link
            href="/"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--landing-accent)] flex items-center justify-center">
              <div className="w-4 h-4 rounded bg-white" />
            </div>
            <span className="landing-display text-xl font-bold text-[var(--landing-heading)] tracking-tight">
              ElementPay
            </span>
          </Link>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2.5 text-[var(--landing-body)] hover:text-[var(--landing-heading)] rounded-xl hover:bg-[var(--landing-input-bg)] transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Nav Links */}
        <div className="flex-1 px-6 py-8 space-y-6 overflow-y-auto">
          <Link
            href="/"
            onClick={() => setIsMenuOpen(false)}
            className="block text-lg font-semibold text-[var(--landing-heading)]"
          >
            Home
          </Link>
          {NAV_LINKS.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="block text-lg font-semibold text-[var(--landing-heading)]"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="block text-lg font-semibold text-[var(--landing-heading)]"
              >
                {item.label}
              </Link>
            )
          )}

          {/* Legal sub-links */}
          <div>
            <span className="block text-sm font-bold text-[var(--landing-body)] uppercase tracking-wider mb-2">
              Legal
            </span>
            {[
              { href: "/privacy-policy", label: "Privacy Policy" },
              { href: "/terms-and-conditions", label: "Terms & Conditions" },
              { href: "/code-of-conduct", label: "Code of Conduct" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="block py-2 text-[var(--landing-body)] hover:text-[var(--landing-heading)]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth section */}
          <div className="pt-6 border-t border-[var(--landing-card-border)] space-y-3">
            {isOtpVerified ? (
              <>
                <p className="text-sm text-[var(--landing-muted)] mb-3">
                  Signed in as {user?.email}
                </p>
                {isAuthenticated && isWalletRegistered && (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-[var(--landing-accent)] text-white font-semibold hover:bg-[var(--landing-accent-hover)] transition-colors"
                    style={{ fontFamily: "var(--font-landing-display)" }}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-medium transition-colors"
                  style={{
                    border: "1px solid var(--landing-danger-fg)",
                    color: "var(--landing-danger-fg)",
                    fontFamily: "var(--font-landing-body)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "var(--landing-danger-hover-bg)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    openAuthModal();
                  }}
                  className="block w-full text-center py-3 px-6 rounded-xl bg-[var(--landing-accent)] text-white font-semibold hover:bg-[var(--landing-accent-hover)] transition-colors"
                  style={{ fontFamily: "var(--font-landing-display)" }}
                >
                  Get Started
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    openAuthModal();
                  }}
                  className="block w-full text-center py-3 px-6 rounded-xl font-medium hover:bg-[var(--landing-input-bg)] transition-colors"
                  style={{
                    border: "1px solid var(--landing-card-border)",
                    color: "var(--landing-body)",
                    fontFamily: "var(--font-landing-body)",
                  }}
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
