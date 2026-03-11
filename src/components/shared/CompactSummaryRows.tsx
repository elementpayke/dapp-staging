"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface SummaryRow {
  label: string;
  value: string;
  /** Optional accent color for the value */
  accent?: boolean;
  /** Marks this row as the total — rendered below a divider */
  isTotal?: boolean;
}

export interface CompactSummaryRowsProps {
  rows: SummaryRow[];
  /** Optional: small informational note below the rows */
  note?: string;
  /** Start expanded or collapsed (default: collapsed) */
  defaultOpen?: boolean;
}

const CompactSummaryRows: React.FC<CompactSummaryRowsProps> = ({
  rows,
  note,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  const normalRows = rows.filter((r) => !r.isTotal);
  const totalRow = rows.find((r) => r.isTotal);

  return (
    <div className="rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-input)] overflow-hidden transition-all duration-200">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ep-muted)] hover:text-[var(--ep-heading)] transition-colors"
      >
        <span>Transaction Details</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Collapsible body */}
      <div
        className={`grid transition-all duration-200 ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-2 px-4 pb-4">
            {normalRows.map((row, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-[var(--ep-muted)]">
                  {row.label}
                </span>
                <span
                  className={`text-sm font-medium ${
                    row.accent
                      ? "text-[var(--ep-accent)]"
                      : "text-[var(--ep-heading)]"
                  }`}
                >
                  {row.value}
                </span>
              </div>
            ))}

            {totalRow && (
              <>
                <div className="border-t border-[var(--ep-border)] pt-2 mt-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--ep-heading)]">
                    {totalRow.label}
                  </span>
                  <span className="text-sm font-semibold text-[var(--ep-heading)]">
                    {totalRow.value}
                  </span>
                </div>
              </>
            )}

            {note && (
              <p className="text-[10px] text-[var(--ep-muted)] leading-relaxed pt-1">
                {note}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactSummaryRows;
