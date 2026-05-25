"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import OverviewPage from "@/components/dashboard/pages/OverviewPage";
import TransactionsPage from "@/components/dashboard/pages/TransactionsPage";
import WhatsAppPage from "@/components/dashboard/pages/WhatsAppPage";
import EmailPage from "@/components/dashboard/pages/EmailPage";
import ProfilePage from "@/components/dashboard/pages/ProfilePage";
import KYCRequiredModal from "@/components/dashboard/KYCRequiredModal";
import { Bell, ChevronDown, LogOut, Menu, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useLogoutOverlayStore } from "@/stores/logoutOverlayStore";
import { useTheme } from "@/lib/useTheme";

type PageComponent =
  | "overview"
  | "transactions"
  | "wallets"
  | "profile"
  | "support-whatsapp"
  | "support-email";

export default function Dashboard() {
  const { isConnected, disconnect } = useWallet();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const user = useAuthStore((s) => s.user);

  const [currentPage, setCurrentPage] = useState<PageComponent>("overview");
  const [showDropdown, setShowDropdown] = useState(false);

  // ── Sidebar open state lifted here so the hamburger can live in the header ──
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const router = useRouter();
  const { theme, toggle: toggleTheme, mounted } = useTheme();

  // Redirect when not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Pre-fill: restore pending transaction from KYC callback flow
  useEffect(() => {
    if (typeof window === "undefined") return;
    const pendingTx = localStorage.getItem("elementpay-pending-tx");
    if (pendingTx) {
      try {
        const txData = JSON.parse(pendingTx);
        localStorage.removeItem("elementpay-pending-tx");
        useOnboardingStore.getState().setLandingForm(txData);
        console.log(
          "[Dashboard] Restored pending transaction to onboarding store:",
          txData
        );
      } catch {
        localStorage.removeItem("elementpay-pending-tx");
      }
    }
  }, []);

  if (!isAuthenticated) return null;

  const renderPage = () => {
    switch (currentPage) {
      case "overview":
        return <OverviewPage />;
      case "transactions":
        return <TransactionsPage />;
      case "profile":
        return <ProfilePage />;
      case "support-whatsapp":
        return <WhatsAppPage />;
      case "support-email":
        return <EmailPage />;
      case "wallets":
      default:
        return <OverviewPage />;
    }
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    setSidebarOpen(false);

    // Show full-screen loading overlay to prevent layout glitching
    useLogoutOverlayStore.getState().setLoggingOut(true);

    try {
      // Server-side logout to clear HTTP-only cookies
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    } catch {
      // best-effort
    }

    clearAuth();
    localStorage.removeItem("wallet-storage");
    router.push("/");

    // Clear overlay after navigation settles
    setTimeout(() => {
      useLogoutOverlayStore.getState().setLoggingOut(false);
    }, 2000);
  };

  const getAvatarInitial = (email: string | undefined) => {
    if (!email) return "?";
    return email[0].toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-[var(--ep-bg)]">
      {/*
       * Sidebar — isOpen/onClose are now controlled here so the hamburger
       * button can live inside the header below (proper layout, large tap target).
       * user + onLogout are forwarded so the sidebar can show a profile row
       * on mobile without the user needing to close the drawer first.
       */}
      <Sidebar
        onPageChange={setCurrentPage}
        currentPage={currentPage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 w-full lg:ml-64">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="bg-[var(--ep-bg-card)] py-3 px-4 sm:px-6 border-b border-[var(--ep-border)]">
          <nav className="flex items-center gap-2 sm:gap-3">
            {/*
             * Hamburger — mobile only, left-aligned inside the header.
             * Large tap target (44 × 44 px minimum) so it's easy to hit.
             */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center w-11 h-11 -ml-1.5 rounded-xl hover:bg-[var(--ep-accent-muted)] transition-colors flex-shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu size={22} className="text-[var(--ep-heading)]" />
            </button>

            {/* Push everything else to the right */}
            <div className="flex-1" />

            {/* Theme toggle — desktop only (mobile gets it inside the sidebar) */}
            <button
              className="hidden lg:flex items-center justify-center p-2 hover:bg-[var(--ep-accent-muted)] rounded-full transition-colors"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {mounted && theme === "dark" ? (
                <Sun className="w-5 h-5 text-[var(--ep-muted)]" />
              ) : (
                <Moon className="w-5 h-5 text-[var(--ep-muted)]" />
              )}
            </button>

            {/* Notifications */}
            <button className="flex items-center justify-center p-2 hover:bg-[var(--ep-accent-muted)] rounded-full transition-colors">
              <Bell className="w-5 h-5 text-[var(--ep-muted)]" />
            </button>

            {/* ── Avatar + dropdown (desktop) ───────────────────── */}
            <div className="relative">
              <button
                className="flex items-center gap-2 hover:bg-[var(--ep-accent-subtle)] px-2 py-1.5 rounded-xl transition-colors"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-haspopup="true"
                aria-expanded={showDropdown}
              >
                {/* Avatar initial */}
                <div className="w-8 h-8 flex items-center justify-center bg-[var(--ep-accent-muted)] rounded-full text-[var(--ep-accent)] font-semibold text-sm flex-shrink-0">
                  {getAvatarInitial(user?.email)}
                </div>

                {/* Email label — hidden on small screens, shown on sm+ */}
                <span
                  className="hidden sm:block font-medium text-sm text-[var(--ep-heading)] truncate max-w-[140px]"
                  title={user?.email || ""}
                >
                  {user?.email || ""}
                </span>

                <ChevronDown
                  className={`hidden sm:block w-4 h-4 text-[var(--ep-muted)] transition-transform flex-shrink-0 ${
                    showDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <>
                  {/* Click-away backdrop */}
                  <div
                    className="fixed inset-0 z-[4]"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-[var(--ep-bg-card)] rounded-xl shadow-[var(--ep-card-shadow-hover)] py-2 border border-[var(--ep-border)] z-dropdown">
                    <div className="px-4 py-2.5 border-b border-[var(--ep-border)]">
                      <div className="font-semibold text-sm text-[var(--ep-heading)]">
                        {user?.email || ""}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs text-[var(--ep-muted)]">
                          Signed In
                        </span>
                      </div>
                    </div>
                    <button
                      className="w-full text-left px-4 py-2.5 text-sm text-[var(--ep-body)] hover:bg-[var(--ep-accent-subtle)] transition-colors"
                      onClick={() => {
                        setCurrentPage("profile");
                        setShowDropdown(false);
                      }}
                    >
                      Profile
                    </button>
                    <button
                      className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>

        {renderPage()}
      </div>

      {/* KYC verification modal */}
      <KYCRequiredModal />
    </div>
  );
}
