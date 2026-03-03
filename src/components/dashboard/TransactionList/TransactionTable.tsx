import { FC } from "react";
import TransactionRow from "./TransactionRow";

interface GroupedTransactions {
  [date: string]: any[];
}

interface FilterState {
  status: string[];
  direction: string[];
  paymentMethod: string[];
  token: string[];
}

interface TransactionTableProps {
  groupedTransactions: GroupedTransactions;
  filters: FilterState;
  clearFilters: () => void;
  filteredTransactions: any[];
  currentPage: number;
  setCurrentPage: (n: number) => void;
  totalPages: number;
  rowsPerPage: number;
  hidePagination?: boolean;
}

const TransactionTable: FC<TransactionTableProps> = ({
  groupedTransactions,
  filters,
  clearFilters,
  filteredTransactions,
  currentPage,
  setCurrentPage,
  totalPages,
  rowsPerPage,
  hidePagination = false,
}) => {
  return (
    <div className="w-full">
      {/* Transaction Groups */}
      <div className="space-y-4 sm:space-y-6 w-full">
        {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
          <div
            key={date}
            // overflow-hidden ensures child rows (e.g. red failed rows) are
            // clipped by the parent's rounded-xl corners instead of bleeding out.
            className="bg-[var(--ep-bg-card)] rounded-xl overflow-hidden shadow-[var(--ep-card-shadow)] border border-[var(--ep-border)] w-full"
          >
            <div className="px-4 sm:px-6 py-3 border-b border-[var(--ep-border)] bg-[var(--ep-accent-subtle)] rounded-t-xl">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--ep-muted)]">{date}</h3>
            </div>
            <div className="divide-y divide-[var(--ep-border)]">
              {dayTransactions.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* No Results Message */}
      {filteredTransactions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-[var(--ep-muted)]">
            No transactions match your current filters.
          </p>
          <button
            onClick={clearFilters}
            className="mt-2 text-[var(--ep-accent)] hover:underline"
          >
            Clear filters to see all transactions
          </button>
        </div>
      )}

      {/* Pagination - only show if not hidden */}
      {!hidePagination && filteredTransactions.length > 0 && totalPages > 1 && (
        <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2 mt-6 sm:mt-8 px-4">
          <button
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            &lt;
          </button>
          {Array.from(
            { length: Math.min(totalPages, 10) },
            (_, i) => i + 1,
          ).map((page) => (
            <button
              key={page}
              className={`w-8 h-8 flex items-center justify-center rounded ${currentPage === page ? "bg-[var(--ep-accent)] text-white" : "hover:bg-[var(--ep-accent-subtle)] text-[var(--ep-muted)]"} text-sm font-medium`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          {totalPages > 10 && (
            <span className="text-gray-400 text-sm">...</span>
          )}
          <button
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
