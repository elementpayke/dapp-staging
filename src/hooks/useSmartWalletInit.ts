"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/authStore";
import { getPrivyToken } from "@/services/auth";

/** Max time (ms) to wait for smart wallet before giving up. */
const MAX_WAIT_MS = 30_000;
/** How often (ms) to re-check readiness during the wait loop. */
const POLL_INTERVAL_MS = 1_500;

export type SmartWalletInitStatus =
  | "idle"
  | "waiting"
  | "ready"
  | "failed";

/**
 * Background smart-wallet initialization hook.
 *
 * Monitors the Privy `SmartWalletsProvider` client readiness and, if the
 * client isn't ready after authentication, polls until it is (up to
 * MAX_WAIT_MS).  If Privy auth itself is the blocker (stale / missing
 * RS256 token), the hook will attempt to re-fetch the Privy JWT via the
 * server-side `/api/auth/privy-token` route so the SDK can authenticate
 * in the background without blocking the UI.
 *
 * Returns:
 *  - `status`  — current readiness state
 *  - `retry()` — manual retry trigger
 */
export function useSmartWalletInit() {
  const { client: smartWalletClient } = useSmartWallets();
  const { authenticated, ready: privyReady } = usePrivy();
  const { wallets } = useWallets();
  const walletPreference = useAuthStore((s) => s.walletPreference);
  const isOtpVerified = useAuthStore((s) => s.isOtpVerified);

  const [status, setStatus] = useState<SmartWalletInitStatus>(
    smartWalletClient ? "ready" : "idle",
  );

  const waitStartRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRefetchedRef = useRef(false);

  const isEmbedded = walletPreference === "embedded";
  const hasEmbeddedWallet = wallets.some(
    (w) => w.walletClientType === "privy",
  );

  // Immediately flip to ready when client appears
  useEffect(() => {
    if (smartWalletClient) {
      setStatus("ready");
      waitStartRef.current = null;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [smartWalletClient]);

  // Core polling loop — runs when embedded wallet user is authenticated
  // but SmartWalletsProvider hasn't produced a client yet
  useEffect(() => {
    if (!isEmbedded || !isOtpVerified) return;
    if (smartWalletClient) return; // already ready

    // Start the waiting state
    if (status !== "waiting" && status !== "failed") {
      setStatus("waiting");
      waitStartRef.current = Date.now();
      tokenRefetchedRef.current = false;
    }

    const poll = async () => {
      // Client appeared between ticks
      if (useSmartWallets as any /* checked via getter */) {
        // We can't call hooks here — the effect re-runs when
        // smartWalletClient changes, which is sufficient.
      }

      const elapsed = Date.now() - (waitStartRef.current ?? Date.now());

      // Timeout — declare failure
      if (elapsed > MAX_WAIT_MS) {
        console.warn("[useSmartWalletInit] Timed out waiting for smart wallet client");
        setStatus("failed");
        return;
      }

      // If Privy isn't authenticated yet and we haven't retried the token,
      // attempt to re-fetch the RS256 JWT so PrivyAuthSync can pick it up.
      if (!authenticated && privyReady && !tokenRefetchedRef.current) {
        tokenRefetchedRef.current = true;
        console.log("[useSmartWalletInit] Privy not authenticated — refetching RS256 token");
        try {
          const { token } = await getPrivyToken();
          if (token) {
            useAuthStore.getState().setPrivyToken(token);
            console.log("[useSmartWalletInit] Privy token refreshed and stored");
          }
        } catch (err) {
          console.warn("[useSmartWalletInit] Privy token refetch failed:", err);
        }
      }

      // Schedule next tick
      timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    };

    timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isEmbedded, isOtpVerified, smartWalletClient, authenticated, privyReady, status]);

  // Manual retry
  const retry = useCallback(() => {
    if (smartWalletClient) {
      setStatus("ready");
      return;
    }
    console.log("[useSmartWalletInit] Manual retry triggered");
    waitStartRef.current = Date.now();
    tokenRefetchedRef.current = false;
    setStatus("waiting");
  }, [smartWalletClient]);

  return {
    status,
    smartWalletReady: !!smartWalletClient,
    retry,
  };
}
