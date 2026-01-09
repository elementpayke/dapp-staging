import { FC, useEffect, useState } from "react";
import { Copy, Search, Filter, ChevronDown, X } from "lucide-react";
import axios from "axios";
import { Order, Tx } from "@/types/types";
import TransactionFilters from "./TransactionList/TransactionFilters";
import TransactionTable from "./TransactionList/TransactionTable";
import ClientOnly from "@/components/shared/ClientOnly";

interface ExtendedTx extends Tx {
  receiverDisplay: string;
  date: string;
  // New enhanced fields
  tokenSymbol: string;
  cryptoAmount: string;
  exchangeRate?: number;
  paymentMethod: string;
  direction: "Send" | "Receive";
  processingTime?: string;
  receiptNumber?: string;
  invoiceId?: string;
  orderType: string;
}

interface FilterState {
  status: string[];
  direction: string[];
  paymentMethod: string[];
  token: string[];
}

const TransactionList: FC<{ walletAddress: string | null }> = ({
  walletAddress,
}) => {
  if (!walletAddress) {
    return <p className="px-4">No wallet address provided</p>;
  }

  const [transactions, setTransactions] = useState<ExtendedTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    direction: [],
    paymentMethod: [],
    token: [],
  });

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
      return (
        "Today, " +
        date.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    } else if (date.toDateString() === yesterday.toDateString()) {
      return (
        "Yesterday, " +
        date.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    } else {
      return date.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // Use server-side API route to avoid exposing API key
        const res = await axios.get<{
          status: string;
          message: string;
          data: Order[];
        }>(`/api/element-pay/orders/wallet`, {
          params: { wallet_address: walletAddress },
        });

        const mapped: ExtendedTx[] = res.data?.data?.map((order: Order) => {
          const createdDate = new Date(order.created_at);
          const settlementDate = order.updated_at
            ? new Date(order.updated_at)
            : null;

          // Calculate processing time
          const processingTime = settlementDate
            ? `${Math.round(
                (settlementDate.getTime() - createdDate.getTime()) / 1000 / 60
              )}m`
            : undefined;

          return {
            id: order.order_id,
            name: order.order_type === 0 ? "OnRamp" : "OffRamp",
            time: createdDate.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
            date: formatDate(order.created_at),
            hash: order.settlement_transaction_hash
              ? `${order.settlement_transaction_hash.slice(
                  0,
                  10
                )}...${order.settlement_transaction_hash.slice(-6)}`
              : order.refund_transaction_hash
              ? `${order.refund_transaction_hash.slice(
                  0,
                  10
                )}...${order.refund_transaction_hash.slice(-6)}`
              : order.creation_transaction_hash
              ? `${order.creation_transaction_hash.slice(
                  0,
                  10
                )}...${order.creation_transaction_hash.slice(-6)}`
              : "—",
            fullHash:
              order.settlement_transaction_hash ||
              order.refund_transaction_hash ||
              order.creation_transaction_hash ||
              "—",
            status:
              order.status === "refunded"
                ? "FAILED"
                : order.status.toUpperCase(),
            description:
              order.receiver_name || order.phone_number
                ? `To ${order.receiver_name || order.phone_number}`
                : `Token: ${order.token}`,
            amount: `${order.amount_fiat.toFixed(2)} KES`,
            receiverDisplay:
              order.receiver_name || order.phone_number || "Unknown",

            // New enhanced fields
            tokenSymbol: order.token,
            cryptoAmount: `${order.amount_crypto.toFixed(6)} ${order.token}`,
            exchangeRate: order.exchange_rate,
            paymentMethod: "M-pesa",
            direction: order.order_type === 0 ? "Receive" : "Send",
            processingTime,
            receiptNumber: undefined,
            invoiceId: order.invoice_id,
            orderType: order.order_type === 0 ? "OnRamp" : "OffRamp",
          };
        });

        // Sort by created_at in descending order (newest first)
        mapped.sort((a, b) => {
          const bOrder = res.data.data.find((o: Order) => o.order_id === b.id);
          const aOrder = res.data.data.find((o: Order) => o.order_id === a.id);
          return (
            new Date(bOrder?.created_at || 0).getTime() -
            new Date(aOrder?.created_at || 0).getTime()
          );
        });

        setTransactions(mapped);
      } catch (err) {
        console.error("Failed to fetch transactions", err);
      } finally {
        setLoading(false);
      }
    };

    if (walletAddress) fetchTransactions();
  }, [walletAddress]);

  // Get unique filter options
  const getFilterOptions = () => {
    const statuses = [...new Set(transactions.map((tx) => tx.status))];
    const directions = [...new Set(transactions.map((tx) => tx.direction))];
    const paymentMethods = [
      ...new Set(transactions.map((tx) => tx.paymentMethod)),
    ];
    const tokens = [...new Set(transactions.map((tx) => tx.tokenSymbol))];

    return { statuses, directions, paymentMethods, tokens };
  };

  const { statuses, directions, paymentMethods, tokens } = getFilterOptions();

  // Filter transactions based on search term and filters
  const filteredTransactions = transactions.filter((tx) => {
    // Search filter
    const matchesSearch =
      searchTerm === "" ||
      tx.receiverDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.tokenSymbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.invoiceId?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      filters.status.length === 0 || filters.status.includes(tx.status);

    // Direction filter
    const matchesDirection =
      filters.direction.length === 0 ||
      filters.direction.includes(tx.direction);

    // Payment method filter
    const matchesPaymentMethod =
      filters.paymentMethod.length === 0 ||
      filters.paymentMethod.includes(tx.paymentMethod);

    // Token filter
    const matchesToken =
      filters.token.length === 0 || filters.token.includes(tx.tokenSymbol);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesDirection &&
      matchesPaymentMethod &&
      matchesToken
    );
  });

  // Calculate paginated transactions
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);

  // Reset to first page if search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsPerPage, walletAddress, filters]);

  const groupedTransactions = groupTransactionsByDate(paginatedTransactions);

  // Handle filter changes
  const handleFilterChange = (filterType: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter((item) => item !== value)
        : [...prev[filterType], value],
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: [],
      direction: [],
      paymentMethod: [],
      token: [],
    });
  };

  // Get active filter count
  const activeFilterCount = Object.values(filters).reduce(
    (count, filterArray) => count + filterArray.length,
    0
  );

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
          Once you send or receive crypto via Element Pay, your activity will
          appear here.
        </p>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">
          Send your first payment
        </button>
      </div>
    );
  }

  return (
    <ClientOnly fallback={<div className="p-4">Loading transactions...</div>}>
      <div className="max-w-7xl p-2 sm:p-4 bg-gray-50 min-h-screen">
        <TransactionFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          filters={filters}
          setFilters={setFilters}
          statuses={statuses}
          directions={directions}
          paymentMethods={paymentMethods}
          tokens={tokens}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          activeFilterCount={activeFilterCount}
          handleFilterChange={handleFilterChange}
          clearFilters={clearFilters}
        />
        <TransactionTable
          groupedTransactions={groupedTransactions}
          filters={filters}
          clearFilters={clearFilters}
          filteredTransactions={filteredTransactions}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
        />
      </div>
    </ClientOnly>
  );
};

export default TransactionList;
