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
  useModalOverlay(showFilters);

  const formatTokenDisplay = (token: string) => token.replace(/_/g, " ");

  const MobileFilterContent = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-base font-medium text-[var(--ep-heading)] mb-3">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.map((method) => (
            <button
              key={method}
              onClick={() => handleFilterChange("paymentMethod", method)}
              className={`px-4 py-2.5 text-sm rounded-lg border ${
                filters.paymentMethod.includes(method)
                  ? "bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] border-[var(--ep-accent)]/30 font-medium"
                  : "bg-[var(--ep-bg-card)] text-[var(--ep-body)] border-[var(--ep-border)] hover:bg-[var(--ep-accent-subtle)]"
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-base font-medium text-[var(--ep-heading)] mb-3">
          Status
        </label>
        <div className="grid grid-cols-2 gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange("status", status)}
              className={`px-4 py-2.5 text-sm rounded-lg border ${
                filters.status.includes(status)
                  ? "bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] border-[var(--ep-accent)]/30 font-medium"
                  : "bg-[var(--ep-bg-card)] text-[var(--ep-body)] border-[var(--ep-border)] hover:bg-[var(--ep-accent-subtle)]"
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

      <div>
        <label className="block text-base font-medium text-[var(--ep-heading)] mb-3">
          Direction
        </label>
        <div className="grid grid-cols-2 gap-2">
          {directions.map((direction) => (
            <button
              key={direction}
              onClick={() => handleFilterChange("direction", direction)}
              className={`px-4 py-2.5 text-sm rounded-lg border ${
                filters.direction.includes(direction)
                  ? "bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] border-[var(--ep-accent)]/30 font-medium"
                  : "bg-[var(--ep-bg-card)] text-[var(--ep-body)] border-[var(--ep-border)] hover:bg-[var(--ep-accent-subtle)]"
              }`}
            >
              {direction}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-base font-medium text-[var(--ep-heading)] mb-3">
          Token
        </label>
        <div className="flex flex-wrap gap-2">
          {tokens.map((token) => (
            <button
              key={token}
              onClick={() => handleFilterChange("token", token)}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                filters.token.includes(token)
                  ? "bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] border-[var(--ep-accent)]/30 font-medium"
                  : "bg-[var(--ep-bg-card)] text-[var(--ep-body)] border-[var(--ep-border)] hover:bg-[var(--ep-accent-subtle)]"
              }`}
            >
              {formatTokenDisplay(token)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const DesktopFilterContent = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--ep-muted)] mb-2">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange("status", status)}
              className={`px-3 py-1 text-xs rounded-full border ${
                filters.status.includes(status)
                  ? "bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] border-[var(--ep-accent)]/30"
                  : "bg-[var(--ep-accent-subtle)] text-[var(--ep-body)] border-[var(--ep-border)] hover:bg-[var(--ep-accent-muted)]"
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
      <div>
        <label className="block text-sm font-medium text-[var(--ep-muted)] mb-2">
          Direction
        </label>
        <div className="flex flex-wrap gap-2">
          {directions.map((direction) => (
            <button
              key={direction}
              onClick={() => handleFilterChange("direction", direction)}
              className={`px-3 py-1 text-xs rounded-full border ${
                filters.direction.includes(direction)
                  ? "bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] border-[var(--ep-accent)]/30"
                  : "bg-[var(--ep-accent-subtle)] text-[var(--ep-body)] border-[var(--ep-border)] hover:bg-[var(--ep-accent-muted)]"
              }`}
            >
              {direction}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--ep-muted)] mb-2">
          Payment Method
        </label>
        <div className="flex flex-wrap gap-2">
          {paymentMethods.map((method) => (
            <button
              key={method}
              onClick={() => handleFilterChange("paymentMethod", method)}
              className={`px-3 py-1 text-xs rounded-full border ${
                filters.paymentMethod.includes(method)
                  ? "bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] border-[var(--ep-accent)]/30"
                  : "bg-[var(--ep-accent-subtle)] text-[var(--ep-body)] border-[var(--ep-border)] hover:bg-[var(--ep-accent-muted)]"
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--ep-muted)] mb-2">
          Token
        </label>
        <div className="flex flex-wrap gap-2">
          {tokens.map((token) => (
            <button
              key={token}
              onClick={() => handleFilterChange("token", token)}
              className={`px-3 py-1 text-xs rounded-full border ${
                filters.token.includes(token)
                  ? "bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] border-[var(--ep-accent)]/30"
                  : "bg-[var(--ep-accent-subtle)] text-[var(--ep-body)] border-[var(--ep-border)] hover:bg-[var(--ep-accent-muted)]"
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
    <div className="mb-4 w-full">
      {/* ── Desktop Toolbar ── */}
      <div className="hidden sm:flex items-center gap-2 justify-between bg-[var(--ep-bg-card)] rounded-xl border border-[var(--ep-border)] p-2 shadow-[var(--ep-card-shadow)]">
        <div className="flex flex-row w-fit gap-2 items-center md:w-1/2">
          <div className="w-px h-6 bg-[var(--ep-border)]" />
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ep-muted)]"
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
              className="w-full pl-8 pr-3 py-1.5 border border-[var(--ep-border)] rounded-lg bg-[var(--ep-bg)] focus:ring-2 focus:ring-[var(--ep-accent)]/30 focus:border-[var(--ep-accent)] outline-none text-sm text-[var(--ep-body)]"
            />
          </div>

          <div className="relative">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--ep-border)] rounded-lg hover:bg-[var(--ep-accent-subtle)] transition text-sm text-[var(--ep-body)]"
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
                <span className="bg-[var(--ep-accent)] text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {showFilters && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-[var(--ep-bg-card)] border border-[var(--ep-border)] rounded-xl shadow-[var(--ep-card-shadow-hover)] z-dropdown p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-[var(--ep-heading)]">
                    Filters
                  </h3>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-[var(--ep-accent)] hover:underline"
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
          <div className="w-px h-6 bg-[var(--ep-border)]" />
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[var(--ep-accent)] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
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
              <span className="hidden lg:inline">
                {refreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="rowsPerPage"
              className="text-xs text-[var(--ep-muted)]"
            >
              Show
            </label>
            <select
              id="rowsPerPage"
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="border border-[var(--ep-border)] rounded-lg px-1.5 py-1 text-sm bg-[var(--ep-bg)] text-[var(--ep-body)] focus:ring-2 focus:ring-[var(--ep-accent)]/30 focus:border-[var(--ep-accent)] outline-none"
            >
              <option value={5}>5</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {currentPage && totalPages && setCurrentPage && totalPages > 1 && (
            <>
              <div className="w-px h-6 bg-[var(--ep-border)]" />
              <div className="flex items-center gap-1">
                <button
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--ep-accent-subtle)] text-[var(--ep-muted)] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  title="Previous page"
                >
                  &lt;
                </button>
                <span className="text-xs text-[var(--ep-muted)] px-1">
                  {currentPage}/{totalPages}
                </span>
                <button
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--ep-accent-subtle)] text-[var(--ep-muted)] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

          {totalTransactions !== undefined && (
            <>
              <div className="w-px h-6 bg-[var(--ep-border)]" />
              <span className="text-xs text-[var(--ep-muted)] whitespace-nowrap">
                {totalTransactions} {totalTransactions === 1 ? "tx" : "txs"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Mobile Toolbar ── */}
      <div className="sm:hidden" style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>

        {/* ── Row 1: Search + Filter ── */}
        <div
          style={{ display: "flex", flexDirection: "row", gap: "8px", width: "100%", alignItems: "center" }}
          className="bg-[var(--ep-bg-card)] rounded-xl border border-[var(--ep-border)] p-2"
        >
          {/* Search input — takes all remaining width */}
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
            <svg
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--ep-muted)", pointerEvents: "none" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 10, paddingBottom: 10, fontSize: 14, outline: "none", borderRadius: 8, border: "1px solid var(--ep-border)", background: "var(--ep-bg)", color: "var(--ep-body)" }}
            />
          </div>

          {/* Filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{ position: "relative", flexShrink: 0, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid var(--ep-border)", background: "transparent", cursor: "pointer" }}
          >
            <svg className="w-4 h-4 text-[var(--ep-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {activeFilterCount > 0 && (
              <span style={{ position: "absolute", top: -4, right: -4, background: "var(--ep-accent)", color: "#fff", fontSize: 10, borderRadius: "100%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Row 2: Refresh · Show · Pagination · Count ── */}
        <div
          style={{ display: "flex", flexDirection: "row", gap: "8px", width: "100%", alignItems: "center", padding: "8px 12px" }}
          className="bg-[var(--ep-bg-card)] rounded-xl border border-[var(--ep-border)]"
        >
          {/* Refresh */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              style={{ flexShrink: 0, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: "var(--ep-accent)", color: "#fff", border: "none", cursor: "pointer", opacity: refreshing ? 0.5 : 1 }}
            >
              <svg className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: "var(--ep-border)", flexShrink: 0 }} />

          {/* Rows per page */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <span className="text-xs text-[var(--ep-muted)]">Show</span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="border border-[var(--ep-border)] rounded-lg text-xs bg-[var(--ep-bg)] text-[var(--ep-body)] outline-none"
              style={{ padding: "4px 6px" }}
            >
              <option value={5}>5</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Pagination */}
          {currentPage && totalPages && setCurrentPage && totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "none", background: "transparent", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1, fontSize: 18, color: "var(--ep-muted)" }}
              >‹</button>
              <span className="text-xs text-[var(--ep-muted)] tabular-nums" style={{ minWidth: 36, textAlign: "center" }}>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "none", background: "transparent", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1, fontSize: 18, color: "var(--ep-muted)" }}
              >›</button>
              <div style={{ width: 1, height: 20, background: "var(--ep-border)", flexShrink: 0 }} />
            </div>
          )}

          {/* Count */}
          {totalTransactions !== undefined && (
            <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
              <span className="text-xs font-semibold text-[var(--ep-heading)] tabular-nums">{totalTransactions}</span>
              <span className="text-xs text-[var(--ep-muted)]">{totalTransactions === 1 ? "tx" : "txs"}</span>
            </div>
          )}
        </div>

        {/* Mobile Filter Sheet */}
        {showFilters && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-overlay">
            <div className="fixed inset-x-0 bottom-0 transform transition-transform duration-300 ease-in-out bg-[var(--ep-bg-card)] rounded-t-2xl z-overlay">
              <div className="sticky top-0 bg-[var(--ep-bg-card)] px-4 py-3 border-b border-[var(--ep-border)]">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-[var(--ep-heading)]">
                    Filter Transactions
                  </h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={clearFilters}
                      className="text-sm font-medium text-[var(--ep-accent)]"
                    >
                      Clear all
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-sm font-medium text-[var(--ep-heading)]"
                    >
                      Done
                    </button>
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {Object.entries(filters).map(([filterType, filterValues]) =>
                      filterValues.map((value: string) => (
                        <span
                          key={`${filterType}-${value}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] text-sm rounded-lg"
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
                            className="ml-1 hover:bg-[var(--ep-accent-muted)] rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </span>
                      )),
                    )}
                  </div>
                )}
              </div>
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

      {/* Active Filters Display – Desktop only */}
      {activeFilterCount > 0 && (
        <div className="hidden sm:flex mt-2 flex-wrap gap-2 items-center">
          <span className="text-xs text-[var(--ep-muted)]">Active:</span>
          {Object.entries(filters).map(([filterType, filterValues]) =>
            filterValues.map((value: string) => (
              <span
                key={`${filterType}-${value}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] text-xs rounded-full"
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
                  className="hover:bg-[var(--ep-accent-muted)] rounded-full p-0.5"
                >
                  ×
                </button>
              </span>
            )),
          )}
          <button
            onClick={clearFilters}
            className="text-xs text-[var(--ep-accent)] hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionFilters;
