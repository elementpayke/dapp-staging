"use client";

import React, { FC } from "react";
import { useModalOverlay } from "@/hooks/useModalOverlay";
import { DatePicker, Button } from "antd";
import { RefreshCw } from "lucide-react";
const { RangePicker } = DatePicker;

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
  onDateRangeChange: (dates: any) => void;
  onRefresh: () => void;
  dateRange: any;
  refreshing?: boolean;
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
  onDateRangeChange,
  onRefresh,
  dateRange,
  refreshing = false,
}: TransactionFiltersProps) => {
  useModalOverlay(showFilters);

  // Local state for search input to prevent graying out
  const [localSearchTerm, setLocalSearchTerm] = React.useState(searchTerm);

  // Sync local state with parent when searchTerm changes externally (like when cleared)
  React.useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // Update parent state when local state changes
  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value);
    setSearchTerm(value);
  };

  const formatTokenDisplay = (token: string) => token.replace(/_/g, " ");

  /** --- Desktop unified row --- */
  const DesktopUnifiedRow = () => (
    <div className="hidden sm:flex flex-wrap items-center gap-3 bg-white rounded-lg border border-gray-200 p-4 shadow-sm mb-4">
      {/* Search Input */}
      <div className="w-64 relative">
        <input
          type="text"
          placeholder="Search transactions, receipts, tokens..."
          value={localSearchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        {localSearchTerm && (
          <button
            onClick={() => {
              setLocalSearchTerm("");
              setSearchTerm("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Date Range Picker */}
      <div className="flex items-center gap-2">
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            onDateRangeChange(dates);
          }}
          format="MMM D, YYYY"
          placeholder={["Start date", "End date"]}
          allowClear
          style={{ width: '320px' }}
        />
        {dateRange && (
          <button
            onClick={() => onDateRangeChange(null)}
            className="text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap font-medium"
          >
            Clear dates
          </button>
        )}
      </div>

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
        <span className="text-sm font-medium">{refreshing ? "Refreshing..." : "Refresh"}</span>
      </button>

      {/* Rows per page */}
      <div className="flex items-center gap-2 ml-auto">
        <label htmlFor="rowsPerPage" className="text-sm text-gray-600">
          Show
        </label>
        <select
          id="rowsPerPage"
          value={rowsPerPage}
          onChange={(e) => setRowsPerPage(Number(e.target.value))}
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
  );

  /** --- Mobile Filter Content --- */
  const MobileFilterContent = () => (
    <div className="space-y-6">
      {/* Payment Method Filter */}
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

      {/* Status Filter */}
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

      {/* Direction Filter */}
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

      {/* Token Filter */}
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

  /** --- Desktop Filter Content (for the popup) --- */
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

  /** --- Render --- */
  return (
    <div className="mb-4">
      <DesktopUnifiedRow />

      {/* Mobile section */}
      <div className="sm:hidden space-y-3">
        <MobileFilterContent />
      </div>
    </div>
  );
};

export default TransactionFilters;
