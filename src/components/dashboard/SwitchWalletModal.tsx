"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Check, Loader2, Plus, AlertCircle } from "lucide-react";
import { usePrivy, useWallets, useModalStatus, type ConnectedWallet } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { useAccount } from "wagmi";
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
import { getExplicitSelectedWalletAddress, sameWalletAddress } from "@/lib/privy-wallet-selection";
import { WalletClientIcon, walletLabel, truncateAddress } from "./wallet-branding";
import { toast } from "sonner";

interface SwitchWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const normalizeAddress = (address: string) => address.toLowerCase();

export default function SwitchWalletModal({ open, onOpenChange }: SwitchWalletModalProps) {
  const { linkWallet } = usePrivy();
  const { isOpen: privyModalOpen } = useModalStatus();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();
  const { address: wagmiAddress } = useAccount();

  const user = useAuthStore((s) => s.user);
  const walletPreference = useAuthStore((s) => s.walletPreference);
  const connectedWallets = useAuthStore((s) => s.connectedWallets);
  const setWalletPreference = useAuthStore((s) => s.setWalletPreference);
  const addConnectedWallet = useAuthStore((s) => s.addConnectedWallet);

  const [switchingAddress, setSwitchingAddress] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedWalletAddress = useMemo(
    () =>
      getExplicitSelectedWalletAddress({
        walletPreference,
        wallets,
        wagmiAddress,
      }),
    [walletPreference, wallets, wagmiAddress],
  );

  const registeredAddresses = useMemo(
    () =>
      new Set(
        [
          ...connectedWallets,
          ...(user?.wallets?.map((wallet) => wallet.address) ?? []),
        ].map(normalizeAddress),
      ),
    [connectedWallets, user?.wallets],
  );

  const currentSelectedWalletRef = useRef<ConnectedWallet | null>(null);
  const walletsBeforeLinkRef = useRef<Set<string>>(new Set());
  const privyModalWasOpenRef = useRef(false);

  const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === "privy");
  const externalWallets = wallets.filter((wallet) => wallet.walletClientType !== "privy");

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSwitchingAddress(null);
      setLinking(false);
      setError(null);
    }
  }, [open]);

  // If the user dismisses Privy's wallet picker without linking anything,
  // clear the "Linking..." state so the modal stays interactive.
  useEffect(() => {
    if (!linking) {
      privyModalWasOpenRef.current = false;
      return;
    }

    if (privyModalOpen) {
      privyModalWasOpenRef.current = true;
      return;
    }

    if (!privyModalWasOpenRef.current) return;
    privyModalWasOpenRef.current = false;

    const timeoutId = setTimeout(() => {
      const knownAddresses = walletsBeforeLinkRef.current;
      const hasNewExternalWallet = wallets.some(
        (wallet) => wallet.walletClientType !== "privy" && !knownAddresses.has(wallet.address),
      );
      if (!hasNewExternalWallet) {
        setLinking(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [linking, privyModalOpen, wallets]);

  /** Select a wallet — register with backend if needed, then switch the active wagmi wallet. */
  const handleSelectWallet = useCallback(
    async (address: string, type: "embedded" | "external") => {
      setError(null);
      const targetWallet =
        type === "embedded"
          ? embeddedWallet
          : externalWallets.find((wallet) => sameWalletAddress(wallet.address, address));

      if (!targetWallet) {
        setError("We couldn't find that wallet in your connected wallets.");
        return;
      }

      const isCurrentlyActive =
        walletPreference === type && sameWalletAddress(selectedWalletAddress, address);
      if (isCurrentlyActive) {
        onOpenChange(false);
        return;
      }

      currentSelectedWalletRef.current =
        wallets.find((wallet) => sameWalletAddress(wallet.address, selectedWalletAddress)) ?? null;

      const alreadyRegistered =
        type === "embedded" || registeredAddresses.has(normalizeAddress(address));

      setSwitchingAddress(address);

      try {
        if (!alreadyRegistered) {
          await registerWallet(address, "base");
          addConnectedWallet(address);
        }

        await setActiveWallet(targetWallet);
        setWalletPreference(type);
        onOpenChange(false);

        toast.success(
          alreadyRegistered
            ? `Switched to ${walletLabel(targetWallet.walletClientType)}.`
            : `${walletLabel(targetWallet.walletClientType)} linked and ready to use.`,
        );
      } catch (err: unknown) {
        if (currentSelectedWalletRef.current) {
          try {
            await setActiveWallet(currentSelectedWalletRef.current);
          } catch (restoreErr) {
            console.warn("[SwitchWalletModal] Failed to restore previous active wallet:", restoreErr);
          }
        }

        if (isWalletOwnershipConflictError(err)) {
          setError("This wallet is linked to another account.");
          toast.error("This wallet is linked to another account.");
        } else {
          const msg = err instanceof Error ? err.message : "Failed to switch wallet";
          setError(msg);
          toast.error(msg);
        }
      } finally {
        setSwitchingAddress(null);
        setLinking(false);
      }
    },
    [
      embeddedWallet,
      externalWallets,
      walletPreference,
      selectedWalletAddress,
      registeredAddresses,
      wallets,
      addConnectedWallet,
      setActiveWallet,
      setWalletPreference,
      onOpenChange,
    ],
  );

  // Detect newly linked external wallet after linkWallet() call
  useEffect(() => {
    if (!linking) return;

    const knownAddresses = walletsBeforeLinkRef.current;
    const newWallet = wallets.find(
      (wallet) => wallet.walletClientType !== "privy" && !knownAddresses.has(wallet.address),
    );

    if (newWallet) {
      setLinking(false);
      handleSelectWallet(newWallet.address, "external");
    }
  }, [wallets, linking, handleSelectWallet]);

  /** Open Privy's wallet linking modal for a new external wallet. */
  const handleLinkNewWallet = useCallback(() => {
    setError(null);
    currentSelectedWalletRef.current =
      wallets.find((wallet) => sameWalletAddress(wallet.address, selectedWalletAddress)) ?? null;
    walletsBeforeLinkRef.current = new Set(wallets.map((wallet) => wallet.address));
    setLinking(true);
    linkWallet();
  }, [wallets, linkWallet, selectedWalletAddress]);

  const isActive = (address: string, type: "embedded" | "external"): boolean =>
    walletPreference === type && sameWalletAddress(selectedWalletAddress, address);

  // Hide our modal while Privy's wallet-linking modal is open so the user
  // can interact with it (type, scroll, etc.).  The cleanup effect above
  // only watches the `open` prop from the parent, which stays `true`, so
  // our internal state (linking, etc.) is preserved.
  const hideForPrivy = linking && privyModalOpen;

  return (
    <Dialog open={open && !hideForPrivy} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--ep-bg-card)] border-[var(--ep-border)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[var(--ep-heading)]">Switch Wallet</DialogTitle>
          <p className="text-sm text-[var(--ep-muted)]">
            Choose the wallet this dashboard should use right now.
          </p>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {embeddedWallet && (
            <button
              type="button"
              onClick={() => handleSelectWallet(embeddedWallet.address, "embedded")}
              disabled={switchingAddress !== null}
              className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                isActive(embeddedWallet.address, "embedded")
                  ? "border-[var(--ep-accent)] bg-[var(--ep-accent-muted)]"
                  : "border-[var(--ep-border)] hover:border-[var(--ep-accent)]/40 hover:bg-[var(--ep-bg-input)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--ep-accent-muted)]">
                  <WalletClientIcon clientType={embeddedWallet.walletClientType} size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--ep-heading)]">
                      {walletLabel(embeddedWallet.walletClientType)}
                    </span>
                    <span className="rounded-full bg-[var(--ep-accent)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--ep-accent)]">
                      Embedded
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs font-mono text-[var(--ep-muted)] truncate">
                    {truncateAddress(embeddedWallet.address)}
                  </div>
                </div>
                {switchingAddress === embeddedWallet.address ? (
                  <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-[var(--ep-accent)]" />
                ) : isActive(embeddedWallet.address, "embedded") ? (
                  <Check className="h-4 w-4 flex-shrink-0 text-[var(--ep-accent)]" />
                ) : null}
              </div>
            </button>
          )}

          {externalWallets.map((wallet) => (
            <button
              key={wallet.address}
              type="button"
              onClick={() => handleSelectWallet(wallet.address, "external")}
              disabled={switchingAddress !== null}
              className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                isActive(wallet.address, "external")
                  ? "border-[var(--ep-accent)] bg-[var(--ep-accent-muted)]"
                  : "border-[var(--ep-border)] hover:border-[var(--ep-accent)]/40 hover:bg-[var(--ep-bg-input)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--ep-bg-input)]">
                  <WalletClientIcon clientType={wallet.walletClientType} size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--ep-heading)]">
                      {walletLabel(wallet.walletClientType)}
                    </span>
                    <span className="rounded-full bg-[var(--ep-bg-input)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--ep-muted)]">
                      External
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs font-mono text-[var(--ep-muted)] truncate">
                    {truncateAddress(wallet.address)}
                  </div>
                </div>
                {switchingAddress === wallet.address ? (
                  <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-[var(--ep-accent)]" />
                ) : isActive(wallet.address, "external") ? (
                  <Check className="h-4 w-4 flex-shrink-0 text-[var(--ep-accent)]" />
                ) : null}
              </div>
            </button>
          ))}

          {wallets.length === 0 && (
            <div className="py-6 text-center text-sm text-[var(--ep-muted)]">
              No wallets found. Link one below.
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleLinkNewWallet}
          disabled={linking || switchingAddress !== null}
          className="w-full rounded-xl border-2 border-dashed border-[var(--ep-border)] px-4 py-3 text-sm font-medium text-[var(--ep-accent)] transition-colors hover:border-[var(--ep-accent)]/40 hover:bg-[var(--ep-accent-muted)] disabled:opacity-50"
        >
          <span className="flex items-center justify-center gap-2">
            {linking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Linking external wallet...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Link a new external wallet
              </>
            )}
          </span>
        </button>
      </DialogContent>
    </Dialog>
  );
}
