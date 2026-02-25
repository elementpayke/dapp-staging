"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Wallet,
  WalletDropdown,
  WalletDropdownBasename,
  WalletDropdownLink,
} from "@coinbase/onchainkit/wallet";
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import { twMerge } from "tailwind-merge";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useDisconnect } from "wagmi";
import { LogOut, Wallet as WalletIcon } from "lucide-react";
import ClientOnly from "@/components/shared/ClientOnly";
import { useWalletStore } from "@/lib/useWallet";
import { useAuthStore } from "@/stores/authStore";
import { useAuthModalStore } from "@/stores/authModalStore";

const buttonStyles = {
  default:
    "w-full bg-blue-800 !text-white px-6 py-3 sm:py-4 rounded-full text-base sm:text-lg font-medium hover:bg-blue-700 transition-colors",
  hero: "w-full bg-gradient-to-r from-[#0514eb] to-[#de0413] !text-white px-8 py-4 rounded-full text-base sm:text-lg font-medium hover:opacity-90 transition-opacity",
  desktop:
    "bg-blue-800 !text-white px-6 py-2.5 rounded-full flex items-center space-x-2 hover:bg-blue-700 transition-colors",
  desktopHero:
    "bg-gradient-to-r from-[#0514eb] to-[#de0413] !text-white px-8 py-3.5 rounded-full flex items-center space-x-2 hover:opacity-90 transition-opacity",
};

const WalletConnection = ({
  isMobile = false,
  isHero = false,
  buttonClassName = "",
  onConnectWalletClick,
  onSignInClick,
  showDebugBanner = true,
}: {
  isMobile?: boolean;
  isHero?: boolean;
  buttonClassName?: string;
  onConnectWalletClick?: (login: () => void) => void;
  onSignInClick?: () => void;
  showDebugBanner?: boolean;
}) => {
  const { login, logout: privyLogout, authenticated, ready, user } = usePrivy();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { disconnect: storeDisconnect } = useWalletStore();
  const router = useRouter();

  // ─── Derived wallet state ──────────────────────────────────────────
  const walletAddress = user?.wallet?.address;
  const walletChain =  "base";
  const linkedAccounts = user?.linkedAccounts;

  // Example: Assume OTP verification status and user fields are stored in local state or context
  // Replace with actual logic as needed
  const [otpVerified, setOtpVerified] = useState(false);
  const [userFields, setUserFields] = useState<any>({});

  // Example: Simulate OTP verification and user fields retrieval
  useEffect(() => {
    // TODO: Replace with actual OTP verification and user field retrieval logic
    // For demonstration, set OTP as verified and some dummy fields
    if (authenticated && walletAddress) {
      setOtpVerified(true); // Replace with real check
      setUserFields({ email: user?.email, phone: user?.phone }); // Replace with real fields
    }
  }, [authenticated, walletAddress, user]);

  // ─── App-level auth state (bearer token / access token) ────────────
  const isAppAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const appToken = useAuthStore((s) => s.token);
  const openAuthModal = useAuthModalStore((s) => s.openAuthModal);
  // ─── Register wallet with backend ──────────────────────────────────
  const registerWallet = useCallback(async () => {
    if (!walletAddress || !appToken) return;
    try {
      const res = await fetch("/api/auth/connect-wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${appToken}`,
        },
        body: JSON.stringify({
          address: walletAddress,
          chain: walletChain || "base",
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to register wallet");
      }
      // Optionally handle response
      // const data = await res.json();
      console.log("[WalletConnection] Wallet registered with backend.");
    } catch (err) {
      console.error("[WalletConnection] Wallet registration error:", err);
    }
  }, [walletAddress, appToken, walletChain]);

  // ─── Stale Privy session cleanup ──────────────────────────────────
  // If the app says "logged out" (no bearer token) but Privy still
  // thinks the user is authenticated, force-logout Privy to prevent
  // phantom wallet state.
  const cleanupAttempted = useRef(false);

  useEffect(() => {
    if (!ready) return; // Privy hasn't initialised yet
    if (isAppAuthenticated && appToken) return; // Everything is in sync

    if (authenticated && !cleanupAttempted.current) {
      cleanupAttempted.current = true;
      console.warn(
        "[WalletConnection] Stale Privy session detected — app is logged out but Privy is still authenticated. Forcing Privy logout."
      );
      (async () => {
        try {
          await privyLogout();
          wagmiDisconnect();
          storeDisconnect();
          localStorage.removeItem("wallet-storage");
          console.log("[WalletConnection] Stale Privy session cleared.");
        } catch (err) {
          console.error("[WalletConnection] Failed to clear stale Privy session:", err);
        }
      })();
    }

    // Reset flag when app re-authenticates so cleanup can fire again later
    if (isAppAuthenticated && appToken) {
      cleanupAttempted.current = false;
    }
  }, [ready, authenticated, isAppAuthenticated, appToken, privyLogout, wagmiDisconnect, storeDisconnect]);

  // ─── Debug: log full state on every render ─────────────────────────
  useEffect(() => {
    console.group("[WalletConnection] State");
    console.log("ready:", ready);
    console.log("privy.authenticated:", authenticated);
    console.log("app.isAuthenticated:", isAppAuthenticated);
    console.log("app.token:", appToken ? `${appToken.slice(0, 12)}…` : "none");
    console.log("user:", user ? JSON.stringify({
      id: user.id,
      wallet: user.wallet ? { address: user.wallet.address } : null,
      linkedAccountTypes: linkedAccounts?.map((a: any) => `${a.type}${a.address ? `:${a.address}` : ""}`),
    }, null, 2) : null);
    console.log("walletAddress:", walletAddress ?? "none");
    console.log("isMobile:", isMobile, "isHero:", isHero);
    console.groupEnd();
  }, [ready, authenticated, isAppAuthenticated, appToken, user, walletAddress, linkedAccounts, isMobile, isHero]);

  // Register wallet once prerequisites are available.
  useEffect(() => {
    if (!isAppAuthenticated || !appToken) return;
    if (!authenticated || !walletAddress) return;
    void registerWallet();
  }, [isAppAuthenticated, appToken, authenticated, walletAddress, registerWallet]);

  /**
   * Unified disconnect: Privy logout (async) → wagmi disconnect → store cleanup → app auth clear.
   */
  const handleDisconnect = useCallback(async () => {
    try {
      if (authenticated) {
        await privyLogout();
      }
    } catch (err) {
      console.warn("Privy logout error (non-fatal):", err);
    }
    wagmiDisconnect();
    storeDisconnect();
    // Also clear app auth state so everything is in sync
    useAuthStore.getState().clearAuth();
    if (typeof window !== "undefined") {
      localStorage.removeItem("wallet-storage");
    }
    router.push("/");
  }, [authenticated, privyLogout, wagmiDisconnect, storeDisconnect, router]);

  const getButtonClassName = () => {
    let style;
    if (isMobile) {
      style = isHero ? buttonStyles.hero : buttonStyles.default;
    } else {
      style = isHero ? buttonStyles.desktopHero : buttonStyles.desktop;
    }
    return twMerge(style, buttonClassName);
  };

  // ─── Render helpers ────────────────────────────────────────────────

  /** Fully connected state: app auth ✔ + Privy auth ✔ + wallet ✔ */
  const renderConnectedState = () => {
    return (
      <>
        <Wallet>
          <Identity
            address={walletAddress as `0x${string}`}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Avatar className="h-6 w-6" />
            <Name />
          </Identity>
          <WalletDropdown>
            <Identity
              address={walletAddress as `0x${string}`}
              className="px-4 pt-3 pb-2"
              hasCopyAddressOnClick
            >
              <Avatar />
              <Name />
              <Address />
              <EthBalance />
            </Identity>
            <WalletDropdownBasename />
            <WalletDropdownLink icon="wallet" href="https://keys.coinbase.com">
              Wallet
            </WalletDropdownLink>
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </WalletDropdown>
        </Wallet>
        {/* Show dashboard link if OTP is verified */}
        {otpVerified && (
          <button
            className={twMerge(getButtonClassName(), "mt-3 bg-[var(--landing-accent)] hover:bg-[var(--landing-accent-hover)]")}
            onClick={() => {
              // Pass userFields as query params or via state
              // Here, we use query params for demonstration
              const params = new URLSearchParams(userFields).toString();
              router.push(`/dashboard${params ? `?${params}` : ""}`);
            }}
          >
            Start Transacting
          </button>
        )}
      </>
    );
  };

  /** User is app-authenticated but has no wallet yet — prompt to connect one. */
  const renderConnectWalletButton = () => (
    <button
      className={getButtonClassName()}
      onClick={() => {
        console.log("[WalletConnection] Connect Wallet clicked — app authenticated, prompting Privy login for wallet.");
        if (onConnectWalletClick) {
          onConnectWalletClick(login);
          return;
        }
        login();
      }}
      disabled={!ready}
    >
      {!ready ? (
        "Initializing..."
      ) : (
        <span className="flex items-center gap-2">
          <WalletIcon className="h-4 w-4" />
          Connect Wallet
        </span>
      )}
    </button>
  );

  /** User is NOT app-authenticated — they need to sign in first. */
  const renderSignInButton = () => (
    <button
      className={getButtonClassName()}
      onClick={() => {
        console.log("[WalletConnection] Sign In clicked — opening auth modal.");
        if (onSignInClick) {
          onSignInClick();
          return;
        }
        openAuthModal();
      }}
    >
      <span className="flex items-center gap-2">
        <WalletIcon className="h-4 w-4" />
        Sign In to Connect Wallet
      </span>
    </button>
  );

  // ─── Debug banner (visible in dev only) ────────────────────────────
  const debugBanner = showDebugBanner && process.env.NODE_ENV === "development" ? (
    <div className="text-[10px] text-gray-400 mt-1 font-mono">
      privy: {ready ? "ready" : "loading"} | privy-auth: {authenticated ? "yes" : "no"} |
      app-auth: {isAppAuthenticated ? "yes" : "no"} |
      wallet: {walletAddress ? walletAddress.slice(0, 6) + "…" + walletAddress.slice(-4) : "none"}
      {/* Stale session warning */}
      {!isAppAuthenticated && authenticated && (
        <span className="text-amber-500 ml-1">⚠ stale privy session</span>
      )}
    </div>
  ) : null;

  // ─── Determine which state to render ───────────────────────────────
  const renderContent = () => {
    // Not initialised yet
    if (!ready) {
      return (
        <button className={getButtonClassName()} disabled>
          Initializing...
        </button>
      );
    }

    // User is NOT signed in to the app (no bearer token)
    if (!isAppAuthenticated || !appToken) {
      return renderSignInButton();
    }

    // User IS signed in to the app, AND has a connected wallet via Privy
    if (authenticated && walletAddress) {
      return renderConnectedState();
    }

    // User IS signed in but has no wallet — prompt wallet connection
    return renderConnectWalletButton();
  };

  return (
    <ClientOnly
      fallback={
        <div className={isMobile ? "mt-8 space-y-4" : "w-full"}>
          <button className={getButtonClassName()} disabled>
            Loading...
          </button>
        </div>
      }
    >
      <div className="w-full">
        {renderContent()}
        {/* {debugBanner} */}
      </div>
    </ClientOnly>
  );
};

export default WalletConnection;
