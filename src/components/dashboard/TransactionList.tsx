import { FC, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Order, Tx } from "@/types/types";
import TransactionFilters from "./TransactionList/TransactionFilters";
import TransactionTable from "./TransactionList/TransactionTable";
import ClientOnly from "@/components/shared/ClientOnly";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

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
  rawDate: Date; // For date filtering
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
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
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

  // Fetch transactions function - memoized for reuse
  const fetchTransactions = useCallback(async () => {
    try {
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
              (settlementDate.getTime() - createdDate.getTime()) / 1000 / 60,
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
                10,
              )}...${order.settlement_transaction_hash.slice(-6)}`
            : order.refund_transaction_hash
              ? `${order.refund_transaction_hash.slice(
                  0,
                  10,
                )}...${order.refund_transaction_hash.slice(-6)}`
              : order.creation_transaction_hash
                ? `${order.creation_transaction_hash.slice(
                    0,
                    10,
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
          rawDate: createdDate, // Store raw date for filtering
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
  }, [walletAddress]);

  // Search by transaction hash
  const searchByTxHash = useCallback(async (txHash: string) => {
    try {
      const res = await axios.get<{
        status: string;
        message: string;
        data: Order;
      }>(`/api/element-pay/orders/tx/${encodeURIComponent(txHash)}`);

      if (res.data?.data) {
        const order = res.data.data;
        const createdDate = new Date(order.created_at);
        const settlementDate = order.updated_at
          ? new Date(order.updated_at)
          : null;

        const processingTime = settlementDate
          ? `${Math.round(
              (settlementDate.getTime() - createdDate.getTime()) / 1000 / 60,
            )}m`
          : undefined;

        const mappedTx: ExtendedTx = {
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
                10,
              )}...${order.settlement_transaction_hash.slice(-6)}`
            : order.refund_transaction_hash
              ? `${order.refund_transaction_hash.slice(
                  0,
                  10,
                )}...${order.refund_transaction_hash.slice(-6)}`
              : order.creation_transaction_hash
                ? `${order.creation_transaction_hash.slice(
                    0,
                    10,
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
          tokenSymbol: order.token,
          cryptoAmount: `${order.amount_crypto.toFixed(6)} ${order.token}`,
          exchangeRate: order.exchange_rate,
          paymentMethod: "M-pesa",
          direction: order.order_type === 0 ? "Receive" : "Send",
          processingTime,
          receiptNumber: undefined,
          invoiceId: order.invoice_id,
          orderType: order.order_type === 0 ? "OnRamp" : "OffRamp",
          rawDate: createdDate,
        };

        return mappedTx;
      }
      return null;
    } catch (err) {
      console.error("Failed to search by tx hash", err);
      return null;
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadTransactions = async () => {
      if (!ignore) {
        await fetchTransactions();
      }
    };

    if (walletAddress) loadTransactions();

    // Listen for custom event to refresh transactions
    const refreshHandler = () => {
      setLoading(true);
      fetchTransactions();
    };
    window.addEventListener("elementpay:refresh-transactions", refreshHandler);
    return () => {
      ignore = true;
      window.removeEventListener(
        "elementpay:refresh-transactions",
        refreshHandler,
      );
    };
  }, [walletAddress, fetchTransactions]);

  // Refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  // Check if search term looks like a tx hash (0x prefixed hex string)
  const isTxHashSearch = (term: string) => {
    return term.startsWith("0x") && term.length >= 10;
  };

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
    // Search filter - enhanced with tx hash search
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === "" ||
      tx.receiverDisplay.toLowerCase().includes(searchLower) ||
      tx.hash.toLowerCase().includes(searchLower) ||
      tx.fullHash.toLowerCase().includes(searchLower) || // Search full hash
      tx.status.toLowerCase().includes(searchLower) ||
      tx.receiptNumber?.toLowerCase().includes(searchLower) ||
      tx.tokenSymbol.toLowerCase().includes(searchLower) ||
      tx.invoiceId?.toLowerCase().includes(searchLower) ||
      tx.id.toLowerCase().includes(searchLower); // Search by order ID

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
    currentPage * rowsPerPage,
  );
  const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);

  // Reset to first page if search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsPerPage, walletAddress, filters, dateRange]);

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
    setDateRange(null);
  };

  // Get active filter count
  const activeFilterCount = Object.values(filters).reduce(
    (count, filterArray) => count + filterArray.length,
    0,
  );

  // Skeleton loading component for transaction rows
  const TransactionSkeleton = () => (
    <div className="w-full animate-pulse space-y-4 p-2 sm:p-4">
      {/* Skeleton date header */}
      <div className="h-4 w-32 bg-[var(--ep-border)] rounded-md" />
      
      {/* Skeleton transaction rows */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl bg-[var(--ep-bg-card)] border border-[var(--ep-border)]"
        >
          {/* Icon placeholder */}
          <div className="w-10 h-10 rounded-full bg-[var(--ep-border)] shrink-0" />
          
          {/* Text placeholders */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 w-28 bg-[var(--ep-border)] rounded-md" />
            <div className="h-3 w-40 bg-[var(--ep-border)] rounded-md opacity-60" />
          </div>
          
          {/* Amount placeholder */}
          <div className="text-right space-y-2 shrink-0">
            <div className="h-4 w-20 bg-[var(--ep-border)] rounded-md ml-auto" />
            <div className="h-3 w-14 bg-[var(--ep-border)] rounded-md ml-auto opacity-60" />
          </div>
        </div>
      ))}

      {/* Second date group skeleton */}
      <div className="h-4 w-44 bg-[var(--ep-border)] rounded-md mt-6" />
      {[...Array(3)].map((_, i) => (
        <div
          key={`g2-${i}`}
          className="flex items-center gap-3 p-3 rounded-xl bg-[var(--ep-bg-card)] border border-[var(--ep-border)]"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--ep-border)] shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 w-24 bg-[var(--ep-border)] rounded-md" />
            <div className="h-3 w-36 bg-[var(--ep-border)] rounded-md opacity-60" />
          </div>
          <div className="text-right space-y-2 shrink-0">
            <div className="h-4 w-16 bg-[var(--ep-border)] rounded-md ml-auto" />
            <div className="h-3 w-12 bg-[var(--ep-border)] rounded-md ml-auto opacity-60" />
          </div>
        </div>
      ))}
    </div>
  );

  if (!loading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-[var(--ep-muted)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="120"
          height="120"
          viewBox="0 0 24 24"
          fill="none"
          className="mb-4 opacity-40"
        >
          <path
            d="M3 8C3 6.34315 4.34315 5 6 5H18C19.6569 5 21 6.34315 21 8V16C21 17.6569 19.6569 19 18 19H6C4.34315 19 3 17.6569 3 16V8Z"
            stroke="var(--ep-border)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 10H21"
            stroke="var(--ep-border)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M7 15H9"
            stroke="var(--ep-muted)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <h3 className="text-lg font-semibold text-[var(--ep-heading)]">
          No transactions yet
        </h3>
        <p className="mt-2 text-sm text-[var(--ep-muted)]">
          You&apos;re connected with{" "}
          <span className="text-[var(--ep-accent)] font-medium">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </span>
          <br />
          Once you send or receive crypto via Element Pay, your activity will
          appear here.
        </p>
        <button className="mt-4 px-5 py-2.5 bg-[var(--ep-accent)] text-white text-sm rounded-full hover:opacity-90 transition font-medium">
          Send your first payment
        </button>
      </div>
    );
  }

  return (
    <ClientOnly fallback={<div className="p-4">Loading transactions...</div>}>
      <div className="w-full p-2 sm:p-4 bg-[var(--ep-bg)] min-h-screen">
        {/* Filters, search, refresh, pagination — always visible */}
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
          refreshing={refreshing}
          onRefresh={handleRefresh}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          totalTransactions={filteredTransactions.length}
        />

        {/* Transaction rows: skeleton while loading, real data otherwise */}
        {loading ? (
          <TransactionSkeleton />
        ) : (
          <TransactionTable
            groupedTransactions={groupedTransactions}
            filters={filters}
            clearFilters={clearFilters}
            filteredTransactions={filteredTransactions}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            hidePagination={true}
          />
        )}
      </div>
    </ClientOnly>
  );
};

export default TransactionList;
