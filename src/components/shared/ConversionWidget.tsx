"use client";

import React, { type ReactNode } from "react";
import { ArrowUpDown } from "lucide-react";

/* ─── helpers ───────────────────────────────────────────────────── */

const formatCurrency = (value: number): string => {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

/* ─── types ─────────────────────────────────────────────────────── */

export type EditableSide = "TOKEN" | "KES";

export interface ConversionWidgetProps {
  /** Currently active input side */
  editableSide: EditableSide;
  setEditableSide: (side: EditableSide) => void;

  /** Raw value of whichever side the user is typing on */
  typedValue: string;
  setTypedValue: (v: string) => void;

  /** Computed display values (derived in parent) */
  tokenDisplayValue: string;
  kesDisplayValue: string;

  /** Token metadata */
  tokenSymbol: string;

  /** Exchange rate (KES per 1 token) */
  exchangeRate: number | null;

  /** Fee shown in the pill badge (pre-formatted string like "KES 5.00 fee") */
  feePreview: string;

  /** Optional: wallet balance for the selected token */
  tokenBalance?: number;
  isBalanceLoading?: boolean;

  /** When true, crypto side gets a red border + helper text */
  balanceError?: boolean;

  /**
   * Slot rendered at the top-right of the crypto cell
   * (token dropdown / selector + optional Max button)
   */
  tokenSelector?: ReactNode;

  /**
   * Optional slot rendered *inside* the crypto input row
   * (e.g. a "Max" pill button absolutely positioned)
   */
  maxButton?: ReactNode;

  /** Sanitise raw text input → decimal-only string */
  sanitize?: (raw: string) => string;
}

const defaultSanitize = (value: string): string => {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole, ...fraction] = cleaned.split(".");
  return fraction.length > 0 ? `${whole}.${fraction.join("")}` : whole;
};

/* ─── component ─────────────────────────────────────────────────── */

const ConversionWidget: React.FC<ConversionWidgetProps> = ({
  editableSide,
  setEditableSide,
  typedValue,
  setTypedValue,
  tokenDisplayValue,
  kesDisplayValue,
  tokenSymbol,
  exchangeRate,
  feePreview,
  tokenBalance,
  isBalanceLoading = false,
  balanceError = false,
  tokenSelector,
  maxButton,
  sanitize = defaultSanitize,
}) => {
  /* ── pill badges ────────────────────────────────────────────── */
  const ratePill =
    exchangeRate && exchangeRate > 0
      ? `1 ${tokenSymbol} ≈ KES ${formatCurrency(exchangeRate)}`
      : "Loading rate…";

  const feePill = feePreview;

  /* ── border helpers ─────────────────────────────────────────── */
  const activeBorder =
    "border-[var(--ep-accent)]/30 bg-[var(--ep-bg-card)]";
  const inactiveBorder =
    "border-[var(--ep-border)] bg-[var(--ep-bg-card)]/75";
  const errorBorder =
    "border-red-500 bg-[var(--ep-bg-card)]";

  const cryptoBorder =
    balanceError
      ? errorBorder
      : editableSide === "TOKEN"
        ? activeBorder
        : inactiveBorder;

  const kesBorder =
    editableSide === "KES" ? activeBorder : inactiveBorder;

  return (
    <div className="rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-input)]">
      {/* ── Rate & Fee pills ──────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-3 pt-3">
        <div className="rounded-full bg-[var(--ep-bg-card)] px-2.5 py-1 text-[11px] font-medium text-[var(--ep-body)]">
          {ratePill}
        </div>
        <div className="rounded-full bg-[var(--ep-bg-card)] px-2.5 py-1 text-[11px] font-medium text-[var(--ep-body)]">
          {feePill}
        </div>
      </div>

      {/* ── 3-column converter grid ──────────────────────────── */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 p-2">
        {/* ─ Crypto side ─ */}
        <div
          className={`rounded-xl border px-3 py-2.5 transition-colors ${cryptoBorder}`}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-medium text-[var(--ep-muted)]">
              Crypto
            </p>
            {tokenSelector}
          </div>

          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={tokenDisplayValue}
              placeholder="0"
              onFocus={() => {
                setEditableSide("TOKEN");
                setTypedValue(tokenDisplayValue);
              }}
              onChange={(e) => {
                setEditableSide("TOKEN");
                setTypedValue(sanitize(e.target.value));
              }}
              className="w-full bg-transparent text-2xl font-semibold text-[var(--ep-heading)] outline-none ring-0 placeholder:text-[var(--ep-muted)] focus:outline-none focus:ring-0"
            />
            {maxButton && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                {maxButton}
              </div>
            )}
          </div>

          {/* Balance & error hints */}
          {tokenBalance !== undefined && (
            <p className={`mt-1 text-[10px] ${balanceError ? "text-red-500 font-medium" : "text-[var(--ep-muted)]"}`}>
              {isBalanceLoading
                ? "Loading…"
                : balanceError
                  ? `Insufficient balance (have ${tokenBalance.toFixed(4)} ${tokenSymbol})`
                  : `Balance: ${tokenBalance.toFixed(4)} ${tokenSymbol}`}
            </p>
          )}
        </div>

        {/* ─ Swap button ─ */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => {
              const next: EditableSide =
                editableSide === "TOKEN" ? "KES" : "TOKEN";
              setEditableSide(next);
              setTypedValue(
                next === "TOKEN" ? tokenDisplayValue : kesDisplayValue,
              );
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--ep-border)] bg-[var(--ep-bg-card)] text-[var(--ep-muted)] transition-all hover:text-[var(--ep-heading)]"
            aria-label="Swap conversion side"
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>

        {/* ─ KES side ─ */}
        <div
          className={`rounded-xl border px-3 py-2.5 transition-colors ${kesBorder}`}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-medium text-[var(--ep-muted)]">
              Cash
            </p>
            <span className="text-xs font-semibold text-[var(--ep-heading)]">
              KES
            </span>
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={kesDisplayValue}
            placeholder="0"
            onFocus={() => {
              setEditableSide("KES");
              setTypedValue(kesDisplayValue);
            }}
            onChange={(e) => {
              setEditableSide("KES");
              setTypedValue(sanitize(e.target.value));
            }}
            className="w-full bg-transparent text-2xl font-semibold text-[var(--ep-heading)] outline-none ring-0 placeholder:text-[var(--ep-muted)] focus:outline-none focus:ring-0"
          />
        </div>
      </div>
    </div>
  );
};

export default ConversionWidget;
