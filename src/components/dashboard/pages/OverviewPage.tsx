import React from "react";
import DashboardHeader from "../DashboardHeader";
import CryptoPrices from "../CryptoPrices";
import QuickActions from "../QuickActions";
import TransactionList from "../TransactionList";
import { useWallet } from "@/context/WalletContext";

const OverviewPage = () => {
  const { isConnected, ensName, address, disconnectWallet } = useWallet();
   
  return (
    <div className="p-4 sm:p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-64px)]">
      <DashboardHeader />
      <CryptoPrices />
      {/* <CryptoWallet /> */}
      <QuickActions />
      {/* <RecentContacts /> */}
      {address && <TransactionList walletAddress={address} />}
    </div>
  );
};

export default OverviewPage;
