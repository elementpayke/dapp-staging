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
  useModalOverlay(showFilters);

  const formatTokenDisplay = (token: string) => token.replace(/_/g, " ");

  // ── Shared filter chip styles ─────────────────────────────────────────────
  const chipBase =
    "px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer";
  const chipActive =
    "bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] border-[var(--ep-accent)]/30 font-medium";
  const chipIdle =
    "bg-[var(--ep-bg-card)] text-[var(--ep-body)] border-[var(--ep-border)] hover:bg-[var(--ep-accent-subtle)]";

  // ── Mobile filter panel content ───────────────────────────────────────────
  const MobileFilterContent = () => (
    <div className="space-y-6">
      {/* Payment Method — shown first on mobile (most used) */}
      <div>
        <label className="block text-base font-medium text-[var(--ep-heading)] mb-3">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.map((method) => (
            <button
              key={method}
              onClick={() => handleFilterChange("paymentMethod", method)}
              className={`${chipBase} ${
                filters.paymentMethod.includes(method) ? chipActive : chipIdle
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-base font-medium text-[var(--ep-heading)] mb-3">
          Status
        </label>
        <div className="grid grid-cols-2 gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange("status", status)}
              className={`${chipBase} ${
                filters.status.includes(status) ? chipActive : chipIdle
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

      {/* Direction */}
      <div>
        <label className="block text-base font-medium text-[var(--ep-heading)] mb-3">
          Direction
        </label>
        <div className="grid grid-cols-2 gap-2">
          {directions.map((direction) => (
            <button
              key={direction}
              onClick={() => handleFilterChange("direction", direction)}
              className={`${chipBase} ${
                filters.direction.includes(direction) ? chipActive : chipIdle
              }`}
            >
              {direction}
            </button>
          ))}
        </div>
      </div>

      {/* Token */}
      <div>
        <label className="block text-base font-medium text-[var(--ep-heading)] mb-3">
          Token
        </label>
        <div className="flex flex-wrap gap-2">
          {tokens.map((token) => (
            <button
              key={token}
              onClick={() => handleFilterChange("token", token)}
              className={`${chipBase} ${
                filters.token.includes(token) ? chipActive : chipIdle
              }`}
            >
              {formatTokenDisplay(token)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Desktop filter panel content ──────────────────────────────────────────
  const DesktopFilterContent = () => (
    <div className="space-y-4">
      {/* Status */}
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

      {/* Direction */}
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

      {/* Payment Method */}
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

      {/* Token */}
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
    <div className="mb-4">
      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP TOOLBAR  (≥ sm / 640 px)
          Single row: search | filter | divider | refresh | show | page | count
          ════════════════════════════════════════════════════════════════════ */}
      <div className="hidden sm:flex items-center gap-2 justify-between bg-[var(--ep-bg-card)] rounded-xl border border-[var(--ep-border)] p-2 shadow-[var(--ep-card-shadow)]">
        <div className="flex flex-row w-fit gap-2 items-center md:w-1/2">
          <div className="w-px h-6 bg-[var(--ep-border)]" />

          {/* Search */}
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

          {/* Filter */}
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

            {/* Desktop filter dropdown */}
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

          {/* Rows per page */}
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

          {/* Pagination */}
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

          {/* Transaction count */}
          {totalTransactions !== undefined && (
            <>
              <div className="w-px h-6 bg-[var(--ep-border)]" />
              <span className="text-xs text-[var(--ep-muted)] whitespace-nowrap">
                {totalTransactions}{" "}
                {totalTransactions === 1 ? "tx" : "txs"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE TOOLBAR  (< sm / 640 px)
          ────────────────────────────────────────────────────────────────
          ROW 1 — Search + Filter button
                  Full-width search input; filter icon badge on the right.
          ROW 2 — Controls bar: Refresh · Show N/page · ← page/total → · N txs
          ════════════════════════════════════════════════════════════════════ */}
      <div className="sm:hidden flex flex-col gap-2">

        {/* ── ROW 1: Search + Filter ─────────────────────────────────────── */}
        <div className="flex items-center gap-2 bg-[var(--ep-bg-card)] rounded-xl border border-[var(--ep-border)] px-3 py-2.5 shadow-[var(--ep-card-shadow)]">
          {/* Search icon */}
          <svg
            className="w-4 h-4 text-[var(--ep-muted)] shrink-0"
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

          {/* Search input — grows to fill available space */}
          <input
            type="text"
            placeholder="Search transactions…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-[var(--ep-body)] placeholder:text-[var(--ep-muted)] min-w-0"
          />

          {/* Clear search shortcut */}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-[var(--ep-muted)] hover:text-[var(--ep-body)] shrink-0 text-lg leading-none"
              aria-label="Clear search"
            >
              ×
            </button>
          )}

          {/* Divider */}
          <div className="w-px h-5 bg-[var(--ep-border)] shrink-0" />

          {/* Filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? "bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] border-[var(--ep-accent)]/30"
                : "bg-transparent text-[var(--ep-muted)] border-[var(--ep-border)]"
            }`}
            aria-label="Filter transactions"
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
              <span className="bg-[var(--ep-accent)] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* ── ROW 2: Controls bar ────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-1.5 bg-[var(--ep-bg-card)] rounded-xl border border-[var(--ep-border)] px-3 py-2 shadow-[var(--ep-card-shadow)]">

          {/* Left group: Refresh + rows/page */}
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={refreshing}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--ep-accent)] text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                title={refreshing ? "Refreshing…" : "Refresh transactions"}
                aria-label="Refresh"
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

            {/* Rows per page */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-[var(--ep-muted)] whitespace-nowrap">
                Show
              </span>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="border border-[var(--ep-border)] rounded-lg px-1.5 py-1 text-xs bg-[var(--ep-bg)] text-[var(--ep-body)] focus:ring-2 focus:ring-[var(--ep-accent)]/30 outline-none min-w-[44px]"
                aria-label="Rows per page"
              >
                <option value={5}>5</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Right group: Pagination + tx count */}
          <div className="flex items-center gap-2">
            {/* Pagination */}
            {currentPage && totalPages && setCurrentPage && totalPages > 1 && (
              <div className="flex items-center gap-0.5">
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--ep-border)] hover:bg-[var(--ep-accent-subtle)] text-[var(--ep-muted)] text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  onClick={() =>
                    setCurrentPage(Math.max(1, currentPage - 1))
                  }
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  ‹
                </button>
                <span className="text-xs text-[var(--ep-muted)] px-2 whitespace-nowrap tabular-nums">
                  {currentPage} / {totalPages}
                </span>
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--ep-border)] hover:bg-[var(--ep-accent-subtle)] text-[var(--ep-muted)] text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            )}

            {/* Transaction count pill */}
            {totalTransactions !== undefined && (
              <span className="text-[11px] font-medium text-[var(--ep-muted)] bg-[var(--ep-bg)] border border-[var(--ep-border)] rounded-full px-2 py-0.5 whitespace-nowrap tabular-nums">
                {totalTransactions} {totalTransactions === 1 ? "tx" : "txs"}
              </span>
            )}
          </div>
        </div>

        {/* ── Mobile Filter Bottom Sheet ─────────────────────────────────── */}
        {showFilters && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-overlay">
            <div className="fixed inset-x-0 bottom-0 bg-[var(--ep-bg-card)] rounded-t-2xl z-overlay">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-[var(--ep-border)]" />
              </div>

              {/* Header */}
              <div className="sticky top-0 bg-[var(--ep-bg-card)] px-5 py-3 border-b border-[var(--ep-border)]">
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
                      className="text-sm font-semibold text-[var(--ep-heading)]"
                    >
                      Done
                    </button>
                  </div>
                </div>

                {/* Active filter chips */}
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

              {/* Filter content */}
              <div
                className="p-5 overflow-y-auto"
                style={{ maxHeight: "calc(80vh - 80px)" }}
              >
                <MobileFilterContent />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Active filter chips — desktop only ─────────────────────────────── */}
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
