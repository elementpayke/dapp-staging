import { FC } from "react";

interface FilterState {
  status: string[];
  direction: string[];
  paymentMethod: string[];
  token: string[];
}

interface TransactionFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  statuses: string[];
  directions: string[];
  paymentMethods: string[];
  tokens: string[];
  rowsPerPage: number;
  setRowsPerPage: (n: number) => void;
  activeFilterCount: number;
  handleFilterChange: (filterType: keyof FilterState, value: string) => void;
  clearFilters: () => void;
}

const TransactionFilters: FC<TransactionFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  showFilters,
  setShowFilters,
  filters,
  statuses,
  directions,
  paymentMethods,
  tokens,
  rowsPerPage,
  setRowsPerPage,
  activeFilterCount,
  handleFilterChange,
  clearFilters,
}) => {
  return (
    <div className="mb-4">
      {/* Desktop Search and Filter */}
      <div className="hidden sm:flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search transactions, receipts, tokens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-80"
          />
        </div>
        {/* Filter Button */}
        <div className="relative">
          <button 
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            onClick={() => setShowFilters(!showFilters)}
          >
            Filter
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {/* Filter Dropdown */}
          {showFilters && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-900">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all
                </button>
              </div>
              <div className="space-y-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {statuses.map(status => (
                      <button
                        key={status}
                        onClick={() => handleFilterChange('status', status)}
                        className={`px-3 py-1 text-xs rounded-full border ${
                          filters.status.includes(status)
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {status === 'SETTLED' ? 'Success' : status === 'FAILED' ? 'Declined' : status}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Direction Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
                  <div className="flex flex-wrap gap-2">
                    {directions.map(direction => (
                      <button
                        key={direction}
                        onClick={() => handleFilterChange('direction', direction)}
                        className={`px-3 py-1 text-xs rounded-full border ${
                          filters.direction.includes(direction)
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {direction}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Payment Method Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <div className="flex flex-wrap gap-2">
                    {paymentMethods.map(method => (
                      <button
                        key={method}
                        onClick={() => handleFilterChange('paymentMethod', method)}
                        className={`px-3 py-1 text-xs rounded-full border ${
                          filters.paymentMethod.includes(method)
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Token Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Token</label>
                  <div className="flex flex-wrap gap-2">
                    {tokens.map(token => (
                      <button
                        key={token}
                        onClick={() => handleFilterChange('token', token)}
                        className={`px-3 py-1 text-xs rounded-full border ${
                          filters.token.includes(token)
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {token}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Rows per page selector */}
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="rowsPerPage" className="text-sm text-gray-600">Show</label>
          <select
            id="rowsPerPage"
            value={rowsPerPage}
            onChange={e => setRowsPerPage(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value={5}>5</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-600">per page</span>
        </div>
      </div>
      {/* Mobile Search and Filter */}
      <div className="sm:hidden space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <button 
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          onClick={() => setShowFilters(!showFilters)}
        >
          Filter
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        {/* Rows per page selector for mobile */}
        <div className="flex items-center gap-2">
          <label htmlFor="rowsPerPageMobile" className="text-sm text-gray-600">Show</label>
          <select
            id="rowsPerPageMobile"
            value={rowsPerPage}
            onChange={e => setRowsPerPage(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value={5}>5</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-600">per page</span>
        </div>
      </div>
      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">Active filters:</span>
          {Object.entries(filters).map(([filterType, filterValues]) =>
            filterValues.map(value => (
              <span
                key={`${filterType}-${value}`}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                {value === 'SETTLED' ? 'Success' : value === 'FAILED' ? 'Declined' : value}
                <button
                  onClick={() => handleFilterChange(filterType as keyof FilterState, value)}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  ×
                </button>
              </span>
            ))
          )}
          <button
            onClick={clearFilters}
            className="text-xs text-blue-600 hover:text-blue-800 underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionFilters; 