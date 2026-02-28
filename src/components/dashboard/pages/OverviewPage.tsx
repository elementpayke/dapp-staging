import React from "react";
import DashboardHeader from "../DashboardHeader";
import CryptoPrices from "../CryptoPrices";
import QuickActions from "../QuickActions";
import TransactionList from "../TransactionList";
import { useWallet } from "@/hooks/useWallet";

const OverviewPage = () => {
  const { address } = useWallet();

  return (
    <div className="space-y-0 overflow-y-auto max-h-[calc(100vh-64px)] bg-[var(--ep-bg)]">
      <div className="px-4 sm:px-8 pt-5 pb-4 space-y-4">
        <DashboardHeader />
        <CryptoPrices />
        <QuickActions />
      </div>
      {address && <TransactionList walletAddress={address} />}
    </div>
  );
};

export default OverviewPage;