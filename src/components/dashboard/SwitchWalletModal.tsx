"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Wallet, Check, Loader2, Plus, AlertCircle } from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/authStore";
import {
  connectWallet as registerWallet,
  isWalletOwnershipConflictError,
} from "@/services/auth";
import { toast } from "sonner";

interface SwitchWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Friendly label from Privy wallet client type */
function walletLabel(clientType: string): string {
  switch (clientType) {
    case "privy":
      return "ElementPay Wallet";
    case "metamask":
      return "MetaMask";
    case "coinbase_wallet":
      return "Coinbase Wallet";
    case "rainbow":
      return "Rainbow";
    case "walletconnect":
      return "WalletConnect";
    default:
      // Capitalize first letter
      return clientType.charAt(0).toUpperCase() + clientType.slice(1);
  }
}

/** Truncate an address for display */
function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function SwitchWalletModal({ open, onOpenChange }: SwitchWalletModalProps) {
  const { linkWallet } = usePrivy();
  const { wallets } = useWallets();

  const walletPreference = useAuthStore((s) => s.walletPreference);
  const connectedWallets = useAuthStore((s) => s.connectedWallets);
  const setWalletPreference = useAuthStore((s) => s.setWalletPreference);
  const addConnectedWallet = useAuthStore((s) => s.addConnectedWallet);

  const [switchingAddress, setSwitchingAddress] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track wallets count before linkWallet() to detect newly linked wallets
  const walletsBeforeLinkRef = useRef<Set<string>>(new Set());

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSwitchingAddress(null);
      setLinking(false);
      setError(null);
    }
  }, [open]);

  // Detect newly linked external wallet after linkWallet() call
  useEffect(() => {
    if (!linking) return;

    const knownAddresses = walletsBeforeLinkRef.current;
    const newWallet = wallets.find(
      (w) => w.walletClientType !== "privy" && !knownAddresses.has(w.address),
    );

    if (newWallet) {
      // New external wallet detected — register and select it
      handleSelectWallet(newWallet.address, "external");
      setLinking(false);
    }
  }, [wallets, linking]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Select a wallet — register with backend if needed, then update preference */
  const handleSelectWallet = useCallback(
    async (address: string, type: "embedded" | "external") => {
      setError(null);

      // Already the active wallet? Close modal.
      const isCurrentlyActive =
        (type === "embedded" && walletPreference === "embedded") ||
        (type === "external" && walletPreference === "external" &&
          wallets.find((w) => w.walletClientType !== "privy")?.address === address);

      if (isCurrentlyActive) {
        onOpenChange(false);
        return;
      }

      const alreadyRegistered = connectedWallets.includes(address);

      if (alreadyRegistered) {
        // Wallet already known to backend — just switch preference
        setWalletPreference(type);
        onOpenChange(false);
        toast.success(`Switched to ${walletLabel(type === "embedded" ? "privy" : "external")} wallet`);
        return;
      }

      // Wallet not registered — call backend
      setSwitchingAddress(address);
      try {
        await registerWallet(address, "base");
        addConnectedWallet(address);
        setWalletPreference(type);
        onOpenChange(false);
        toast.success("Wallet connected and activated");
      } catch (err: unknown) {
        if (isWalletOwnershipConflictError(err)) {
          setError("This wallet is linked to another account.");
          toast.error("This wallet is linked to another account.");
        } else {
          const msg = err instanceof Error ? err.message : "Failed to register wallet";
          setError(msg);
          toast.error(msg);
        }
      } finally {
        setSwitchingAddress(null);
      }
    },
    [walletPreference, wallets, connectedWallets, setWalletPreference, addConnectedWallet, onOpenChange],
  );

  /** Open Privy's native wallet linking modal */
  const handleLinkNewWallet = useCallback(() => {
    setError(null);
    // Snapshot current wallet addresses so we can detect the new one
    walletsBeforeLinkRef.current = new Set(wallets.map((w) => w.address));
    setLinking(true);
    linkWallet();
  }, [wallets, linkWallet]);

  // Split wallets into embedded and external
  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const externalWallets = wallets.filter((w) => w.walletClientType !== "privy");

  const isActive = (address: string, type: "embedded" | "external"): boolean => {
    if (walletPreference === type) {
      if (type === "embedded") return embeddedWallet?.address === address;
      return externalWallets.some((w) => w.address === address);
    }
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--ep-bg-card)] border-[var(--ep-border)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[var(--ep-heading)]">Switch Wallet</DialogTitle>
          <p className="text-sm text-[var(--ep-muted)]">
            Select which wallet to use or link a new one.
          </p>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 bg-red-500/10 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {/* Embedded wallet */}
          {embeddedWallet && (
            <button
              onClick={() => handleSelectWallet(embeddedWallet.address, "embedded")}
              disabled={switchingAddress !== null}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                isActive(embeddedWallet.address, "embedded")
                  ? "border-[var(--ep-accent)] bg-[var(--ep-accent-muted)]"
                  : "border-[var(--ep-border)] hover:border-[var(--ep-accent)]/40 hover:bg-[var(--ep-bg-input)]"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-[var(--ep-accent-muted)] flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-[var(--ep-accent)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--ep-heading)]">
                  ElementPay Wallet
                </div>
                <div className="text-xs font-mono text-[var(--ep-muted)] truncate">
                  {truncateAddress(embeddedWallet.address)}
                </div>
              </div>
              {switchingAddress === embeddedWallet.address ? (
                <Loader2 className="h-4 w-4 text-[var(--ep-accent)] animate-spin flex-shrink-0" />
              ) : isActive(embeddedWallet.address, "embedded") ? (
                <Check className="h-4 w-4 text-[var(--ep-accent)] flex-shrink-0" />
              ) : null}
            </button>
          )}

          {/* External wallets */}
          {externalWallets.map((wallet) => (
            <button
              key={wallet.address}
              onClick={() => handleSelectWallet(wallet.address, "external")}
              disabled={switchingAddress !== null}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                isActive(wallet.address, "external")
                  ? "border-[var(--ep-accent)] bg-[var(--ep-accent-muted)]"
                  : "border-[var(--ep-border)] hover:border-[var(--ep-accent)]/40 hover:bg-[var(--ep-bg-input)]"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-[var(--ep-bg-input)] flex items-center justify-center flex-shrink-0">
                <Wallet className="h-4 w-4 text-[var(--ep-heading)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--ep-heading)]">
                  {walletLabel(wallet.walletClientType)}
                </div>
                <div className="text-xs font-mono text-[var(--ep-muted)] truncate">
                  {truncateAddress(wallet.address)}
                </div>
              </div>
              {switchingAddress === wallet.address ? (
                <Loader2 className="h-4 w-4 text-[var(--ep-accent)] animate-spin flex-shrink-0" />
              ) : isActive(wallet.address, "external") ? (
                <Check className="h-4 w-4 text-[var(--ep-accent)] flex-shrink-0" />
              ) : null}
            </button>
          ))}

          {/* Empty state — no wallets at all */}
          {wallets.length === 0 && (
            <div className="text-center py-6 text-sm text-[var(--ep-muted)]">
              No wallets found. Link one below.
            </div>
          )}
        </div>

        {/* Link new wallet button */}
        <button
          onClick={handleLinkNewWallet}
          disabled={linking || switchingAddress !== null}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[var(--ep-border)] text-sm font-medium text-[var(--ep-accent)] hover:border-[var(--ep-accent)]/40 hover:bg-[var(--ep-accent-muted)] transition-colors disabled:opacity-50"
        >
          {linking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Linking...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Link New External Wallet
            </>
          )}
        </button>
      </DialogContent>
    </Dialog>
  );
}
