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
  const bgColor = isMetamask ? "bg-[#2C2D3B]" : "bg-[#2D2A3C]";
  const iconBg = isMetamask ? "bg-[#F6851B]" : "bg-[#0052FF]";

  return (
    <div className={`${bgColor} rounded-xl p-4 text-white h-full`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div
            className={`${iconBg} w-8 h-8 rounded-lg flex items-center justify-center text-white font-medium`}
          >
            {type[0]}
          </div>
          <span className="font-medium whitespace-nowrap">{type}</span>
        </div>
        <span className="text-xs text-gray-400">{address}</span>
      </div>
      <div className="mt-4">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className={isMetamask ? "text-[#F6851B]" : "text-[#0052FF]"}>
            {crypto.symbol}
          </span>
          <span>{crypto.amount}</span>
        </div>
        <div className="text-lg font-medium mt-1">
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
        <h2 className="text-lg font-medium text-black">My Wallets</h2>
        <Link href="#" className="text-blue-600 hover:text-blue-700">
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
        <div className="border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center h-[140px] bg-white">
          <button className="text-blue-600 flex flex-col items-center gap-2">
            <span className="text-2xl">+</span>
            <span>Add a Wallet</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CryptoWallet;
