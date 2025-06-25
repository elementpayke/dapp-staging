import { FC } from "react";
import TransactionRow from "./TransactionRow";

interface ExtendedTx {
  [key: string]: any;
}

interface GroupedTransactions {
  [date: string]: ExtendedTx[];
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
  filteredTransactions: ExtendedTx[];
  currentPage: number;
  setCurrentPage: (n: number) => void;
  totalPages: number;
  rowsPerPage: number;
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
}) => {
  return (
    <div>
      {/* Transaction Groups */}
      <div className="space-y-4 sm:space-y-6">
        {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
          <div key={date} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
              <h3 className="text-sm font-medium text-gray-700">{date}</h3>
            </div>
            <div className="divide-y divide-gray-100">
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
          <p className="text-gray-500">No transactions match your current filters.</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-blue-600 hover:text-blue-800 underline"
          >
            Clear filters to see all transactions
          </button>
        </div>
      )}
      {/* Pagination */}
      {filteredTransactions.length > 0 && totalPages > 1 && (
        <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2 mt-6 sm:mt-8 px-4">
          <button
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            &lt;
          </button>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`w-8 h-8 flex items-center justify-center rounded ${currentPage === page ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600"} text-sm font-medium`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          {totalPages > 10 && <span className="text-gray-400 text-sm">...</span>}
          <button
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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