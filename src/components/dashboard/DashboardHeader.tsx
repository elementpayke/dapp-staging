import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { Copy, Check } from "lucide-react";

const DashboardHeader = () => {
  const { address } = useWallet();
  const [copied, setCopied] = useState(false);

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
          <button
            onClick={handleCopyAddress}
            className="flex items-center gap-2 self-start rounded-full px-4 py-1.5 bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] border border-[var(--ep-accent)]/20 hover:bg-[var(--ep-accent)]/15 transition-colors"
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
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
