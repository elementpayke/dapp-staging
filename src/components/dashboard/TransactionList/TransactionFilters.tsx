"use client";

import React, { FC } from "react";
import { useModalOverlay } from "@/hooks/useModalOverlay";

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
  // New props for consolidated toolbar
  refreshing?: boolean;
  onRefresh?: () => void;
  currentPage?: number;
  totalPages?: number;
  setCurrentPage?: (page: number) => void;
  totalTransactions?: number;
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
  refreshing,
  onRefresh,
  currentPage,
  totalPages,
  setCurrentPage,
  totalTransactions,
}: TransactionFiltersProps) => {
  // Use modal overlay hook to manage dropdown hiding
  useModalOverlay(showFilters);

  // Helper function to format token display
  const formatTokenDisplay = (token: string) => {
    return token.replace(/_/g, " ");
  };

  // Mobile-optimized filter content
  const MobileFilterContent = () => (
    <div className="space-y-6">
      {/* Payment Method Filter - Most important, shown first on mobile */}
      <div>
        <label className="block text-base font-medium text-gray-900 mb-3">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.map((method) => (
            <button
              key={method}
              onClick={() => handleFilterChange("paymentMethod", method)}
              className={`px-4 py-2.5 text-sm rounded-lg border ${
                filters.paymentMethod.includes(method)
                  ? "bg-blue-50 text-blue-700 border-blue-300 font-medium"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Status Filter - Second most important */}
      <div>
        <label className="block text-base font-medium text-gray-900 mb-3">
          Status
        </label>
        <div className="grid grid-cols-2 gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange("status", status)}
              className={`px-4 py-2.5 text-sm rounded-lg border ${
                filters.status.includes(status)
                  ? "bg-blue-50 text-blue-700 border-blue-300 font-medium"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {status === "SETTLED"
                ? "Success"
                : status === "FAILED"
                  ? "Declined"
                  : status}
            </button>
          ))}
        </div>
      </div>

      {/* Direction Filter - Simple toggle */}
      <div>
        <label className="block text-base font-medium text-gray-900 mb-3">
          Direction
        </label>
        <div className="grid grid-cols-2 gap-2">
          {directions.map((direction) => (
            <button
              key={direction}
              onClick={() => handleFilterChange("direction", direction)}
              className={`px-4 py-2.5 text-sm rounded-lg border ${
                filters.direction.includes(direction)
                  ? "bg-blue-50 text-blue-700 border-blue-300 font-medium"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {direction}
            </button>
          ))}
        </div>
      </div>

      {/* Token Filter - Last, as it's less commonly used */}
      <div>
        <label className="block text-base font-medium text-gray-900 mb-3">
          Token
        </label>
        <div className="flex flex-wrap gap-2">
          {tokens.map((token) => (
            <button
              key={token}
              onClick={() => handleFilterChange("token", token)}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                filters.token.includes(token)
                  ? "bg-blue-50 text-blue-700 border-blue-300 font-medium"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange("status", status)}
              className={`px-3 py-1 text-xs rounded-full border ${
                filters.status.includes(status)
                  ? "bg-blue-100 text-blue-700 border-blue-300"
                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
              }`}
            >
              {status === "SETTLED"
                ? "Success"
                : status === "FAILED"
                  ? "Declined"
                  : status}
            </button>
          ))}
        </div>
      </div>
      {/* Direction Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Direction
        </label>
        <div className="flex flex-wrap gap-2">
          {directions.map((direction) => (
            <button
              key={direction}
              onClick={() => handleFilterChange("direction", direction)}
              className={`px-3 py-1 text-xs rounded-full border ${
                filters.direction.includes(direction)
                  ? "bg-blue-100 text-blue-700 border-blue-300"
                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
              }`}
            >
              {direction}
            </button>
          ))}
        </div>
      </div>
      {/* Payment Method Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method
        </label>
        <div className="flex flex-wrap gap-2">
          {paymentMethods.map((method) => (
            <button
              key={method}
              onClick={() => handleFilterChange("paymentMethod", method)}
              className={`px-3 py-1 text-xs rounded-full border ${
                filters.paymentMethod.includes(method)
                  ? "bg-blue-100 text-blue-700 border-blue-300"
                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>
      {/* Token Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Token
        </label>
        <div className="flex flex-wrap gap-2">
          {tokens.map((token) => (
            <button
              key={token}
              onClick={() => handleFilterChange("token", token)}
              className={`px-3 py-1 text-xs rounded-full border ${
                filters.token.includes(token)
                  ? "bg-blue-100 text-blue-700 border-blue-300"
                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
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
      {/* Desktop Consolidated Toolbar - Single Row */}
      <div className="hidden sm:flex items-center gap-2 justify-between bg-white rounded-lg border border-gray-200 p-2 shadow-sm">
        {/* Refresh Button */}

        <div className="flex flex-row w-fit gap-2 items-center md:w-1/2">
          {/* Divider */}
          <div className="w-px h-6 bg-gray-200" />

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by tx hash, receipt, token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          </div>

          {/* Filter Button */}
          <div className="relative">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition text-sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {/* Desktop Filter Dropdown */}
            {showFilters && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-dropdown p-4">
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
        </div>

        <div className="flex flex-row items-center gap-2">
          {/* Divider */}
          <div className="w-px h-6 bg-gray-200" />
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              title="Refresh transactions"
            >
              <svg
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
              <span className="hidden lg:inline">
                {refreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>
          )}
          {/* Rows per page selector */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="rowsPerPage" className="text-xs text-gray-500">
              Show
            </label>
            <select
              id="rowsPerPage"
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-1.5 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value={5}>5</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Pagination Controls */}
          {currentPage && totalPages && setCurrentPage && totalPages > 1 && (
            <>
              <div className="w-px h-6 bg-gray-200" />
              <div className="flex items-center gap-1">
                <button
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  title="Previous page"
                >
                  &lt;
                </button>
                <span className="text-xs text-gray-600 px-1">
                  {currentPage}/{totalPages}
                </span>
                <button
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  title="Next page"
                >
                  &gt;
                </button>
              </div>
            </>
          )}

          {/* Transaction Count */}
          {totalTransactions !== undefined && (
            <>
              <div className="w-px h-6 bg-gray-200" />
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {totalTransactions} {totalTransactions === 1 ? "tx" : "txs"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Mobile Consolidated Toolbar */}
      <div className="sm:hidden space-y-2">
        {/* Top row: Refresh + Search + Filter */}
        <div className="flex gap-2 bg-white rounded-lg border border-gray-200 p-2">
          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center justify-center w-9 h-9 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh"
            >
              <svg
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}

          {/* Search Input */}
          <div className="flex-1 relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          </div>

          {/* Filter Button */}
          <button
            className="flex items-center justify-center w-9 h-9 border border-gray-300 rounded-md hover:bg-gray-50 transition relative"
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Bottom row: Per page + Pagination + Count */}
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-2 py-1.5">
          {/* Rows per page */}
          <div className="flex items-center gap-1">
            <select
              id="rowsPerPageMobile"
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="border border-gray-300 rounded px-1 py-0.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value={5}>5</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-xs text-gray-500">/page</span>
          </div>

          {/* Pagination */}
          {currentPage && totalPages && setCurrentPage && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                &lt;
              </button>
              <span className="text-xs text-gray-600">
                {currentPage}/{totalPages}
              </span>
              <button
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                &gt;
              </button>
            </div>
          )}

          {/* Transaction Count */}
          {totalTransactions !== undefined && (
            <span className="text-xs text-gray-500">
              {totalTransactions} txs
            </span>
          )}
        </div>

        {/* Mobile Filter Sheet */}
        {showFilters && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-overlay">
            <div className="fixed inset-x-0 bottom-0 transform transition-transform duration-300 ease-in-out bg-white rounded-t-2xl z-overlay">
              {/* Header */}
              <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Filter Transactions
                  </h3>
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
                          {filterType === "token"
                            ? formatTokenDisplay(value)
                            : value === "SETTLED"
                              ? "Success"
                              : value === "FAILED"
                                ? "Declined"
                                : value}
                          <button
                            onClick={() =>
                              handleFilterChange(
                                filterType as keyof FilterState,
                                value,
                              )
                            }
                            className="ml-1 hover:bg-blue-100 rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </span>
                      )),
                    )}
                  </div>
                )}
              </div>
              {/* Filter Content */}
              <div
                className="p-4 overflow-y-auto"
                style={{ maxHeight: "calc(80vh - 80px)" }}
              >
                <MobileFilterContent />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Filters Display - Desktop only */}
      {activeFilterCount > 0 && (
        <div className="hidden sm:flex mt-2 flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500">Active:</span>
          {Object.entries(filters).map(([filterType, filterValues]) =>
            filterValues.map((value: string) => (
              <span
                key={`${filterType}-${value}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                {filterType === "token"
                  ? formatTokenDisplay(value)
                  : value === "SETTLED"
                    ? "Success"
                    : value === "FAILED"
                      ? "Declined"
                      : value}
                <button
                  onClick={() =>
                    handleFilterChange(filterType as keyof FilterState, value)
                  }
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  ×
                </button>
              </span>
            )),
          )}
          <button
            onClick={clearFilters}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionFilters;
