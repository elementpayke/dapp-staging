import { FC } from "react";
import Link from "next/link";

interface WalletCardProps {
  type: "METAMASK" | "COINBASE WALLET";
  crypto: {
    symbol: string;
    amount: string;
    value: number;
  };
  address: string;
}

const WalletCard: FC<WalletCardProps> = ({ type, crypto, address }) => {
  const isMetamask = type === "METAMASK";

  // ── Icon accent colours are brand colours, intentionally kept hardcoded ──
  const iconBg = isMetamask ? "bg-[#F6851B]" : "bg-[#0052FF]";
  const symbolColor = isMetamask ? "text-[#F6851B]" : "text-[#0052FF]";

  return (
    // bg-[var(--ep-bg-card)] replaces the old hardcoded dark hex backgrounds
    // so the card surfaces correctly in both light and dark themes.
    <div className="bg-[var(--ep-bg-card)] border border-[var(--ep-border)] rounded-xl p-4 h-full">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div
            className={`${iconBg} w-8 h-8 rounded-lg flex items-center justify-center text-white font-medium flex-shrink-0`}
          >
            {type[0]}
          </div>
          {/* text-[var(--ep-heading)] replaces hardcoded text-white */}
          <span className="font-medium whitespace-nowrap text-[var(--ep-heading)]">{type}</span>
        </div>
        {/* text-[var(--ep-muted)] replaces text-gray-400 */}
        <span className="text-xs text-[var(--ep-muted)] font-mono truncate ml-2">{address}</span>
      </div>

      <div className="mt-4">
        {/* text-[var(--ep-muted)] replaces text-gray-300 */}
        <div className="flex items-center gap-2 text-sm text-[var(--ep-muted)]">
          <span className={`font-semibold ${symbolColor}`}>{crypto.symbol}</span>
          <span>{crypto.amount}</span>
        </div>
        {/* text-[var(--ep-heading)] replaces implicit white / dark text */}
        <div className="text-lg font-semibold mt-1 text-[var(--ep-heading)]">
          ${crypto.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
};

const CryptoWallet: FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {/* text-[var(--ep-heading)] replaces hardcoded text-black */}
        <h2 className="text-lg font-medium text-[var(--ep-heading)]">My Wallets</h2>
        {/* text-[var(--ep-accent)] replaces text-blue-600 */}
        <Link href="#" className="text-[var(--ep-accent)] hover:text-[var(--ep-accent-hover)]">
          View All (3)
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <WalletCard
          type="METAMASK"
          crypto={{ symbol: "BTC", amount: "2.5e-7", value: 79.9 }}
          address="0x1234...ABCD"
        />
        <WalletCard
          type="COINBASE WALLET"
          crypto={{ symbol: "USDC", amount: "509.56", value: 2679.9 }}
          address="0x1234...ABCD"
        />
        {/* Add-wallet slot: border-[var(--ep-border)] replaces border-gray-200 */}
        <div className="border-2 border-dashed border-[var(--ep-border)] rounded-xl flex items-center justify-center h-[140px] bg-[var(--ep-bg-input)]">
          <button className="text-[var(--ep-accent)] flex flex-col items-center gap-2 hover:text-[var(--ep-accent-hover)] transition-colors">
            <span className="text-2xl leading-none">+</span>
            <span className="text-sm">Add a Wallet</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CryptoWallet;
