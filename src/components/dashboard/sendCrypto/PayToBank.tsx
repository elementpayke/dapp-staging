"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Check,
  Loader2,
  Search,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";

interface Bank {
  name: string;
  short_name: string;
  code: string;
  bank_type: string;
  country: string;
}

export interface BankPayoutState {
  isReady: boolean;
  isValidatingBank: boolean;
  bankCode: string | null;
  bankName: string | null;
  accountNumber: string;
  recipientPhone: string; // kept in interface for compatibility, always ""
}

interface PayToBankProps {
  onStateChange: (state: BankPayoutState) => void;
  defaultValues?: Pick<
    BankPayoutState,
    "bankCode" | "bankName" | "accountNumber" | "recipientPhone"
  > & { bankIsValid?: boolean };
}

const ACCOUNT_MAX = 20;
const ACCOUNT_MIN = 4;

const PayToBank: React.FC<PayToBankProps> = ({ onStateChange, defaultValues }) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isFetchingBanks, setIsFetchingBanks] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [selectedBank, setSelectedBank] = useState<Bank | null>(() =>
    defaultValues?.bankCode && defaultValues?.bankName
      ? { name: defaultValues.bankName, code: defaultValues.bankCode, short_name: "", bank_type: "", country: "KE" }
      : null,
  );
  const [bankSearch, setBankSearch] = useState(defaultValues?.bankName ?? "");
  const [isValidatingBank, setIsValidatingBank] = useState(false);
  const [bankIsValid, setBankIsValid] = useState<boolean | null>(
    defaultValues?.bankIsValid ?? null,
  );
  const [accountNumber, setAccountNumber] = useState(defaultValues?.accountNumber ?? "");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      setIsFetchingBanks(true);
      try {
        const res = await fetch("/api/sasapay?action=banks");
        const json = await res.json();
        setBanks(Array.isArray(json.data) ? json.data : []);
      } catch {
        toast.error("Failed to load banks. Please try again.");
      } finally {
        setIsFetchingBanks(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, []);

  const accountTrimmed = accountNumber.trim();
  const accountIsValid = accountTrimmed.length >= ACCOUNT_MIN && accountTrimmed.length <= ACCOUNT_MAX;

  useEffect(() => {
    onStateChange({
      isReady: !!(selectedBank && bankIsValid && accountIsValid),
      isValidatingBank,
      bankCode: selectedBank?.code ?? null,
      bankName: selectedBank?.name ?? null,
      accountNumber: accountTrimmed,
      recipientPhone: "", // no longer collected
    });
  }, [selectedBank, bankIsValid, accountIsValid, accountTrimmed, isValidatingBank, onStateChange]);

  const handleSelectBank = async (bank: Bank) => {
    setSelectedBank(bank);
    setBankSearch(bank.name);
    setShowDropdown(false);
    setBankIsValid(null);
    setIsValidatingBank(true);
    try {
      const res = await fetch("/api/sasapay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate", bank_code: bank.code }),
      });
      const json = await res.json();
      setBankIsValid(json.data?.valid ?? false);
    } catch {
      setBankIsValid(false);
      toast.error("Bank validation failed. Please try again.");
    } finally {
      setIsValidatingBank(false);
    }
  };

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\w-]/g, "").slice(0, ACCOUNT_MAX);
    setAccountNumber(cleaned);
  };

  const filteredBanks = useMemo(
    () =>
      banks.filter(
        (b) =>
          b.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
          b.short_name.toLowerCase().includes(bankSearch.toLowerCase()),
      ),
    [banks, bankSearch],
  );

  return (
    <div className="space-y-4">
      {/* ── Bank search ── */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[var(--ep-body)]">
          Recipient bank
        </label>
        <div className="relative" ref={dropdownRef}>
          <div
            className={`flex items-center gap-2 rounded-xl border bg-[var(--ep-bg-input)] px-3 py-2.5 transition-all cursor-text focus-within:border-[var(--ep-border-focus)] ${
              isValidatingBank
                ? "border-[var(--ep-accent)] ring-1 ring-[var(--ep-accent)]/20"
                : bankIsValid === true
                  ? "border-emerald-400"
                  : bankIsValid === false
                    ? "border-red-400"
                    : "border-[var(--ep-border)]"
            }`}
            onClick={() => { setShowDropdown(true); setTimeout(() => searchRef.current?.focus(), 50); }}
          >
            <Search className="h-4 w-4 shrink-0 text-[var(--ep-muted)]" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search for your bank…"
              value={bankSearch}
              onChange={(e) => {
                setBankSearch(e.target.value);
                setShowDropdown(true);
                if (!e.target.value) { setSelectedBank(null); setBankIsValid(null); }
              }}
              onFocus={() => setShowDropdown(true)}
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--ep-heading)] outline-none placeholder:text-[var(--ep-muted)]"
            />
            {isValidatingBank && <Loader2 className="h-4 w-4 animate-spin text-[var(--ep-accent)] shrink-0" />}
            {bankIsValid === true && !isValidatingBank && <Check className="h-4 w-4 text-emerald-500 shrink-0" />}
            {bankIsValid === false && !isValidatingBank && <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />}
          </div>

          {showDropdown && (
            <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-card)] p-1 shadow-lg max-h-44 overflow-y-auto">
              {isFetchingBanks ? (
                <div className="flex items-center justify-center gap-2 py-4 text-xs text-[var(--ep-muted)]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading banks…
                </div>
              ) : filteredBanks.length === 0 ? (
                <p className="py-3 text-center text-xs text-[var(--ep-muted)]">No banks found</p>
              ) : (
                filteredBanks.map((bank) => {
                  const isActive = selectedBank?.code === bank.code;
                  return (
                    <button
                      key={bank.code}
                      type="button"
                      onClick={() => handleSelectBank(bank)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                        isActive ? "bg-[var(--ep-accent-muted)] text-[var(--ep-heading)]" : "text-[var(--ep-body)] hover:bg-[var(--ep-bg-input)]"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{bank.name}</span>
                        <span className="hidden sm:inline text-[10px] text-[var(--ep-muted)]">{bank.bank_type}</span>
                      </span>
                      {isActive && <Check className="h-3.5 w-3.5 text-[var(--ep-accent)]" />}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
        {bankIsValid === false && (
          <p className="mt-1 text-xs text-red-500">This bank could not be validated. Please select another.</p>
        )}
        {bankIsValid === true && (
          <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <Check className="h-3 w-3" /> {selectedBank?.name} validated
          </p>
        )}
      </div>

      {/* ── Selected bank badge ── */}
      {selectedBank && bankIsValid && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-input)] px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ep-accent-muted)]">
            <Building2 className="h-4 w-4 text-[var(--ep-accent)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--ep-heading)] truncate">{selectedBank.name}</p>
            <p className="text-[10px] text-[var(--ep-muted)]">{selectedBank.bank_type} · KE</p>
          </div>
          <button
            type="button"
            onClick={() => { setSelectedBank(null); setBankSearch(""); setBankIsValid(null); }}
            className="text-[var(--ep-muted)] hover:text-red-500 transition-colors"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Account number ── */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[var(--ep-body)]">
          Account number
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            placeholder="e.g. 0123456789"
            value={accountNumber}
            onChange={handleAccountChange}
            maxLength={ACCOUNT_MAX}
            className={`w-full rounded-xl border bg-[var(--ep-bg-input)] px-3 py-2.5 pr-14 text-sm text-[var(--ep-heading)] outline-none transition-all placeholder:text-[var(--ep-muted)] focus:border-[var(--ep-border-focus)] focus:ring-2 focus:ring-[var(--ep-accent)]/10 ${
              accountTrimmed.length === 0
                ? "border-[var(--ep-border)]"
                : accountIsValid
                  ? "border-emerald-400"
                  : "border-red-400"
            }`}
          />
          <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] tabular-nums ${
            accountTrimmed.length >= ACCOUNT_MAX ? "text-red-500 font-semibold" : "text-[var(--ep-muted)]"
          }`}>
            {accountTrimmed.length}/{ACCOUNT_MAX}
          </span>
        </div>
        {accountTrimmed.length > 0 && !accountIsValid && (
          <p className="mt-1 text-xs text-red-500">Must be {ACCOUNT_MIN}–{ACCOUNT_MAX} characters.</p>
        )}
        <p className="mt-1 text-[10px] text-[var(--ep-muted)]">
          Your account number at {selectedBank?.name ?? "the selected bank"}
        </p>
      </div>

      {/* ── Info banner ── */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20">
        <Building2 className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
          Enter the amount using the converter below.
        </p>
      </div>
    </div>
  );
};

export default PayToBank;
