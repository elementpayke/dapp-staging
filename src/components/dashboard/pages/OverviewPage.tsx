import React from "react";
import DashboardHeader from "../DashboardHeader";
import CryptoPrices from "../CryptoPrices";
import CryptoWallet from "../CryptoWallet";
import QuickActions from "../QuickActions";
import RecentContacts from "../RecentContacts";
import TransactionList from "../TransactionList";

const OverviewPage = () => {
  return (
    <div className="p-4 sm:p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-64px)]">
      <DashboardHeader />
      <CryptoPrices />
      {/* <CryptoWallet /> */}
      <QuickActions />
      {/* <RecentContacts /> */}
      <TransactionList />
    </div>
  );
};

export default OverviewPage;
