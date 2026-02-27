"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import OverviewPage from "@/components/dashboard/pages/OverviewPage";
import TransactionsPage from "@/components/dashboard/pages/TransactionsPage";
import WhatsAppPage from "@/components/dashboard/pages/WhatsAppPage";
import EmailPage from "@/components/dashboard/pages/EmailPage";
import KYCRequiredModal from "@/components/dashboard/KYCRequiredModal";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import Image from "next/image";
import avatarPlaceholder from "@/assets/avatar-placeholder.svg";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { useAuthStore } from "@/stores/authStore";

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
        // Import the onboarding store and pre-populate
        // The OverviewPage will pick these up automatically
        localStorage.removeItem("elementpay-pending-tx");
        console.log("[Dashboard] Restored pending transaction:", txData);
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onPageChange={setCurrentPage} currentPage={currentPage} />

      {/* Main Content */}
      <div className="flex-1 w-full lg:ml-64">
        {/* Fixed Header */}
        <div className="bg-white py-3 px-4 sm:px-8 border-b">
          <nav className="flex justify-end items-center gap-4">
            <div className="w-8 h-8 lg:hidden"></div>

            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>

            {/* Profile avatar and dropdown */}
            <div className="flex items-center gap-3 relative">
              <div className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full text-gray-700 font-semibold text-lg">
                {getAvatarInitial(user?.email)}
              </div>
              <div className="relative">
                <button
                  className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
                  onClick={() => setShowDropdown(!showDropdown)}
                  aria-haspopup="true"
                  aria-expanded={showDropdown}
                >
                  <span
                    className="font-medium text-sm text-gray-900 truncate max-w-[120px]"
                    title={user?.email || ""}
                  >
                    {user?.email || ""}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-600 transition-transform ${showDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-2 ring-1 ring-black ring-opacity-5 focus:outline-none z-dropdown">
                    <div className="px-4 py-2 border-b">
                      <div className="font-semibold text-base text-gray-900">{user?.email || ""}</div>
                      <div className="text-sm text-gray-500"> Status: {"Signed In"}</div>
                    </div>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {/* Profile button logic */}}
                    >
                      Profile
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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
