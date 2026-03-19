import type { WalletPreference } from "@/stores/authStore";

export interface PrivyWalletLike {
  address: string;
  walletClientType?: string | null;
}

export interface PrivyUserLike {
  linkedAccounts?: readonly unknown[] | null;
}

interface ResolveWalletAddressParams {
  walletPreference: WalletPreference;
  wallets: PrivyWalletLike[];
  wagmiAddress?: string | null;
}

const normalize = (value: string) => value.toLowerCase();

const isEmbeddedWallet = (wallet: PrivyWalletLike) => wallet.walletClientType === "privy";

const sameAddress = (left: string, right: string) => normalize(left) === normalize(right);

export function hasEmbeddedPrivyWallet(user: PrivyUserLike | null | undefined): boolean {
  return (
    user?.linkedAccounts?.some((account) => {
      if (!account || typeof account !== "object") return false;
      return (account as { connectorType?: unknown }).connectorType === "embedded";
    }) ?? false
  );
}

export function getExplicitSelectedWalletAddress({
  walletPreference,
  wallets,
  wagmiAddress,
}: ResolveWalletAddressParams): string | null {
  if (walletPreference === "embedded") {
    return wallets.find(isEmbeddedWallet)?.address ?? null;
  }

  if (walletPreference === "external") {
    const externalWallets = wallets.filter((wallet) => !isEmbeddedWallet(wallet));
    if (wagmiAddress) {
      const wagmiMatch = externalWallets.find((wallet) => sameAddress(wallet.address, wagmiAddress));
      if (wagmiMatch) return wagmiMatch.address;
    }
    return null;
  }

  return null;
}
