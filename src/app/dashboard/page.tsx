import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import CryptoWallet from "@/components/dashboard/CryptoWallet";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentContacts from "@/components/dashboard/RecentContacts";
import TransactionList from "@/components/dashboard/TransactionList";
import CryptoPrices from "@/components/dashboard/CryptoPrices";
import { Bell } from "lucide-react";
import Image from "next/image";
import avatarPlaceholder from "@/assets/avatar-placeholder.svg";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 w-full lg:ml-64">
        {/* Fixed Header */}
        <div className="bg-white py-3 px-4 sm:px-8 border-b">
          {/* Top Navigation */}
          <nav className="flex justify-end items-center gap-4">
            {/* Added margin for mobile menu button */}
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
              <span className="font-medium text-sm text-gray-900">
                wallace.base
              </span>
            </div>
          </nav>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-64px)]">
          <DashboardHeader />
          <CryptoPrices />
          <CryptoWallet />
          <QuickActions />
          <RecentContacts />
          <TransactionList />
        </div>
      </div>
    </div>
  );
}
