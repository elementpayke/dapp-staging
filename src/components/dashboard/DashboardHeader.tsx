import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { Copy, Check, ArrowLeftRight } from "lucide-react";
import SwitchWalletModal from "./SwitchWalletModal";

const DashboardHeader = () => {
  const { address } = useWallet();
  const [copied, setCopied] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
          <div className="flex items-center gap-2 self-start">
            <button
              onClick={handleCopyAddress}
              className="flex items-center gap-2 rounded-full px-4 py-1.5 bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] border border-[var(--ep-accent)]/20 hover:bg-[var(--ep-accent)]/15 transition-colors"
            >
              <span className="text-xs font-mono truncate max-w-[140px] sm:max-w-[200px]">
                {address}
              </span>
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
              ) : (
                <Copy className="h-3.5 w-3.5 flex-shrink-0" />
              )}
            </button>

            <button
              onClick={() => setSwitchOpen(true)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-[var(--ep-bg-input)] text-[var(--ep-heading)] border border-[var(--ep-border)] hover:border-[var(--ep-accent)]/40 hover:bg-[var(--ep-accent-muted)] hover:text-[var(--ep-accent)] transition-colors"
              aria-label="Switch wallet"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Switch</span>
            </button>
          </div>
        )}
      </div>

      <SwitchWalletModal open={switchOpen} onOpenChange={setSwitchOpen} />
    </div>
  );
};

export default DashboardHeader;
