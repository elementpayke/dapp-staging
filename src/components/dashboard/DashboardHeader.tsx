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
    () => wallets.find((wallet) => sameWalletAddress(wallet.address, address)) ?? null,
    [wallets, address],
  );

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="hidden sm:block">
          <h1 className="text-lg font-bold tracking-tight text-[var(--ep-heading)]">
            Welcome back
            <span className="ml-2">👋</span>
          </h1>
          <p className="mt-0.5 text-sm text-[var(--ep-muted)]">
            Spend and deposit crypto instantly with up to zero fees
          </p>
        </div>

        {address && (
          <div className="flex flex-row items-center gap-2 self-start">
            <button
              onClick={handleCopyAddress}
              className="flex items-center gap-2 sm:gap-3 rounded-2xl px-2 sm:px-3 py-1 bg-[var(--ep-accent-muted)] text-[var(--ep-heading)] border border-[var(--ep-accent)]/20 hover:bg-[var(--ep-accent)]/15 transition-colors min-w-0"
            >
              <div className="flex h-7 w-7 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/90 shadow-sm">
                <WalletClientIcon clientType={activeWallet?.walletClientType} size={16} />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs sm:text-sm font-semibold text-[var(--ep-heading)]">
                  {walletLabel(activeWallet?.walletClientType)}
                </p>
                <p className="text-[10px] sm:text-xs font-mono text-[var(--ep-accent)] truncate max-w-[100px] sm:max-w-[250px]">
                  {truncateAddress(address)}
                </p>
              </div>
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/80">
                {copied ? (
                  <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[var(--ep-accent)]" />
                )}
              </div>
            </button>

            <button
              onClick={() => setSwitchOpen(true)}
              className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-2xl px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold bg-[var(--ep-bg-input)] text-[var(--ep-heading)] border border-[var(--ep-border)] hover:border-[var(--ep-accent)]/40 hover:bg-[var(--ep-accent-muted)] hover:text-[var(--ep-accent)] transition-colors whitespace-nowrap flex-shrink-0"
              aria-label="Switch wallet"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Switch Wallet</span>
              <span className="sm:hidden">Switch</span>
            </button>
          </div>
        )}
      </div>

      <SwitchWalletModal open={switchOpen} onOpenChange={setSwitchOpen} />
    </div>
  );
};

export default DashboardHeader;
