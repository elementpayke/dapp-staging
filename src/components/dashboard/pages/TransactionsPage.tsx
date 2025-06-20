import { FC, useEffect, useState } from "react";
import { Copy, Search, Filter } from "lucide-react";
import axios from "axios";
import { Order, Tx } from "@/types/types";
import { useWallet } from "@/hooks/useWallet";

interface ExtendedTx extends Tx {
  receiverDisplay: string;
  date: string;
}

const TransactionList: FC<{ walletAddress: string | null }> = ({ walletAddress }) => {
  if (!walletAddress) {
    return <p className="px-4">No wallet address provided</p>;
  }
  
  const [transactions, setTransactions] = useState<ExtendedTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Group transactions by date
  const groupTransactionsByDate = (transactions: ExtendedTx[]) => {
    const grouped: { [key: string]: ExtendedTx[] } = {};
    
    transactions.forEach((tx) => {
      const date = tx.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(tx);
    });
    
    return grouped;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today, " + date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday, " + date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } else {
      return date.toLocaleDateString('en-GB', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    }
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await axios.get<Order[]>(`${process.env.NEXT_PUBLIC_API_URL}/orders/wallet`, {
          params: { wallet_address: walletAddress },
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_AGGR_API_KEY,
          },
        });

        const mapped: ExtendedTx[] = res.data.map((order) => {
          const createdDate = new Date(order.created_at);
          
          return {
            id: order.order_id,
            name: order.order_type === 0 ? "OnRamp" : "OffRamp",
            time: createdDate.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            }),
            date: formatDate(order.created_at),
            hash: order.settlement_transaction_hash
              ? `${order.settlement_transaction_hash.slice(0, 10)}...${order.settlement_transaction_hash.slice(-6)}`
              : order.refund_transaction_hash
                ? `${order.refund_transaction_hash.slice(0, 10)}...${order.refund_transaction_hash.slice(-6)}`
                : "—",
            fullHash: order.settlement_transaction_hash || order.refund_transaction_hash || "—",
            status: order.status === "refunded" ? "FAILED" : order.status.toUpperCase(),
            description: order.phone_number
              ? `To ${order.phone_number}`
              : `Token: ${order.token}`,
            amount: `${order.amount_fiat.toFixed(2)} KES`,
            receiverDisplay: order.receiver_name || order.phone_number || "Unknown",
          };
        });

        // Sort by created_at in descending order (newest first)
        mapped.sort((a, b) => new Date(res.data.find(o => o.order_id === b.id)?.created_at || 0).getTime() - 
                            new Date(res.data.find(o => o.order_id === a.id)?.created_at || 0).getTime());
        
        setTransactions(mapped);
      } catch (err) {
        console.error("Failed to fetch transactions", err);
      } finally {
        setLoading(false);
      }
    };

    if (walletAddress) fetchTransactions();
  }, [walletAddress]);

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(tx => 
    tx.receiverDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedTransactions = groupTransactionsByDate(filteredTransactions);

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
          You&apos;re connected with{" "}
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Transactions</h1>
        
        {/* Desktop Search and Filter */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search transactions"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-64"
            />
          </div>
          {/* Filter Button */}
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {/* Mobile Search and Filter */}
        <div className="sm:hidden space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search transactions"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Transaction Groups */}
      <div className="space-y-4 sm:space-y-6">
        {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
          <div key={date} className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Date Header */}
            <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
              <h3 className="text-sm font-medium text-gray-700">{date}</h3>
            </div>
            
            {/* Desktop Transactions */}
            <div className="hidden sm:block divide-y divide-gray-100">
              {dayTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Left: Name and Time */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {tx.receiverDisplay}
                        </div>
                        <div className="text-xs text-gray-500">
                          Today, {tx.time}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center: Transaction Hash with Copy */}
                  <div className="flex-1 flex justify-center">
                    <button
                      className="flex items-center gap-2 group"
                      onClick={() => navigator.clipboard.writeText(tx.fullHash)}
                      title="Click to copy transaction hash"
                    >
                      <Copy className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
                        {tx.hash}
                      </span>
                    </button>
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0 mx-6">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      tx.status === 'FAILED' || tx.status === 'DECLINED'
                        ? 'bg-red-100 text-red-700'
                        : tx.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {tx.status === 'SETTLED' ? 'Success' : tx.status === 'FAILED' ? 'Declined' : tx.status}
                    </span>
                  </div>

                  {/* Right: Description/Service */}
                  <div className="flex-1 text-center">
                    <span className="text-sm text-gray-600">
                      {tx.name === 'OffRamp' ? tx.receiverDisplay : 'Paybill'}
                    </span>
                  </div>

                  {/* Far Right: Amount */}
                  <div className="flex-shrink-0 text-right min-w-0">
                    <span className={`text-sm font-medium ${
                      tx.status === 'FAILED' || tx.status === 'DECLINED' 
                        ? 'text-red-600' 
                        : 'text-black'
                    }`}>
                      KE {tx.amount.replace(' KES', '')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Transactions */}
            <div className="sm:hidden divide-y divide-gray-100">
              {dayTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Top Row: Name/Service and Amount */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {tx.receiverDisplay}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Today, {tx.time}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <span className={`text-sm font-medium ${
                        tx.status === 'FAILED' || tx.status === 'DECLINED' 
                          ? 'text-red-600' 
                          : 'text-black'
                      }`}>
                        KE {tx.amount.replace(' KES', '')}
                      </span>
                    </div>
                  </div>

                  {/* Second Row: Transaction Hash */}
                  <div className="mb-3">
                    <button
                      className="flex items-center gap-2 w-full p-2 bg-gray-50 rounded-lg group"
                      onClick={() => navigator.clipboard.writeText(tx.fullHash)}
                      title="Click to copy transaction hash"
                    >
                      <Copy className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                      <span className="text-xs text-gray-600 group-hover:text-blue-600 transition-colors truncate">
                        {tx.hash}
                      </span>
                    </button>
                  </div>

                  {/* Bottom Row: Status and Service */}
                  <div className="flex justify-between items-center">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      tx.status === 'FAILED' || tx.status === 'DECLINED'
                        ? 'bg-red-100 text-red-700'
                        : tx.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {tx.status === 'SETTLED' ? 'Success' : tx.status === 'FAILED' ? 'Declined' : tx.status}
                    </span>
                    <span className="text-xs text-gray-600">
                      {tx.name === 'OffRamp' ? tx.receiverDisplay : 'Paybill'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {filteredTransactions.length > 0 && (
        <div className="flex justify-center items-center gap-1 sm:gap-2 mt-6 sm:mt-8 px-4">
          <button className="w-8 h-8 flex items-center justify-center rounded bg-blue-600 text-white text-sm font-medium">
            1
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 text-sm">
            2
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 text-sm">
            3
          </button>
          <button className="hidden sm:inline-flex w-8 h-8 items-center justify-center rounded hover:bg-gray-100 text-gray-600 text-sm">
            4
          </button>
          <button className="hidden sm:inline-flex w-8 h-8 items-center justify-center rounded hover:bg-gray-100 text-gray-600 text-sm">
            5
          </button>
          <button className="hidden sm:inline-flex w-8 h-8 items-center justify-center rounded hover:bg-gray-100 text-gray-600 text-sm">
            6
          </button>
          <span className="hidden sm:inline text-gray-400 text-sm">...</span>
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 text-sm">
            10
          </button>
        </div>
      )}
    </div>
  );
};

const TransactionsPage = () => {
  const { address } = useWallet();

  return (
    <TransactionList walletAddress={address} />
  );
};

export default TransactionsPage;