"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import OverviewPage from "@/components/dashboard/pages/OverviewPage";
import TransactionsPage from "@/components/dashboard/pages/TransactionsPage";
import WhatsAppPage from "@/components/dashboard/pages/WhatsAppPage";
import EmailPage from "@/components/dashboard/pages/EmailPage";
import HakibaPage from "@/components/dashboard/pages/HakibaPage";
import HakibaLoanPage from "@/components/dashboard/pages/HakibaLoansPage";
import CreditScorePage from "@/components/dashboard/pages/CreditScorePage";
import ReferralPage from "@/components/dashboard/pages/ReferalPage";
import { Bell, ChevronDown, LogOut, ShieldAlert, Loader2 } from "lucide-react";
import Image from "next/image";
import avatarPlaceholder from "@/assets/avatar-placeholder.svg";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";

type PageComponent =
  | "overview"
  | "transactions"
  | "hakiba"
  | "loans"
  | "credit-score"
  | "wallets"
  | "cards"
  | "settings"
  | "support-whatsapp"
  | "support-email"
  | "referral";

export default function Dashboard() {
  const { isConnected, ensName, address, disconnectWallet } = useWallet();
  const [currentPage, setCurrentPage] = useState<PageComponent>("overview");
  const [showDropdown, setShowDropdown] = useState(false); // Dropdown state
  const router = useRouter();
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  useEffect(() => {
    // Simulate connection check delay (you can remove this timeout if using actual loading state from context)
    const timer = setTimeout(() => {
      setIsCheckingConnection(false);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  if (isCheckingConnection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Checking wallet connection...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center bg-white rounded-xl p-8 shadow-lg">
          <div className="mb-4">
            <ShieldAlert className="w-12 h-12 text-yellow-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Wallet Not Connected
          </h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to access the dashboard features.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }


  const renderPage = () => {
    switch (currentPage) {
      case "overview":
        return <OverviewPage />;
      case "transactions":
        return <TransactionsPage />;
      case "hakiba":
        return <HakibaPage />;
      case "loans":
        return <HakibaLoanPage />;
      case "credit-score":
        return <CreditScorePage />;
      case "support-whatsapp":
        return <WhatsAppPage />;
      case "support-email":
        return <EmailPage />;
      case "wallets":
      case "cards":
      case "settings":
        return <div className="p-8">Page under construction</div>;
      case "referral":
        return <ReferralPage />;
      default:
        return <OverviewPage />;
    }
  }; // Added missing closing brace

  const handleDisconnect = () => {
    disconnectWallet();
    setShowDropdown(false);
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
          {/* Top Navigation */}
          <nav className="flex justify-end items-center gap-4">
            <div className="w-8 h-8 lg:hidden"></div>

            {/* Notification Bell */}
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>

            {/* User Profile */}
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
                    <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
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

        {/* Render current page */}
        {renderPage()}
      </div>
    </div>
  );
}
