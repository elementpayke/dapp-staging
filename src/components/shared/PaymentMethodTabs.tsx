"use client";

import React from "react";
import { Send, ShoppingBag, Receipt, Building2 } from "lucide-react";

// ── UPDATED: "BANK" added to the union ───────────────────────────────────────
export type PaymentMethodValue = "PHONE" | "PAYBILL" | "TILL" | "BANK";

interface PaymentMethodOption {
  value: PaymentMethodValue;
  label: string;
  icon: React.ReactNode;
}

const OPTIONS: PaymentMethodOption[] = [
  { value: "PHONE",   label: "Send Money", icon: <Send       className="h-3.5 w-3.5" /> },
  { value: "TILL",    label: "Buy Goods",  icon: <ShoppingBag className="h-3.5 w-3.5" /> },
  { value: "PAYBILL", label: "Paybill",    icon: <Receipt     className="h-3.5 w-3.5" /> },
  // ── ADDED ─────────────────────────────────────────────────────────────────
  { value: "BANK",    label: "Bank",       icon: <Building2   className="h-3.5 w-3.5" /> },
];

export interface PaymentMethodTabsProps {
  value: PaymentMethodValue;
  onChange: (value: PaymentMethodValue) => void;
}

const PaymentMethodTabs: React.FC<PaymentMethodTabsProps> = ({
  value,
  onChange,
}) => (
  <div className="flex rounded-xl bg-[var(--ep-bg-input)] p-1 gap-1">
    {OPTIONS.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium transition-all ${
          value === opt.value
            ? "bg-[var(--ep-bg-card)] text-[var(--ep-heading)] shadow-sm"
            : "text-[var(--ep-muted)] hover:text-[var(--ep-heading)]"
        }`}
      >
        {opt.icon}
        {opt.label}
      </button>
    ))}
  </div>
);

export default PaymentMethodTabs;
