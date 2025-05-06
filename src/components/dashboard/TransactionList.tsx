import { FC, useEffect, useState } from "react";
import { Copy } from "lucide-react";
import axios from "axios";
import { Order, Tx } from "@/types/types";

const TransactionList: FC<{ walletAddress: string | null }> = ({ walletAddress }) => {
  if (!walletAddress) {
    return <p className="px-4">No wallet address provided</p>;
  }
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await axios.get<Order[]>(`${process.env.NEXT_PUBLIC_API_URL}/orders/wallet`, {
          params: { wallet_address: walletAddress },
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_AGGR_API_KEY, // or however you inject it
          },
        });

        const mapped = res.data.map((order) => ({
          id: order.order_id,
          name: order.order_type === 0 ? "OnRamp" : "OffRamp",
          time: new Date(order.created_at).toLocaleString(),
          hash:
            order.settlement_transaction_hash
              ? `${order.settlement_transaction_hash.slice(0, 10)}...${order.settlement_transaction_hash.slice(-6)}`
              : order.refund_transaction_hash
                ? `${order.refund_transaction_hash.slice(0, 10)}...${order.refund_transaction_hash.slice(-6)}`
                : "—",

          fullHash:
            order.settlement_transaction_hash || order.refund_transaction_hash || "—",
          status: order.status === "refunded" ? "FAILED" : order.status.toUpperCase(),
          description: order.phone_number
            ? `To ${order.phone_number}`
            : `Token: ${order.token}`,
          amount: `${order.amount_fiat.toFixed(2)} ${order.currency}`,
        }));
        // log refund hash
        console.log("Refund transaction hash:", mapped);
        setTransactions(mapped);
      } catch (err) {
        console.error("Failed to fetch transactions", err);
      } finally {
        setLoading(false);
      }
    };

    if (walletAddress) fetchTransactions();
  }, [walletAddress]);

  if (loading) return <p className="px-4">Loading...</p>;
  if (!loading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-gray-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="120"
          height="120"
          viewBox="0 0 24 24"
          fill="none"
          className="mb-4"
        >
          <path
            d="M3 8C3 6.34315 4.34315 5 6 5H18C19.6569 5 21 6.34315 21 8V16C21 17.6569 19.6569 19 18 19H6C4.34315 19 3 17.6569 3 16V8Z"
            stroke="#d1d5db"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 10H21"
            stroke="#d1d5db"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M7 15H9"
            stroke="#9ca3af"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-700">
          No transactions yet
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          You're connected with{" "}
          <span className="text-black font-medium">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </span>
          <br />
          Once you send or receive crypto via Element Pay, your activity will appear here.
        </p>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">
          Send your first payment
        </button>
      </div>
    );
  }
  

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-4 sm:px-0">
        <h2 className="text-lg font-medium text-black">Recent transactions</h2>
        <button className="text-blue-600 hover:text-blue-700">View All</button>
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block bg-white rounded-lg overflow-hidden">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center px-6 py-4 border-b last:border-b-0 hover:bg-gray-50"
          >
            <div className="w-64">
              <div className="text-sm font-medium text-gray-900">{tx.name}</div>
              <div className="text-xs text-gray-500">{tx.time}</div>
            </div>

            <div className="flex items-center flex-1 text-gray-500">
              <button
              className="flex items-center gap-1 group"
              onClick={() => navigator.clipboard.writeText(tx.fullHash)}
              title="Click to copy transaction hash"
            >
              <Copy className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
              <span className="text-sm group-hover:text-blue-600">{tx.hash}</span>
            </button>
            </div>

            <div className="w-24 flex justify-center">
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                {tx.status}
              </span>
            </div>

            <div className="w-48 text-sm text-gray-600">{tx.description}</div>

            <div className="w-32 text-right">
              <span className="text-sm font-medium text-green-600">
                {tx.amount}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile View */}
      <div className="sm:hidden space-y-2 px-4">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="bg-white rounded-lg p-4 space-y-3 hover:bg-gray-50"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-gray-900">{tx.name}</div>
                <div className="text-xs text-gray-500">{tx.time}</div>
              </div>
              <span className="text-sm font-medium text-green-600">{tx.amount}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-500 bg-gray-50 p-2 rounded-lg">
              <Copy className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm truncate">{tx.hash}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                {tx.status}
              </span>
              <span className="text-sm text-gray-600">{tx.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionList;
