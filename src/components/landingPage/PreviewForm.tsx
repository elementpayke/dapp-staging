"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Zap,
  Send,
  ArrowRight,
  ShoppingBag,
  Receipt,
  ArrowUpDown,
  ChevronDown,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  useOnboardingStore,
  type OffRampMethod,
} from "@/stores/onboardingStore";
import { useAuthModalStore } from "@/stores/authModalStore";
import { useAuthStore } from "@/stores/authStore";
import { SUPPORTED_TOKENS } from "@/constants/supportedTokens";
import { fetchFeeStructureCached, getFeeForAmount } from "@/utils/feeStructure";

interface ConverterToken {
  id: string;
  symbol: string;
  apiCurrency: string;
  tokenLogo?: string;
  chainName?: string;
  chainLogo?: string;
}

const FALLBACK_TOKENS: ConverterToken[] = SUPPORTED_TOKENS.filter((token) =>
  ["USDT", "USDC"].includes(token.symbol),
).map((token) => ({
  id: `${token.symbol}-${token.chain}-${token.tokenAddress}`,
  symbol: token.symbol,
  apiCurrency:
    token.symbol.toLowerCase() === "usdt" ? "usdt_lisk" : token.symbol.toLowerCase(),
  tokenLogo: token.tokenLogo,
  chainName: token.chain,
  chainLogo: token.chainLogo,
}));

const OFF_RAMP_OPTIONS: {
  value: OffRampMethod;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "PHONE", label: "Send Money", icon: <Send className="h-3.5 w-3.5" /> },
  {
    value: "TILL",
    label: "Buy Goods",
    icon: <ShoppingBag className="h-3.5 w-3.5" />,
  },
  {
    value: "PAYBILL",
    label: "Paybill",
    icon: <Receipt className="h-3.5 w-3.5" />,
  },
];

export interface PreviewFormProps {
  className?: string;
}

type EditableSide = "TOKEN" | "KES";

const sanitizeDecimalInput = (value: string): string => {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole, ...fraction] = cleaned.split(".");
  return fraction.length > 0 ? `${whole}.${fraction.join("")}` : whole;
};

const numberFromInput = (value: string): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toInputNumber = (value: number, decimals: number): string => {
  if (!Number.isFinite(value) || value <= 0) return "";
  return value
    .toFixed(decimals)
    .replace(/\.0+$|(?<=\.[0-9]*?)0+$/g, "")
    .replace(/\.$/, "");
};

const formatCurrency = (value: number): string => {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const normalizeTokens = (raw: unknown): ConverterToken[] => {
  const payload = raw as any;
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.tokens)
        ? payload.tokens
        : [];

  const normalized = list
    .map((item: any, index: number) => {
      const symbol = String(item?.symbol || item?.ticker || item?.code || "").toUpperCase();
      const apiCurrency = String(
        item?.currency || item?.api_currency || item?.token || item?.id || symbol.toLowerCase(),
      ).toLowerCase();

      if (!symbol || !apiCurrency) return null;

      const chainName = item?.chain || item?.network || item?.chain_name || undefined;

      const fallback = SUPPORTED_TOKENS.find((token) => {
        const sameSymbol = token.symbol.toUpperCase() === symbol;
        if (!chainName) return sameSymbol;
        return sameSymbol && token.chain.toLowerCase() === String(chainName).toLowerCase();
      });

      return {
        id: String(item?.id || `${symbol}-${apiCurrency}-${chainName || index}`),
        symbol,
        apiCurrency,
        tokenLogo: item?.logo || item?.icon || item?.image || fallback?.tokenLogo,
        chainName: chainName || fallback?.chain,
        chainLogo: item?.chain_logo || item?.network_logo || item?.chain_icon || fallback?.chainLogo,
      } as ConverterToken;
    })
    .filter(Boolean) as ConverterToken[];

  const uniqueById = new Map<string, ConverterToken>();
  for (const token of normalized) {
    if (!uniqueById.has(token.id)) uniqueById.set(token.id, token);
  }

  return Array.from(uniqueById.values());
};

const PreviewForm = ({ className = "" }: PreviewFormProps) => {
  const {
    flow,
    offRampMethod,
    amount,
    phoneNumber,
    paybillNumber,
    accountNumber,
    tillNumber,
    tokenSymbol,
    initiatedFromLanding,
    setFlow,
    setOffRampMethod,
    setAmount,
    setPhoneNumber,
    setPaybill,
    setTillNumber,
    setTokenSymbol,
    setInitiatedFromLanding,
  } = useOnboardingStore();

  const openAuthModal = useAuthModalStore((s) => s.openAuthModal);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();

  const handleCtaClick = () => {
    setInitiatedFromLanding(true);
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      // openAuthModal handles resume logic: OTP verified → wallet-choice
      openAuthModal();
    }
  };

  const [availableTokens, setAvailableTokens] = useState<ConverterToken[]>(FALLBACK_TOKENS);
  const [selectedTokenId, setSelectedTokenId] = useState<string>(FALLBACK_TOKENS[0]?.id || "");
  const [feeBands, setFeeBands] = useState<
    { min_amount: number; max_amount: number | null; fee_amount: number; description: string }[]
  >([]);
  const [baseRate, setBaseRate] = useState<number | null>(null);
  const [editableSide, setEditableSide] = useState<EditableSide>("KES");
  const [typedValue, setTypedValue] = useState(amount || "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedToken =
    availableTokens.find((token) => token.id === selectedTokenId) ||
    availableTokens.find((token) => token.symbol === tokenSymbol) ||
    availableTokens[0] ||
    FALLBACK_TOKENS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadTokens = async () => {
      try {
        const response = await fetch("/api/meta/tokens");
        if (!response.ok) throw new Error("Failed to fetch tokens");
        const payload = await response.json();
        const normalized = normalizeTokens(payload);

        if (mounted && normalized.length > 0) {
          setAvailableTokens(normalized);
        }
      } catch {
        if (mounted) setAvailableTokens(FALLBACK_TOKENS);
      }
    };

    loadTokens();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedToken) return;
    if (selectedTokenId !== selectedToken.id) {
      setSelectedTokenId(selectedToken.id);
    }
    if (selectedToken.symbol !== tokenSymbol) {
      setTokenSymbol(selectedToken.symbol);
    }
  }, [selectedToken, selectedTokenId, tokenSymbol, setTokenSymbol]);

  useEffect(() => {
    let mounted = true;

    const loadFeeStructure = async () => {
      if (!selectedToken?.apiCurrency) return;

      try {
        const response = await fetchFeeStructureCached({
          token: selectedToken.apiCurrency,
          action: flow === "offramp" ? "OffRamp" : "OnRamp",
        });

        if (!mounted) return;
        setBaseRate(response.data.base_rate);
        setFeeBands(response.data.fee_bands || []);
      } catch {
        if (!mounted) return;
        setBaseRate(null);
        setFeeBands([]);
      }
    };

    loadFeeStructure();

    return () => {
      mounted = false;
    };
  }, [selectedToken?.apiCurrency, flow]);

  const numericValue = useMemo(() => numberFromInput(typedValue), [typedValue]);

  const kesAmount = useMemo(() => {
    if (!numericValue) return 0;
    if (editableSide === "KES") return numericValue;
    if (!baseRate || baseRate <= 0) return 0;
    return numericValue * baseRate;
  }, [numericValue, editableSide, baseRate]);

  const tokenAmount = useMemo(() => {
    if (!numericValue) return 0;
    if (editableSide === "TOKEN") return numericValue;
    if (!baseRate || baseRate <= 0) return 0;
    return numericValue / baseRate;
  }, [numericValue, editableSide, baseRate]);

  useEffect(() => {
    if (!typedValue) {
      setAmount("", 0);
      return;
    }

    const normalizedKes = Number.isFinite(kesAmount) ? Number(kesAmount.toFixed(2)) : 0;
    setAmount(normalizedKes > 0 ? normalizedKes.toString() : "", normalizedKes);
  }, [typedValue, kesAmount, setAmount]);

  const tokenDisplayValue = editableSide === "TOKEN" ? typedValue : toInputNumber(tokenAmount, 6);
  const kesDisplayValue = editableSide === "KES" ? typedValue : toInputNumber(kesAmount, 2);

  const feePreview = useMemo(() => {
    if (kesAmount <= 0 || feeBands.length === 0) return 0;
    return getFeeForAmount(kesAmount, feeBands).fee;
  }, [kesAmount, feeBands]);

  const ctaLabel =
    flow === "offramp"
      ? "Send Money"
      : "Buy Crypto";

  return (
    <motion.article
      role="region"
      aria-label="Send or receive money"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className={`
        rounded-2xl border border-[var(--landing-card-border)]
        bg-[var(--landing-card-bg)] text-[var(--landing-card-fg)]
        shadow-[0_4px_32px_rgba(67,57,202,0.08)]
        hover:shadow-[0_8px_40px_rgba(67,57,202,0.12)]
        transition-shadow duration-300
        p-5 sm:p-6 ${className}
      `}
    >
      <div className="mb-4 flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--landing-accent)]/10 text-[var(--landing-accent)]"
          aria-hidden
        >
          <Zap className="h-4 w-4" />
        </span>
        <p className="text-xs font-medium text-[var(--landing-muted)] sm:text-sm">
          {flow === "offramp" ? "Crypto to Mobile Money" : "Mobile Money to Crypto"}
        </p>
      </div>

      <div className="mb-4 flex rounded-xl bg-[var(--landing-input-bg)] p-1">
        <button
          type="button"
          onClick={() => setFlow("offramp")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-all ${
            flow === "offramp"
              ? "bg-[var(--landing-card-bg)] text-[var(--landing-heading)] shadow-sm"
              : "text-[var(--landing-muted)] hover:text-[var(--landing-heading)]"
          }`}
        >
          <Send className="h-3.5 w-3.5" />
          Send
        </button>
        <button
          type="button"
          onClick={() => setFlow("onramp")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-all ${
            flow === "onramp"
              ? "bg-[var(--landing-card-bg)] text-[var(--landing-heading)] shadow-sm"
              : "text-[var(--landing-muted)] hover:text-[var(--landing-heading)]"
          }`}
        >
          Buy Crypto
        </button>
      </div>

      {flow === "offramp" && (
        <>
          <div className="mb-4 flex rounded-xl bg-[var(--landing-input-bg)] p-1">
            {OFF_RAMP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setOffRampMethod(opt.value)}
                className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium transition-all ${
                  offRampMethod === opt.value
                    ? "bg-[var(--landing-card-bg)] text-[var(--landing-heading)] shadow-sm"
                    : "text-[var(--landing-muted)] hover:text-[var(--landing-body)]"
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>

          {offRampMethod === "PHONE" && (
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-[var(--landing-body)]">
                Phone number
              </label>
              <div className="flex overflow-hidden rounded-xl border border-[var(--landing-input-border)] bg-[var(--landing-input-bg)] transition-all focus-within:border-[var(--landing-accent)]/30">
                <div className="flex items-center gap-1.5 border-r border-[var(--landing-input-border)] px-3 py-2.5 text-xs text-[var(--landing-body)]">
                  <span>+254</span>
                </div>
                <input
                  type="tel"
                  placeholder="7XX XXX XXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
                  className="min-w-0 flex-1 rounded-none bg-transparent px-3 py-2.5 text-sm text-[var(--landing-heading)] outline-none ring-0 placeholder:text-[var(--landing-muted)] focus:outline-none focus:ring-0"
                />
              </div>
            </div>
          )}

          {offRampMethod === "PAYBILL" && (
            <div className="mb-4 grid grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--landing-body)]">
                  Paybill
                </label>
                <input
                  type="text"
                  placeholder="XXXXXX"
                  value={paybillNumber}
                  onChange={(e) => setPaybill(e.target.value.replace(/\D/g, ""), accountNumber)}
                  className="w-full rounded-xl border border-[var(--landing-input-border)] bg-[var(--landing-input-bg)] px-3 py-2.5 text-sm text-[var(--landing-heading)] outline-none ring-0 transition-all placeholder:text-[var(--landing-muted)] focus:border-[var(--landing-accent)]/30 focus:outline-none focus:ring-0"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--landing-body)]">
                  Account
                </label>
                <input
                  type="text"
                  placeholder="Account"
                  value={accountNumber}
                  onChange={(e) => setPaybill(paybillNumber, e.target.value)}
                  className="w-full rounded-xl border border-[var(--landing-input-border)] bg-[var(--landing-input-bg)] px-3 py-2.5 text-sm text-[var(--landing-heading)] outline-none ring-0 transition-all placeholder:text-[var(--landing-muted)] focus:border-[var(--landing-accent)]/30 focus:outline-none focus:ring-0"
                />
              </div>
            </div>
          )}

          {offRampMethod === "TILL" && (
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-[var(--landing-body)]">
                Till number
              </label>
              <input
                type="text"
                placeholder="XXXXXX"
                value={tillNumber}
                onChange={(e) => setTillNumber(e.target.value)}
                className="w-full rounded-xl border border-[var(--landing-input-border)] bg-[var(--landing-input-bg)] px-3 py-2.5 text-sm text-[var(--landing-heading)] outline-none ring-0 transition-all placeholder:text-[var(--landing-muted)] focus:border-[var(--landing-accent)]/30 focus:outline-none focus:ring-0"
              />
            </div>
          )}
        </>
      )}

      <div className="mb-5 rounded-2xl border border-[var(--landing-input-border)] bg-[var(--landing-input-bg)]">
        <div className="flex items-center justify-between gap-2 px-3 pt-3">
          <div className="rounded-full bg-[var(--landing-card-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--landing-body)]">
            Rate: {baseRate && baseRate > 0 ? `1 ${selectedToken?.symbol} = KES ${formatCurrency(baseRate)}` : "Loading rate"}
          </div>
          <div className="rounded-full bg-[var(--landing-card-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--landing-body)]">
            Fee: KES {formatCurrency(feePreview)}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 p-2">
          <div
            className={`rounded-xl border px-3 py-2.5 transition-colors ${
              editableSide === "TOKEN"
                ? "border-[var(--landing-accent)]/30 bg-[var(--landing-card-bg)]"
                : "border-[var(--landing-input-border)] bg-[var(--landing-card-bg)]/75"
            }`}
          >
            <div className="relative mb-2 flex items-center justify-between" ref={dropdownRef}>
              <p className="text-[11px] font-medium text-[var(--landing-muted)]">Crypto</p>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-[var(--landing-heading)] hover:bg-[var(--landing-input-bg)]"
              >
                {selectedToken?.tokenLogo && (
                  <img src={selectedToken.tokenLogo} alt="" className="h-4 w-4 rounded-full object-contain" />
                )}
                <span>{selectedToken?.symbol || "Token"}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-xl border border-[var(--landing-input-border)] bg-[var(--landing-card-bg)] p-1.5 shadow-lg">
                  {availableTokens.map((token) => {
                    const isActive = token.id === selectedToken?.id;
                    return (
                      <button
                        key={token.id}
                        type="button"
                        onClick={() => {
                          setSelectedTokenId(token.id);
                          setTokenSymbol(token.symbol);
                          setDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors ${
                          isActive
                            ? "bg-[var(--landing-input-bg)] text-[var(--landing-heading)]"
                            : "text-[var(--landing-body)] hover:bg-[var(--landing-input-bg)]/70"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {token.tokenLogo && (
                            <img src={token.tokenLogo} alt="" className="h-5 w-5 rounded-full object-contain" />
                          )}
                          <span className="text-sm font-medium">{token.symbol}</span>
                          {token.chainName && (
                            <span className="flex items-center gap-1 rounded-full border border-[var(--landing-input-border)] px-1.5 py-0.5 text-[10px] text-[var(--landing-muted)]">
                              {token.chainLogo && (
                                <img src={token.chainLogo} alt="" className="h-3 w-3 rounded-full object-contain" />
                              )}
                              {token.chainName}
                            </span>
                          )}
                        </span>
                        {isActive && <Check className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

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
                setTypedValue(sanitizeDecimalInput(e.target.value));
              }}
              className="w-full rounded-lg bg-transparent text-2xl font-semibold text-[var(--landing-heading)] outline-none ring-0 placeholder:text-[var(--landing-muted)] focus:outline-none focus:ring-0"
            />
          </div>

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                const nextSide = editableSide === "TOKEN" ? "KES" : "TOKEN";
                setEditableSide(nextSide);
                setTypedValue(nextSide === "TOKEN" ? tokenDisplayValue : kesDisplayValue);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--landing-input-border)] bg-[var(--landing-card-bg)] text-[var(--landing-muted)] transition-all hover:text-[var(--landing-heading)]"
              aria-label="Swap conversion side"
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>
          </div>

          <div
            className={`rounded-xl border px-3 py-2.5 transition-colors ${
              editableSide === "KES"
                ? "border-[var(--landing-accent)]/30 bg-[var(--landing-card-bg)]"
                : "border-[var(--landing-input-border)] bg-[var(--landing-card-bg)]/75"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-medium text-[var(--landing-muted)]">Cash</p>
              <span className="text-xs font-semibold text-[var(--landing-heading)]">KES</span>
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
                setTypedValue(sanitizeDecimalInput(e.target.value));
              }}
              className="w-full rounded-lg bg-transparent text-2xl font-semibold text-[var(--landing-heading)] outline-none ring-0 placeholder:text-[var(--landing-muted)] focus:outline-none focus:ring-0"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCtaClick}
        className="
          w-full flex items-center justify-center gap-2 rounded-xl py-3.5
          text-sm font-semibold text-white
          bg-[var(--landing-accent)] hover:bg-[var(--landing-accent-hover)]
          shadow-[0_2px_12px_rgba(67,57,202,0.2)] hover:shadow-[0_4px_20px_rgba(67,57,202,0.3)]
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-[var(--landing-accent)]/40
        "
      >
        {ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
    </motion.article>
  );
};

export default PreviewForm;
