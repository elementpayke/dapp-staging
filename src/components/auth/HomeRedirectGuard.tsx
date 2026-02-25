"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/authStore";

export default function HomeRedirectGuard() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const connectedWallets = useAuthStore((s) => s.connectedWallets);
  const backendWallets = useAuthStore((s) => s.user?.wallets);
  const { user: privyUser } = usePrivy();

  const walletAccount = privyUser?.linkedAccounts?.find((account) => account.type === "wallet");
  const privyWalletAddress =
    (walletAccount && "address" in walletAccount ? walletAccount.address : null) ??
    privyUser?.wallet?.address ??
    null;

  const hasConnectedWallet =
    Boolean(privyWalletAddress) ||
    connectedWallets.length > 0 ||
    (backendWallets?.length ?? 0) > 0;

  useEffect(() => {
    if (!isAuthenticated || !hasConnectedWallet) return;
    router.replace("/dashboard");
  }, [isAuthenticated, hasConnectedWallet, router]);

  return null;
}
