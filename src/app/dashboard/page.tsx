"use client";
import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import OverviewPage from "@/components/dashboard/pages/OverviewPage";
import TransactionsPage from "@/components/dashboard/pages/TransactionsPage";
import WhatsAppPage from "@/components/dashboard/pages/WhatsAppPage";
import EmailPage from "@/components/dashboard/pages/EmailPage";
import { Bell } from "lucide-react";
import Image from "next/image";
import avatarPlaceholder from "@/assets/avatar-placeholder.svg";
import { useWallet } from "@/context/WalletContext";
import { Identity, Name } from "@coinbase/onchainkit/identity";
import { base } from "viem/chains";

type PageComponent =
  | "overview"
  | "transactions"
  | "wallets"
  | "cards"
  | "settings"
  | "support-whatsapp"
  | "support-email";

export default function Dashboard() {
  const { isConnected, ensName, address } = useWallet();
  const [currentPage, setCurrentPage] = useState<PageComponent>("overview");

  if (!isConnected) {
    return <div>You must connect your wallet to access the dashboard.</div>;
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
      case "cards":
      case "settings":
        return <div className="p-8">Page under construction</div>;
      default:
        return <OverviewPage />;
    }
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
            <div className="flex items-center gap-3">
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
                <Identity address={address} chain={base}>
                  <div className="flex items-center">
                    <Name
                      className="font-medium text-sm text-gray-900 truncate max-w-[120px]"
                      fallback={
                        <span
                          className="font-medium text-sm text-gray-900 truncate max-w-[120px]"
                          title={address}
                        >
                          {truncateAddress(address)}
                        </span>
                      }
                    />
                  </div>
                </Identity>
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
