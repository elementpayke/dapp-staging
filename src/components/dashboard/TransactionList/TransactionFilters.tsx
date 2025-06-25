"use client";

import React, { FC } from "react";

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
}: TransactionFiltersProps) => {
  // Helper function to format token display
  const formatTokenDisplay = (token: string) => {
    return token.replace(/_/g, ' ');
  };

  // Mobile-optimized filter content
  const MobileFilterContent = () => (
    <div className="space-y-6">
      {/* Payment Method Filter - Most important, shown first on mobile */}
      <div>
        <label className="block text-base font-medium text-gray-900 mb-3">Payment Method</label>
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.map(method => (
            <button
              key={method}
              onClick={() => handleFilterChange('paymentMethod', method)}
              className={`px-4 py-2.5 text-sm rounded-lg border ${
                filters.paymentMethod.includes(method)
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-medium'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Status Filter - Second most important */}
      <div>
        <label className="block text-base font-medium text-gray-900 mb-3">Status</label>
        <div className="grid grid-cols-2 gap-2">
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => handleFilterChange('status', status)}
              className={`px-4 py-2.5 text-sm rounded-lg border ${
                filters.status.includes(status)
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-medium'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {status === 'SETTLED' ? 'Success' : status === 'FAILED' ? 'Declined' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Direction Filter - Simple toggle */}
      <div>
        <label className="block text-base font-medium text-gray-900 mb-3">Direction</label>
        <div className="grid grid-cols-2 gap-2">
          {directions.map(direction => (
            <button
              key={direction}
              onClick={() => handleFilterChange('direction', direction)}
              className={`px-4 py-2.5 text-sm rounded-lg border ${
                filters.direction.includes(direction)
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-medium'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {direction}
            </button>
          ))}
        </div>
      </div>

      {/* Token Filter - Last, as it's less commonly used */}
      <div>
        <label className="block text-base font-medium text-gray-900 mb-3">Token</label>
        <div className="flex flex-wrap gap-2">
          {tokens.map(token => (
            <button
              key={token}
              onClick={() => handleFilterChange('token', token)}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                filters.token.includes(token)
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-medium'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {formatTokenDisplay(token)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Desktop filter content remains the same
  const DesktopFilterContent = () => (
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
              {formatTokenDisplay(token)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

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
          {/* Desktop Filter Dropdown */}
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
              <DesktopFilterContent />
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
        {/* Search and Filter Bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base"
            />
          </div>
          <button 
            className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition relative"
            onClick={() => setShowFilters(!showFilters)}
          >
            <span className="text-base font-medium">Filter</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Filter Sheet */}
        {showFilters && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50">
            <div className="fixed inset-x-0 bottom-0 transform transition-transform duration-300 ease-in-out bg-white rounded-t-2xl">
              {/* Header */}
              <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Filter Transactions</h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={clearFilters}
                      className="text-sm font-medium text-blue-600"
                    >
                      Clear all
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-sm font-medium text-gray-900"
                    >
                      Done
                    </button>
                  </div>
                </div>
                {/* Active Filters */}
                {activeFilterCount > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {Object.entries(filters).map(([filterType, filterValues]) =>
                      filterValues.map((value: string) => (
                        <span
                          key={`${filterType}-${value}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded-lg"
                        >
                          {filterType === 'token' ? formatTokenDisplay(value) : 
                            value === 'SETTLED' ? 'Success' : 
                            value === 'FAILED' ? 'Declined' : 
                            value}
                          <button
                            onClick={() => handleFilterChange(filterType as keyof FilterState, value)}
                            className="ml-1 hover:bg-blue-100 rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                )}
              </div>
              {/* Filter Content */}
              <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 80px)' }}>
                <MobileFilterContent />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Rows per page */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
          <label htmlFor="rowsPerPageMobile" className="text-sm text-gray-600">Show</label>
          <select
            id="rowsPerPageMobile"
            value={rowsPerPage}
            onChange={e => setRowsPerPage(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value={5}>5</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-600">per page</span>
        </div>
      </div>

      {/* Active Filters Display - Desktop only */}
      {activeFilterCount > 0 && (
        <div className="hidden sm:flex mt-3 flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">Active filters:</span>
          {Object.entries(filters).map(([filterType, filterValues]) =>
            filterValues.map((value: string) => (
              <span
                key={`${filterType}-${value}`}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                {filterType === 'token' ? formatTokenDisplay(value) : 
                  value === 'SETTLED' ? 'Success' : 
                  value === 'FAILED' ? 'Declined' : 
                  value}
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