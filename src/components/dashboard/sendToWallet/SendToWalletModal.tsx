"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Loader2,
  ScanLine,
  SendHorizontal,
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
import { getExplorerInfo } from "@/utils/explorerUtils";
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

const DEFAULT_TOKEN = getAvailableTokens(true)[0]!;

export default function SendToWalletModal() {
  const { address } = useWallet();
  const { wallets } = useWallets();
  const walletPreference = useAuthStore((state) => state.walletPreference);
  const { gaslessTransfer, smartWalletReady } = useGaslessTransfer();
  const { writeContractAsync } = useWriteContract();

  const isEmbedded = walletPreference === "embedded";

  /* ── Token selector state ── */
  const [selectedToken, setSelectedToken] = useState<SupportedToken>(DEFAULT_TOKEN);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const tokenDropdownRef = useRef<HTMLDivElement>(null);

  const { balance, isCorrectNetwork, isLoading } = useTokenBalance({ token: selectedToken });

  const [open, setOpen] = useState(false);
  const [recipientInput, setRecipientInput] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
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
      enabled: open && shouldResolveEns,
    },
  });

  const activeWallet = useMemo(
    () => wallets.find((wallet) => sameWalletAddress(wallet.address, address)) ?? null,
    [wallets, address],
  );
  const walletType = walletPreference;
  const resolvedRecipient = shouldResolveEns ? ensAddress ?? null : trimmedRecipient || null;
  const amountValue = Number.parseFloat(amount);
  const exceedsBalance = Number.isFinite(amountValue) && amountValue > balance;
  const isSelfSend =
    resolvedRecipient !== null && sameWalletAddress(resolvedRecipient, address);

  /* ── Token dropdown outside-click. Use pointerdown so touch is covered. ── */
  useEffect(() => {
    if (!showTokenDropdown) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (tokenDropdownRef.current?.contains(e.target as Node)) return;
      setShowTokenDropdown(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
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
      setRecipientInput("");
      setAmount("");
      setEditableSide("TOKEN");
      setTypedValue("");
      setExchangeRate(null);
      setSubmitting(false);
      setCopiedHash(null);
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
      // Reset amount inputs (but keep recipient so user can send again quickly)
      setAmount("");
      setTypedValue("");
      setEditableSide("TOKEN");
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

      {showTokenDropdown && (
        <div className="absolute right-0 top-full mt-1 z-[100] w-64 rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-card)] p-1.5 shadow-lg">
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
        </div>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className="flex items-center gap-1.5 sm:gap-2 bg-[var(--ep-bg-input)] text-[var(--ep-heading)] text-xs sm:text-sm font-semibold py-2 px-3 sm:py-3 sm:px-5 rounded-full border border-[var(--ep-border)] hover:border-[var(--ep-accent)]/40 hover:bg-[var(--ep-accent-muted)] transition-all duration-200">
          <ArrowUpRight size={16} className="sm:w-[18px] sm:h-[18px]" />
          Send to Wallet
        </DialogTrigger>

        <DialogContent className="w-[95vw] sm:w-full max-w-lg p-5 sm:p-6 bg-[var(--ep-bg-card)] border border-[var(--ep-border)] rounded-2xl shadow-[var(--ep-card-shadow)]">
          <DialogHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ep-accent-muted)] text-[var(--ep-accent)]">
                  <SendHorizontal className="h-4 w-4" />
                </span>
                <div>
                  <DialogTitle className="text-base font-semibold text-[var(--ep-heading)]">
                    Send to Wallet
                  </DialogTitle>
                  <p className="text-[11px] text-[var(--ep-muted)]">
                    Peer-to-peer transfer
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
              maxButton={
                <button
                  type="button"
                  disabled={!balance || balance <= 0}
                  onClick={() => {
                    const maxStr = balance
                      .toFixed(6)
                      .replace(/0+$/, "")
                      .replace(/\.$/, "");
                    setEditableSide("TOKEN");
                    setTypedValue(maxStr);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-[var(--ep-accent)] bg-[var(--ep-accent-muted)] rounded-full hover:bg-[var(--ep-accent)]/15 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Max
                </button>
              }
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
            {txHash ? (() => {
              const explorer = getExplorerInfo(selectedToken.chain, txHash);
              return (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">Transfer submitted</p>
                      <button
                        type="button"
                        onClick={handleCopyHash}
                        className="mt-1 inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-mono text-xs text-emerald-700 hover:bg-white/60 transition-colors"
                        title="Copy transaction hash"
                      >
                        <span>{truncateAddress(txHash)}</span>
                        {copiedHash === txHash ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <a
                      href={explorer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-white/70 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-white transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View on explorer
                    </a>
                  </div>
                </div>
              );
            })() : null}
          </div>
        </DialogContent>
      </Dialog>

      <QrScannerModal
        open={showQrScanner}
        onClose={() => setShowQrScanner(false)}
        onScan={(value) => {
          const cleaned = value.replace(/^ethereum:/i, "").split("@")[0];
          setRecipientInput(cleaned);
        }}
      />
    </>
  );
}
