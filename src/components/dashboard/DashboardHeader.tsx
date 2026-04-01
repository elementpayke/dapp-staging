import { useMemo, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { Copy, Check, ArrowLeftRight } from "lucide-react";
import { useWallets } from "@privy-io/react-auth";
import { sameWalletAddress } from "@/lib/privy-wallet-selection";
import SwitchWalletModal from "./SwitchWalletModal";
import { WalletClientIcon, walletLabel, truncateAddress } from "./wallet-branding";

const DashboardHeader = () => {
  const { address } = useWallet();
  const { wallets } = useWallets();
  const [copied, setCopied] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);

  const activeWallet = useMemo(
    () => wallets.find((wallet) => sameWalletAddress(wallet.address, address ?? "")) ?? null,
    [wallets, address],
  );

  const handleCopyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-[var(--ep-heading)]">
            Welcome back
            <span className="ml-2">👋</span>
          </h1>
          <p className="mt-0.5 text-sm text-[var(--ep-muted)]">
            Spend and deposit crypto instantly with up to zero fees
          </p>
        </div>

        {address && (
          <div className="flex flex-row items-center gap-2 min-w-0">
            <button
              onClick={handleCopyAddress}
              className="flex items-center gap-2 rounded-2xl px-3 py-2 min-w-0 flex-1 sm:flex-none
                bg-[var(--ep-accent-muted)] text-[var(--ep-heading)]
                border border-[var(--ep-accent)]/20
                hover:bg-[var(--ep-accent)]/15 transition-colors"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--ep-accent)]/15">
                <WalletClientIcon clientType={activeWallet?.walletClientType} size={20} />
              </div>

              <div className="min-w-0 text-left">
                <p className="text-sm font-semibold text-[var(--ep-heading)] truncate">
                  {walletLabel(activeWallet?.walletClientType)}
                </p>
                <p className="text-xs font-mono text-[var(--ep-accent)] truncate max-w-[100px] sm:max-w-[200px]">
                  {truncateAddress(address)}
                </p>
              </div>

              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--ep-accent)]/10">
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-[var(--ep-accent)]" />
                )}
              </div>
            </button>

            <button
              onClick={() => setSwitchOpen(true)}
              className="flex flex-shrink-0 items-center justify-center gap-2 rounded-2xl px-3 py-2
                text-sm font-semibold
                bg-[var(--ep-bg-input)] text-[var(--ep-heading)]
                border border-[var(--ep-border)]
                hover:border-[var(--ep-accent)]/40 hover:bg-[var(--ep-accent-muted)] hover:text-[var(--ep-accent)]
                transition-colors"
              aria-label="Switch wallet"
            >
              <ArrowLeftRight className="h-4 w-4 flex-shrink-0" />
              <span className="hidden xs:inline sm:inline">Switch Wallet</span>
            </button>
          </div>
        )}
      </div>

      <SwitchWalletModal open={switchOpen} onOpenChange={setSwitchOpen} />
    </div>
  );
};

export default DashboardHeader;
