"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import OverviewPage from "@/components/dashboard/pages/OverviewPage";
import TransactionsPage from "@/components/dashboard/pages/TransactionsPage";
import WhatsAppPage from "@/components/dashboard/pages/WhatsAppPage";
import EmailPage from "@/components/dashboard/pages/EmailPage";
import KYCRequiredModal from "@/components/dashboard/KYCRequiredModal";
import { Bell, ChevronDown, LogOut, Moon, Sun } from "lucide-react";
import Image from "next/image";
import avatarPlaceholder from "@/assets/avatar-placeholder.svg";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useTheme } from "@/lib/useTheme";

type PageComponent =
  | "overview"
  | "transactions"
  | "wallets"
  | "support-whatsapp"
  | "support-email";

export default function Dashboard() {
  const { isConnected, disconnect } = useWallet();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const user = useAuthStore((s) => s.user);
  // user: { firstName, email, status }
  const [currentPage, setCurrentPage] = useState<PageComponent>("overview");
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const { theme, toggle: toggleTheme, mounted } = useTheme();

  // Redirect to home when not fully authenticated (OTP + wallet)
  // This is reactive — if isAuthenticated changes to false, user is bounced
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
        // Restore transaction data into the onboarding store so the
        // OverviewPage form is pre-filled when the user lands back.
        useOnboardingStore.getState().setLandingForm(txData);
        console.log("[Dashboard] Restored pending transaction to onboarding store:", txData);
      } catch {
        localStorage.removeItem("elementpay-pending-tx");
      }
    }
  }, []);

  // Show nothing while redirecting to avoid flicker
  if (!isAuthenticated) {
    return null;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "overview":
        return <OverviewPage />;
      case "transactions":
        return <TransactionsPage />;
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
    clearAuth();
    localStorage.removeItem("wallet-storage");
    router.push("/");
  };

  // Helper for avatar initial from email
  const getAvatarInitial = (email: string | undefined) => {
    if (!email) return "?";
    return email[0].toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar onPageChange={setCurrentPage} currentPage={currentPage} />

      {/* Main Content */}
      <div className="flex-1 w-full lg:ml-64">
        {/* Fixed Header */}
        <div className="bg-[var(--ep-bg-card)] py-3 px-4 sm:px-8 border-b border-[var(--ep-border)]">
          <nav className="flex justify-end items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 lg:hidden"></div>

            {/* Theme Toggle Button */}
            <button 
              className="p-2 hover:bg-[var(--ep-accent-muted)] rounded-full transition-colors flex items-center justify-center"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {mounted && theme === 'dark' ? (
                <Sun className="w-5 h-5 text-[var(--ep-muted)] hover:text-[var(--ep-heading)] transition-colors" />
              ) : (
                <Moon className="w-5 h-5 text-[var(--ep-muted)] hover:text-[var(--ep-heading)] transition-colors" />
              )}
            </button>

            <button className="p-2 hover:bg-[var(--ep-accent-muted)] rounded-full transition-colors">
              <Bell className="w-5 h-5 text-[var(--ep-muted)] hover:text-[var(--ep-heading)] transition-colors" />
            </button>

            {/* Profile avatar and dropdown */}
            <div className="flex items-center gap-3 relative">
              <div className="w-8 h-8 flex items-center justify-center bg-[var(--ep-accent-muted)] rounded-full text-[var(--ep-accent)] font-semibold text-sm">
                {getAvatarInitial(user?.email)}
              </div>
              <div className="relative">
                <button
                  className="flex items-center gap-1 hover:bg-[var(--ep-accent-subtle)] px-2 py-1 rounded-lg transition-colors"
                  onClick={() => setShowDropdown(!showDropdown)}
                  aria-haspopup="true"
                  aria-expanded={showDropdown}
                >
                  <span
                    className="font-medium text-sm text-[var(--ep-heading)] truncate max-w-[120px]"
                    title={user?.email || ""}
                  >
                    {user?.email || ""}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[var(--ep-muted)] transition-transform ${showDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-[var(--ep-bg-card)] rounded-xl shadow-[var(--ep-card-shadow-hover)] py-2 border border-[var(--ep-border)] z-dropdown">
                    <div className="px-4 py-2 border-b border-[var(--ep-border)]">
                      <div className="font-semibold text-sm text-[var(--ep-heading)]">{user?.email || ""}</div>
                      <div className="text-xs text-[var(--ep-muted)]">Status: Signed In</div>
                    </div>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-[var(--ep-body)] hover:bg-[var(--ep-accent-subtle)] transition-colors"
                      onClick={() => {/* Profile button logic */}}
                    >
                      Profile
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 inline mr-2" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>

        {renderPage()}
      </div>

      {/* KYC verification modal — triggered when a transaction exceeds limits */}
      <KYCRequiredModal />
    </div>
  );
}
