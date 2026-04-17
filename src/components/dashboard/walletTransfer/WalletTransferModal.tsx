"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "react-qr-code";
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  ScanLine,
  SendHorizontal,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { useWallets } from "@privy-io/react-auth";
import { useWriteContract, useEnsAddress } from "wagmi";
import { mainnet } from "wagmi/chains";
import { isAddress, parseUnits } from "viem";
import { toast } from "sonner";
import { erc20Abi } from "@/app/api/abi";
import { useGaslessTransfer } from "@/hooks/useGaslessTransfer";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useWallet } from "@/hooks/useWallet";
import { sameWalletAddress } from "@/lib/privy-wallet-selection";
import { useAuthStore } from "@/stores/authStore";
import {
  type SupportedToken,
  getAvailableTokens,
} from "@/constants/supportedTokens";
import { getTargetChainIdForToken } from "@/utils/offrampExecution";
import { truncateAddress, walletLabel } from "../wallet-branding";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ConversionWidget, { type EditableSide } from "@/components/shared/ConversionWidget";
import QrScannerModal from "@/components/shared/QrScannerModal";
import {
  fetchFeeStructureCached,
  getApiCurrencyFromToken,
} from "@/utils/feeStructure";

type TransferView = "SEND" | "RECEIVE";

const DEFAULT_TOKEN = getAvailableTokens(true)[0]!; // USDC Base

const VIEW_OPTIONS: Array<{
  value: TransferView;
  label: string;
  icon: ReactNode;
}> = [
  {
    value: "SEND",
    label: "Send",
    icon: <SendHorizontal className="h-3.5 w-3.5" />,
  },
  {
    value: "RECEIVE",
    label: "Receive",
    icon: <Copy className="h-3.5 w-3.5" />,
  },
];

export default function WalletTransferModal() {
  const { address } = useWallet();
  const { wallets } = useWallets();
  const walletPreference = useAuthStore((state) => state.walletPreference);
  const { gaslessTransfer, smartWalletReady } = useGaslessTransfer();
  const { writeContractAsync } = useWriteContract();

  const isEmbedded = walletPreference === "embedded";

  /* ── Token selector state ── */
  const [selectedToken, setSelectedToken] = useState<SupportedToken>(DEFAULT_TOKEN);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const tokenDropdownRef = useRef<HTMLDivElement>(null);
  const tokenDropdownListRef = useRef<HTMLDivElement>(null);

  const { balance, isCorrectNetwork, isLoading } = useTokenBalance({ token: selectedToken });

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<TransferView>("SEND");
  const [recipientInput, setRecipientInput] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showQrScanner, setShowQrScanner] = useState(false);

  /* ── Conversion widget state ── */
  const [editableSide, setEditableSide] = useState<EditableSide>("TOKEN");
  const [typedValue, setTypedValue] = useState("");
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  const trimmedRecipient = recipientInput.trim();
  const shouldResolveEns = trimmedRecipient.toLowerCase().endsWith(".eth");
  const { data: ensAddress, isLoading: isResolvingEns } = useEnsAddress({
    name: shouldResolveEns ? trimmedRecipient : undefined,
    chainId: mainnet.id,
    query: {
      enabled: open && view === "SEND" && shouldResolveEns,
    },
  });

  const activeWallet = useMemo(
    () => wallets.find((wallet) => sameWalletAddress(wallet.address, address)) ?? null,
    [wallets, address],
  );
  const walletType = walletPreference;
  const walletDisplayLabel =
    walletType === "embedded"
      ? walletLabel("privy")
      : walletLabel(activeWallet?.walletClientType);

  const resolvedRecipient = shouldResolveEns ? ensAddress ?? null : trimmedRecipient || null;
  const amountValue = Number.parseFloat(amount);
  const exceedsBalance = Number.isFinite(amountValue) && amountValue > balance;
  const isSelfSend =
    resolvedRecipient !== null && sameWalletAddress(resolvedRecipient, address);

  /* ── Token dropdown positioning & outside-click ── */
  useEffect(() => {
    if (!showTokenDropdown) return;
    const trigger = tokenDropdownRef.current;
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    const handleClick = (e: MouseEvent) => {
      if (
        tokenDropdownRef.current?.contains(e.target as Node) ||
        tokenDropdownListRef.current?.contains(e.target as Node)
      )
        return;
      setShowTokenDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showTokenDropdown]);

  /* ── Exchange rate fetch ── */
  useEffect(() => {
    if (!open) return;
    const fetchRate = async () => {
      try {
        const apiCurrency = getApiCurrencyFromToken(selectedToken.symbol);
        const feeData = await fetchFeeStructureCached({ token: apiCurrency, action: "OffRamp" });
        const baseRate = feeData.data.base_rate;
        if (baseRate && baseRate > 0) setExchangeRate(baseRate);
      } catch {
        /* rate stays null */
      }
    };
    fetchRate();
  }, [open, selectedToken.symbol]);

  /* ── Conversion helpers ── */
  const sanitizeDecimalInput = useCallback((value: string): string => {
    const cleaned = value.replace(/[^\d.]/g, "");
    const [whole, ...fraction] = cleaned.split(".");
    return fraction.length > 0 ? `${whole}.${fraction.join("")}` : whole;
  }, []);

  const toInputNumber = useCallback((value: number, decimals: number): string => {
    if (!Number.isFinite(value) || value <= 0) return "";
    const str = value.toFixed(decimals);
    if (str.includes(".")) return str.replace(/0+$/, "").replace(/\.$/, "");
    return str;
  }, []);

  const numericTyped = useMemo(() => {
    const v = Number.parseFloat(typedValue);
    return Number.isFinite(v) ? v : 0;
  }, [typedValue]);

  const derivedKes = useMemo(() => {
    if (!numericTyped) return 0;
    if (editableSide === "KES") return numericTyped;
    if (!exchangeRate || exchangeRate <= 0) return 0;
    return numericTyped * exchangeRate;
  }, [numericTyped, editableSide, exchangeRate]);

  const derivedToken = useMemo(() => {
    if (!numericTyped) return 0;
    if (editableSide === "TOKEN") return numericTyped;
    if (!exchangeRate || exchangeRate <= 0) return 0;
    return numericTyped / exchangeRate;
  }, [numericTyped, editableSide, exchangeRate]);

  const tokenDisplayValue = editableSide === "TOKEN" ? typedValue : toInputNumber(derivedToken, 6);
  const kesDisplayValue = editableSide === "KES" ? typedValue : toInputNumber(derivedKes, 2);
  const feePreview = "No platform fee";
  const balanceExceeded = derivedToken > 0 && derivedToken > balance;

  useEffect(() => {
    setAmount(toInputNumber(derivedToken, 6));
  }, [derivedToken, toInputNumber]);

  /* ── Validation ── */
  const recipientError = useMemo(() => {
    if (!trimmedRecipient) return "Enter a wallet address or ENS name.";
    if (shouldResolveEns && isResolvingEns) return null;
    if (shouldResolveEns && !ensAddress) return "We couldn't resolve that ENS name.";
    if (!resolvedRecipient || !isAddress(resolvedRecipient)) return "Enter a valid wallet address.";
    if (isSelfSend) return "You can't send to your own wallet.";
    return null;
  }, [trimmedRecipient, shouldResolveEns, isResolvingEns, ensAddress, resolvedRecipient, isSelfSend]);

  const amountError = useMemo(() => {
    if (!amount.trim()) return "Enter the amount to send.";
    if (!Number.isFinite(amountValue) || amountValue <= 0) return "Amount must be greater than zero.";
    if (exceedsBalance) return `Amount exceeds your ${selectedToken.symbol} balance.`;
    return null;
  }, [amount, amountValue, exceedsBalance, selectedToken.symbol]);

  const networkError =
    walletType === "external" && !isCorrectNetwork
      ? `Switch to ${selectedToken.chain} before sending.`
      : null;
  const walletError =
    walletType === "embedded" && !smartWalletReady
      ? "Embedded wallet not ready."
      : null;

  const formError = recipientError ?? amountError ?? networkError ?? walletError;
  const canSubmit =
    view === "SEND" &&
    !submitting &&
    !isLoading &&
    !isResolvingEns &&
    !formError &&
    !!address &&
    !!resolvedRecipient &&
    isAddress(resolvedRecipient);

  /* ── Reset on close ── */
  useEffect(() => {
    if (!open) {
      setView("SEND");
      setRecipientInput("");
      setAmount("");
      setEditableSide("TOKEN");
      setTypedValue("");
      setExchangeRate(null);
      setSubmitting(false);
      setCopiedHash(null);
      setCopiedAddress(false);
      setTxHash(null);
      setSelectedToken(DEFAULT_TOKEN);
      setShowTokenDropdown(false);
    }
  }, [open]);

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!canSubmit || !resolvedRecipient || !address) return;

    setSubmitting(true);

    try {
      const decimals = 6;
      const chainId = getTargetChainIdForToken(selectedToken);
      let hash: string;

      if (walletType === "embedded") {
        hash = await gaslessTransfer({
          tokenAddress: selectedToken.tokenAddress as `0x${string}`,
          recipient: resolvedRecipient as `0x${string}`,
          amount,
          decimals,
          chainId,
        });
      } else {
        hash = await writeContractAsync({
          address: selectedToken.tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "transfer",
          args: [resolvedRecipient as `0x${string}`, parseUnits(amount, decimals)],
          chainId,
        });
      }

      setTxHash(hash);
      toast.success(`${selectedToken.symbol} transfer submitted on ${selectedToken.chain}.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Transfer failed.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyHash = async () => {
    if (!txHash) return;
    await navigator.clipboard.writeText(txHash);
    setCopiedHash(txHash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleCopyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  /* ── Wallet ready badge ── */
  const walletReady = isEmbedded ? smartWalletReady : isCorrectNetwork;

  /* ── Token selector node for ConversionWidget slot ── */
  const tokenSelectorNode = (
    <div className="relative" ref={tokenDropdownRef}>
      <button
        type="button"
        onClick={() => setShowTokenDropdown((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-[var(--ep-heading)] hover:bg-[var(--ep-bg-input)] transition-colors"
      >
        {selectedToken.tokenLogo && (
          <img src={selectedToken.tokenLogo} alt="" className="h-4 w-4 rounded-full object-contain" />
        )}
        <span>{selectedToken.symbol}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showTokenDropdown ? "rotate-180" : ""}`} />
      </button>

      {showTokenDropdown && dropdownPos && createPortal(
        <div
          ref={tokenDropdownListRef}
          className="fixed z-[100] w-64 rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-card)] p-1.5 shadow-lg"
          style={{ top: dropdownPos.top, right: dropdownPos.right }}
        >
          {getAvailableTokens(isEmbedded).map((token) => {
            const isActive = token.symbol === selectedToken.symbol && token.chain === selectedToken.chain;
            return (
              <button
                key={token.symbol + token.chain}
                type="button"
                onClick={() => {
                  setSelectedToken(token);
                  setShowTokenDropdown(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors ${
                  isActive
                    ? "bg-[var(--ep-accent-muted)] text-[var(--ep-heading)]"
                    : "text-[var(--ep-body)] hover:bg-[var(--ep-bg-input)]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <img src={token.tokenLogo} alt="" className="h-5 w-5 rounded-full object-contain" />
                  <span className="text-sm font-medium">{token.symbol}</span>
                  <span className="flex items-center gap-1 rounded-full border border-[var(--ep-border)] px-1.5 py-0.5 text-[10px] text-[var(--ep-muted)]">
                    <img src={token.chainLogo} alt="" className="h-3 w-3 rounded-full object-contain" />
                    {token.chain}
                  </span>
                </span>
                {isActive && <Check className="h-3.5 w-3.5 text-[var(--ep-accent)]" />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className="flex items-center gap-1.5 sm:gap-2 bg-[var(--ep-bg-input)] text-[var(--ep-heading)] text-xs sm:text-sm font-semibold py-2 px-3 sm:py-3 sm:px-5 rounded-full border border-[var(--ep-border)] hover:border-[var(--ep-accent)]/40 hover:bg-[var(--ep-accent-muted)] transition-all duration-200">
          <ArrowLeftRight size={16} className="sm:w-[18px] sm:h-[18px]" />
          Wallet Transfer
        </DialogTrigger>

        <DialogContent className="w-[95vw] sm:w-full max-w-lg p-5 sm:p-6 bg-[var(--ep-bg-card)] border border-[var(--ep-border)] rounded-2xl shadow-[var(--ep-card-shadow)]">
          <DialogHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ep-accent-muted)] text-[var(--ep-accent)]">
                  <ArrowLeftRight className="h-4 w-4" />
                </span>
                <div>
                  <DialogTitle className="text-base font-semibold text-[var(--ep-heading)]">
                    Wallet Transfer
                  </DialogTitle>
                  <p className="text-[11px] text-[var(--ep-muted)]">
                    Peer-to-peer
                  </p>
                </div>
              </div>
              {/* Wallet ready badge */}
              <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                walletReady
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${walletReady ? "bg-emerald-500" : "bg-amber-500"}`} />
                {walletReady ? "Wallet ready" : "Wallet not ready"}
              </span>
            </div>
          </DialogHeader>

          <div className="space-y-3">
            {/* Send / Receive tabs */}
            <div className="flex rounded-xl bg-[var(--ep-bg-input)] p-1 gap-1">
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setView(option.value)}
                  className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium transition-all ${
                    view === option.value
                      ? "bg-[var(--ep-bg-card)] text-[var(--ep-heading)] shadow-sm"
                      : "text-[var(--ep-muted)] hover:text-[var(--ep-heading)]"
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>

            {view === "SEND" ? (
              <>
                {/* Recipient input with wallet icon + QR scan */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--ep-body)]">
                    Recipient
                  </label>
                  <div className="flex items-center gap-0 rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-input)] focus-within:border-[var(--ep-border-focus)] focus-within:ring-2 focus-within:ring-[var(--ep-accent)]/10 transition-all">
                    <span className="pl-3 text-[var(--ep-muted)]">
                      <Wallet className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      placeholder="0x... or name.eth"
                      className="flex-1 bg-transparent px-2 py-2.5 text-sm text-[var(--ep-heading)] outline-none placeholder:text-[var(--ep-muted)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowQrScanner(true)}
                      className="pr-3 text-[var(--ep-muted)] hover:text-[var(--ep-accent)] transition-colors"
                      title="Scan QR code"
                    >
                      <ScanLine className="h-4 w-4" />
                    </button>
                  </div>
                  {isResolvingEns ? (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--ep-accent)]">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Resolving ENS…
                    </p>
                  ) : resolvedRecipient && shouldResolveEns && !recipientError ? (
                    <p className="mt-1 text-xs text-emerald-600">
                      {truncateAddress(resolvedRecipient)}
                    </p>
                  ) : recipientError && trimmedRecipient ? (
                    <p className="mt-1 text-xs text-red-500">{recipientError}</p>
                  ) : null}
                </div>

                {/* Amount with token selector */}
                <ConversionWidget
                  editableSide={editableSide}
                  setEditableSide={setEditableSide}
                  typedValue={typedValue}
                  setTypedValue={setTypedValue}
                  tokenDisplayValue={tokenDisplayValue}
                  kesDisplayValue={kesDisplayValue}
                  tokenSymbol={selectedToken.symbol}
                  exchangeRate={exchangeRate}
                  feePreview={feePreview}
                  tokenBalance={balance}
                  isBalanceLoading={isLoading}
                  balanceError={balanceExceeded}
                  sanitize={sanitizeDecimalInput}
                  tokenSelector={tokenSelectorNode}
                />
                {amountError && !exceedsBalance && amount.trim() ? (
                  <p className="-mt-2 text-xs text-red-500">{amountError}</p>
                ) : null}

                {networkError ? (
                  <p className="text-xs text-red-500">{networkError}</p>
                ) : null}

                {walletError ? (
                  <p className="text-xs text-amber-600">{walletError}</p>
                ) : null}

                {/* Submit */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white bg-[var(--ep-accent)] hover:bg-[var(--ep-accent-hover)] shadow-[0_2px_16px_rgba(67,57,202,0.25)] hover:shadow-[0_4px_24px_rgba(67,57,202,0.35)] transition-all duration-200 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    `Send ${selectedToken.symbol}`
                  )}
                </button>

                {/* Tx result */}
                {txHash ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">Transfer submitted</p>
                        <p className="mt-1 break-all font-mono text-xs">{txHash}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyHash}
                        className="shrink-0 rounded-full border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-white/70"
                      >
                        {copiedHash === txHash ? (
                          <span className="inline-flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Copied
                          </span>
                        ) : (
                          "Copy hash"
                        )}
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              /* ── RECEIVE view ── */
              <>
                <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <p>
                      Only send tokens on a supported network to this address.
                    </p>
                  </div>
                </div>

                <div className="flex justify-center rounded-2xl border border-[var(--ep-border)] bg-white p-4">
                  {address ? (
                    <QRCode value={address} size={180} />
                  ) : (
                    <div className="flex h-[180px] w-[180px] items-center justify-center text-center text-sm text-[var(--ep-muted)]">
                      Connect a wallet to generate a QR code.
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-input)] px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ep-muted)]">
                    Your address
                  </p>
                  <p className="mt-1.5 break-all font-mono text-sm text-[var(--ep-heading)]">
                    {address ?? "No wallet connected"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyAddress}
                  disabled={!address}
                  className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white bg-[var(--ep-accent)] hover:bg-[var(--ep-accent-hover)] shadow-[0_2px_16px_rgba(67,57,202,0.25)] hover:shadow-[0_4px_24px_rgba(67,57,202,0.35)] transition-all duration-200 disabled:opacity-50"
                >
                  {copiedAddress ? (
                    <>
                      <Check className="h-4 w-4" />
                      Address copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy address
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <QrScannerModal
        open={showQrScanner}
        onClose={() => setShowQrScanner(false)}
        onScan={(value) => {
          // Strip ethereum: prefix if present
          const cleaned = value.replace(/^ethereum:/i, "").split("@")[0];
          setRecipientInput(cleaned);
        }}
      />
    </>
  );
}
