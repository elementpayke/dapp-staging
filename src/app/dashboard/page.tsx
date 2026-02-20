"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import OverviewPage from "@/components/dashboard/pages/OverviewPage";
import TransactionsPage from "@/components/dashboard/pages/TransactionsPage";
import WhatsAppPage from "@/components/dashboard/pages/WhatsAppPage";
import EmailPage from "@/components/dashboard/pages/EmailPage";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import Image from "next/image";
import avatarPlaceholder from "@/assets/avatar-placeholder.svg";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { useAuthStore } from "@/stores/authStore";
import { checkKYCStatus } from "@/services/auth";

type PageComponent =
  | "overview"
  | "transactions"
  | "wallets"
  | "support-whatsapp"
  | "support-email";

export default function Dashboard() {
  const { isConnected, ensName, address, disconnect } =
    useWallet();
  const { isAuthenticated, clearAuth, token, user, updateKYCStatus } = useAuthStore();
  const [currentPage, setCurrentPage] = useState<PageComponent>("overview");
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  // Redirect to home when neither wallet-connected nor authenticated
  useEffect(() => {
    if (!isConnected && !isAuthenticated) {
      router.push("/");
    }
  }, [isConnected, isAuthenticated, router]);

  /**
   * KYC status polling on dashboard entry.
   * Best point to GET /kyc/status:
   * - On dashboard mount (here) — catches users returning from SmileLinks
   * - On KYC callback page (already implemented)
   * - Could also poll periodically if status is "pending"
   *
   * The user profile isn't fully set up until kyc_status === "verified".
   * Until then, transaction limits may be restricted by the backend.
   */
  useEffect(() => {
    if (!token || !isAuthenticated) return;
    if (user?.kyc_status === "verified") return; // Already verified, skip

    const sessionId =
      typeof window !== "undefined"
        ? localStorage.getItem("elementpay-kyc-session")
        : null;

    if (!sessionId) {
      console.log("[Dashboard] No KYC session found — user may not have completed KYC yet");
      console.log("[Dashboard] Current KYC status:", user?.kyc_status ?? "unknown");
      return;
    }

    const pollKYC = async () => {
      try {
        const res = await checkKYCStatus(token, sessionId);
        console.log("[Dashboard] KYC poll result:", res);
        updateKYCStatus(res.kyc_status);

        if (res.kyc_status === "verified") {
          console.log("[Dashboard] KYC verified — user profile is now complete");
          localStorage.removeItem("elementpay-kyc-session");
        } else if (res.kyc_status === "pending") {
          // Poll again in 10 seconds
          console.log("[Dashboard] KYC still pending — will poll again in 10s");
          setTimeout(pollKYC, 10_000);
        }
      } catch (err) {
        console.warn("[Dashboard] KYC status check failed:", err);
      }
    };

    pollKYC();
  }, [token, isAuthenticated, user?.kyc_status, updateKYCStatus]);

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
  if (!isConnected && !isAuthenticated) {
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

  const handleDisconnect = async () => {
    setShowDropdown(false);
    await disconnect();
    clearAuth();
    router.push("/");
  };

  const truncateAddress = (addr: string | null | undefined): string => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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

            <div className="flex items-center gap-3 relative">
              <div className="w-8 h-8">
                <Image
                  src={avatarPlaceholder}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              </div>
              {address && (
                <div className="relative">
                  <button
                    className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
                    onClick={() => setShowDropdown(!showDropdown)}
                    aria-haspopup="true"
                    aria-expanded={showDropdown}
                  >
                    <span
                      className="font-medium text-sm text-gray-900 truncate max-w-[120px]"
                      title={address}
                    >
                      {ensName || truncateAddress(address)}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-600 transition-transform ${
                        showDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-dropdown">
                      <button
                        onClick={handleDisconnect}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4" />
                        Disconnect Wallet
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>

        {renderPage()}
      </div>
    </div>
  );
}
