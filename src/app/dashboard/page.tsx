"use client";
import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import OverviewPage from "@/components/dashboard/pages/OverviewPage";
import TransactionsPage from "@/components/dashboard/pages/TransactionsPage";
import WhatsAppPage from "@/components/dashboard/pages/WhatsAppPage";
import EmailPage from "@/components/dashboard/pages/EmailPage";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import Image from "next/image";
import avatarPlaceholder from "@/assets/avatar-placeholder.svg";
import { redirect } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";

type PageComponent =
  | "overview"
  | "transactions"
  | "wallets"
  | "support-whatsapp"
  | "support-email";

export default function Dashboard() {
  const { isConnected, ensName, address, disconnectWallet } = useWallet();
  const [currentPage, setCurrentPage] = useState<PageComponent>("overview");
  const [showDropdown, setShowDropdown] = useState(false);

  if (!isConnected) {
    redirect("/");
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

  const handleDisconnect = () => {
    disconnectWallet();
    setShowDropdown(false);
    window.location.reload();
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
                      className={`w-4 h-4 text-gray-600 transition-transform ${showDropdown ? "rotate-180" : ""
                        }`}
                    />
                  </button>

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

        {renderPage()}
      </div>
    </div>
  );
}
