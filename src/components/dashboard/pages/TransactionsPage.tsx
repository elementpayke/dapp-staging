import { FC } from "react";
import { useWallet } from "@/hooks/useWallet";
import TransactionList from "../TransactionList";

const TransactionsPage: FC = () => {
  const { address } = useWallet();
  return <TransactionList walletAddress={address || null} />;
};

export default TransactionsPage;