"use client";

import { useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { ArrowDownToLine, Check, Copy, ShieldAlert } from "lucide-react";
import { useWallets } from "@privy-io/react-auth";
import { useWallet } from "@/hooks/useWallet";
import { sameWalletAddress } from "@/lib/privy-wallet-selection";
import { useAuthStore } from "@/stores/authStore";
import { truncateAddress, walletLabel } from "../wallet-branding";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ReceiveModal() {
  const { address } = useWallet();
  const { wallets } = useWallets();
  const walletPreference = useAuthStore((state) => state.walletPreference);
  const [copied, setCopied] = useState(false);

  const activeWallet = useMemo(
    () => wallets.find((wallet) => sameWalletAddress(wallet.address, address)) ?? null,
    [wallets, address],
  );
  const activeWalletLabel =
    walletPreference === "embedded"
      ? walletLabel("privy")
      : walletLabel(activeWallet?.walletClientType);

  const handleCopyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger
        className="flex items-center gap-1.5 sm:gap-2 bg-[var(--ep-bg-input)] text-[var(--ep-heading)] text-xs sm:text-sm font-semibold py-2 px-3 sm:py-3 sm:px-5 rounded-full border border-[var(--ep-border)] hover:border-[var(--ep-accent)]/40 hover:bg-[var(--ep-accent-muted)] transition-all duration-200"
      >
        <ArrowDownToLine size={16} className="sm:w-[18px] sm:h-[18px]" />
        Receive
      </DialogTrigger>

      <DialogContent className="w-[95vw] sm:w-full max-w-md p-5 sm:p-6 bg-[var(--ep-bg-card)] border border-[var(--ep-border)] rounded-2xl shadow-[var(--ep-card-shadow)]">
        <DialogHeader className="pb-3">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ep-accent-muted)] text-[var(--ep-accent)]">
              <ArrowDownToLine className="h-4 w-4" />
            </span>
            <p className="text-xs font-medium text-[var(--ep-muted)] sm:text-sm">
              Wallet receive details
            </p>
          </div>
          <DialogTitle className="text-lg font-semibold text-[var(--ep-heading)]">
            Receive Base tokens
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-input)] px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ep-muted)]">
              Active wallet
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--ep-heading)]">
              {activeWalletLabel}
            </p>
            <p className="mt-1 text-xs text-[var(--ep-muted)]">
              Chain: Base (Ethereum L2)
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Only send Base-network tokens to this address</p>
                <p className="mt-1 text-xs">
                  Sending USDC from another chain to this Base address will not appear in this dashboard flow.
                </p>
              </div>
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
              Receive address
            </p>
            <p className="mt-2 break-all font-mono text-sm text-[var(--ep-heading)]">
              {address ?? "No wallet connected"}
            </p>
            {address ? (
              <p className="mt-1 text-xs text-[var(--ep-muted)]">
                Short view: {truncateAddress(address)}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleCopyAddress}
            disabled={!address}
            className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white bg-[var(--ep-accent)] hover:bg-[var(--ep-accent-hover)] shadow-[0_2px_16px_rgba(67,57,202,0.25)] hover:shadow-[0_4px_24px_rgba(67,57,202,0.35)] transition-all duration-200 disabled:opacity-50"
          >
            {copied ? (
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
