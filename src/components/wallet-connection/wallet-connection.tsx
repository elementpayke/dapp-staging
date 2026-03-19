"use client";

import React, { useCallback, useEffect, useRef } from "react";
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
import { useWallets } from "@privy-io/react-auth";
import { useDisconnect } from "wagmi";
import { LogOut, Wallet as WalletIcon } from "lucide-react";
import ClientOnly from "@/components/shared/ClientOnly";
import { useWalletStore } from "@/lib/useWallet";
import { useAuthStore } from "@/stores/authStore";
import { useAuthModalStore } from "@/stores/authModalStore";
import { useAuthSyncStore } from "@/stores/authSyncStore";
import { getExplicitSelectedWalletAddress } from "@/lib/privy-wallet-selection";

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
  const { login, linkWallet, logout: privyLogout, authenticated, ready, user } = usePrivy();
  const { wallets } = useWallets();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { disconnect: storeDisconnect } = useWalletStore();

  const router = useRouter();

  // ─── Derived wallet state ──────────────────────────────────────────
  const walletPreference = useAuthStore((s) => s.walletPreference);
  const walletAddress = getExplicitSelectedWalletAddress({
    walletPreference,
    wallets,
  });
  const linkedAccounts = user?.linkedAccounts;

  // ─── App-level auth state ───────────────────────────────────────
  const isAppAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openAuthModal = useAuthModalStore((s) => s.openAuthModal);


  // ─── Stale Privy session cleanup ──────────────────────────────────
  // If the app says "logged out" (no active session) but Privy still
  // thinks the user is authenticated, force-logout Privy to prevent
  // phantom wallet state.
  // IMPORTANT: Skip cleanup when walletConnecting is true (user is
  // actively linking a wallet) or isOtpVerified is true (mid-auth flow).
  const cleanupAttempted = useRef(false);
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const walletConnecting = useAuthModalStore((s) => s.walletConnecting);
  const isOtpVerified = useAuthStore((s) => s.isOtpVerified);

  useEffect(() => {
    // Clear any pending cleanup timer on every dep change
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }

    if (!ready) return;
    if (isOtpVerified) return;

    // Don't nuke Privy while the user is in the wallet-connect flow
    // or has just verified OTP (token may not have hydrated yet)
    if (walletConnecting || isOtpVerified) {
      console.log("[WalletConnection] Skipping stale-session cleanup — auth flow in progress");
      return;
    }

    if (authenticated && !cleanupAttempted.current) {
      // Debounce: wait 3s and re-check conditions before cleanup.
      // This prevents nuking a Privy session that's still initializing
      // after a custom JWT auth (PrivyAuthSync).
      cleanupTimerRef.current = setTimeout(() => {
        const { isOtpVerified: currentOtp } = useAuthStore.getState();
        const { walletConnecting: currentWC } = useAuthModalStore.getState();
        if (currentOtp || currentWC) {
          console.log("[WalletConnection] Stale-session cleanup aborted — auth flow started during debounce");
          return;
        }
        cleanupAttempted.current = true;
        console.warn(
          "[WalletConnection] Stale Privy session detected — app has no token but Privy is still authenticated. Forcing Privy logout."
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
      }, 3000);
    }

    if (isOtpVerified) {
      cleanupAttempted.current = false;
    }

    return () => {
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }
    };
  }, [ready, authenticated, isOtpVerified, walletConnecting, privyLogout, wagmiDisconnect, storeDisconnect]);

  // ─── Debug: log full state on every render ─────────────────────────
  useEffect(() => {
    console.group("[WalletConnection] State");
    console.log("ready:", ready);
    console.log("privy.authenticated:", authenticated);
    console.log("app.isAuthenticated:", isAppAuthenticated);
    console.log("app.isOtpVerified:", isOtpVerified);
    console.log("user:", user ? JSON.stringify({
      id: user.id,
      selectedWalletAddress: walletAddress ?? null,
      linkedAccountTypes: linkedAccounts?.map((a: any) => `${a.connectorType ?? a.type}${a.address ? `:${a.address}` : ""}`),
    }, null, 2) : null);
    console.log("walletAddress:", walletAddress ?? "none");
    console.log("isMobile:", isMobile, "isHero:", isHero);
    console.groupEnd();
  }, [ready, authenticated, isAppAuthenticated, isOtpVerified, user, walletAddress, linkedAccounts, isMobile, isHero]);

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
      </>
    );
  };

  /** User is app-authenticated but has no wallet yet — prompt to connect one. */
  const renderConnectWalletButton = () => {
    // When the user is already authenticated with Privy (via custom JWT),
    // we must use linkWallet() instead of login(). Privy rejects a second
    // login() call with "user is already logged in".
    const connectFn = authenticated ? linkWallet : login;
    return (
    <button
      className={getButtonClassName()}
      onClick={() => {
        console.log(`[WalletConnection] Connect Wallet clicked — using ${authenticated ? 'linkWallet' : 'login'} (authenticated=${authenticated})`);
        if (onConnectWalletClick) {
          onConnectWalletClick(connectFn);
          return;
        }
        connectFn();
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
  };

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
      wallet: {walletAddress ? walletAddress.slice(0, 6) + "…" + walletAddress.slice(-4) : "none"} |
      isAuthenticated: {useAuthStore.getState().isAuthenticated ? "yes" : "no"}
      {!isOtpVerified && authenticated && (
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

    // User is NOT signed in to the app (no active session)
    if (!isOtpVerified) {
      return renderSignInButton();
    }

    // Wallet registration in progress — PrivyWalletListener is calling the API
    if (walletConnecting) {
      return (
        <button className={getButtonClassName()} disabled>
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Registering Wallet…
          </span>
        </button>
      );
    }

    // Privy is still authenticating via custom JWT (PrivyAuthSync in progress)
    // — show a brief loading state to avoid calling login() which would
    // interrupt the JWT auth flow. Falls through to connect button if auth
    // sync has failed (user shouldn't be stuck forever).
    const authSyncFailed = useAuthSyncStore.getState().status === "failed";
    if (!authenticated && !authSyncFailed) {
      return (
        <button className={getButtonClassName()} disabled>
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Preparing wallet&hellip;
          </span>
        </button>
      );
    }

    // User IS signed in to the app, AND has a connected wallet via Privy
    if (walletAddress) {
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
        {debugBanner}
      </div>
    </ClientOnly>
  );
};

export default WalletConnection;
