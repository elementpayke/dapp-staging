/**
 * Authentication service — handles OTP request/verify, token refresh, logout.
 * All calls proxy through Next.js API routes to keep the backend URL server-side.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

import {
  isWalletOwnershipConflictError as isWalletOwnershipConflictErrorFromPolicy,
  isWalletOwnershipConflictResponse,
  normalizeWalletConnectFailure,
  WALLET_OWNERSHIP_CONFLICT_CODE,
  WALLET_OWNERSHIP_CONFLICT_MESSAGE,
} from "@/lib/wallet-link-policy";
import { useAuthStore } from "@/stores/authStore";

// ─── OTP time-to-live ────────────────────────────────────────────────────────

/** OTP codes expire server-side after 15 minutes. */
export const OTP_TTL_MS = 15 * 60 * 1000;

/**
 * Check whether an OTP previously requested for the given email is still
 * valid (i.e. within the 15-minute expiry window).
 *
 * Safe to call outside React — reads from the persisted Zustand store.
 */
export function hasLiveOtp(email: string): boolean {
  const { pendingEmail, otpRequestedAt } = useAuthStore.getState();
  if (
    !pendingEmail ||
    !otpRequestedAt ||
    pendingEmail.toLowerCase() !== email.toLowerCase()
  ) {
    return false;
  }
  return Date.now() - otpRequestedAt < OTP_TTL_MS;
}

export interface AuthUser {
  id: string;
  email: string;
  kyc_status: "none" | "pending" | "verified" | "failed";
  limits?: UserLimits;
  wallets?: LinkedWallet[];
}

export interface UserLimits {
  daily_limit: number;
  monthly_limit: number;
  daily_used: number;
  monthly_used: number;
  kyc_tier: "none" | "basic" | "verified" | "corporate";
}

export interface LinkedWallet {
  wallet_id: number;
  address: string;
  wallet_type: string;
  chain: string;
  is_primary: boolean;
  label?: string;
  status: string;
  created_at: string;
}

export interface ConnectWalletResponse {
  status: string;
  message: string;
  data: LinkedWallet;
}

export interface GetWalletsResponse {
  status: string;
  message: string;
  data: LinkedWallet[];
}

export interface OTPRequestResponse {
  success: boolean;
  message: string;
}

export interface OTPVerifyResponse {
  user: AuthUser;
  privy_token?: string;
}

export interface KYCInitiateResponse {
  status: string;
  message: string;
  data: {
    url: string;
    expires_at: string;
    ref_id: string;
    reused: boolean;
  };
}

// ─── API calls ───────────────────────────────────────────────────────────────

export class AuthApiError extends Error {
  status: number;
  code?: string;
  shouldClearSession: boolean;

  constructor(
    message: string,
    options: {
      status: number;
      code?: string;
      shouldClearSession?: boolean;
    },
  ) {
    super(message);
    this.name = "AuthApiError";
    this.status = options.status;
    this.code = options.code;
    this.shouldClearSession = options.shouldClearSession ?? false;
  }
}

export {
  WALLET_OWNERSHIP_CONFLICT_CODE,
  WALLET_OWNERSHIP_CONFLICT_MESSAGE,
};

export const isWalletOwnershipConflictError = (error: unknown): boolean =>
  isWalletOwnershipConflictErrorFromPolicy(error);

const headers = { "Content-Type": "application/json" };

/**
 * Request an OTP to be sent to the given email address.
 *
 * **Idempotent:** If an OTP for this email was already requested within the
 * last 15 minutes (the server-side TTL), the API call is skipped and a
 * cached-style response is returned. This handles the mobile-browser case
 * where the browser restarts when the user switches to Gmail to read the code.
 */
export async function requestOTP(
  email: string,
  options?: { force?: boolean },
): Promise<OTPRequestResponse> {
  const force = options?.force ?? false;

  // ── Idempotency check ────────────────────────────────────────────────
  if (!force && hasLiveOtp(email)) {
    console.log("[auth] requestOTP — reusing live OTP for", email);
    return { success: true, message: "OTP already sent — check your email" };
  }

  // ── Fresh request ────────────────────────────────────────────────────
  console.log("[auth] requestOTP ->", { email });
  const res = await fetch("/api/auth/request-otp", {
    method: "POST",
    headers,
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[auth] requestOTP error:", res.status, err);
    throw new Error(err.message ?? "Failed to send OTP");
  }

  const data = await res.json();
  console.log("[auth] requestOTP response:", data);

  // Record the timestamp so subsequent calls (or browser restarts) can
  // skip the redundant request while the OTP is still valid.
  useAuthStore.getState().setOtpRequestedAt(Date.now());

  return data;
}

/**
 * Verify OTP and exchange for JWT tokens (stored as HTTP-only cookies).
 * Returns user data only — tokens never reach the client.
 */
export async function verifyOTP(
  email: string,
  verification_code: string,
): Promise<OTPVerifyResponse> {
  console.log("[auth] verifyOTP ->", { email, verification_code: "***" });
  const res = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers,
    body: JSON.stringify({ email, verification_code }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[auth] verifyOTP error:", res.status, err);
    throw new Error(err.message ?? "Invalid OTP");
  }

  const raw = await res.json();
  console.log("[auth] verifyOTP response received");

  // Backend may wrap in { data: { user, ... } }
  const data: OTPVerifyResponse = raw.data?.user ? raw.data : raw;

  if (!data.user) {
    console.error("[auth] verifyOTP — no user in response! Full payload:", JSON.stringify(raw));
    throw new Error("No user data received from server");
  }

  // privy_token may live at root or nested in data
  data.privy_token = raw.privy_token ?? raw.data?.privy_token ?? undefined;

  return data;
}

/**
 * Connect a wallet address to the authenticated user.
 * Auth token is sent via HTTP-only cookie automatically.
 * Enforces one-wallet-per-user.
 */
export async function connectWallet(
  address: string,
  chain: string = "evm",
): Promise<ConnectWalletResponse> {
  console.log("[auth] connectWallet ->", { address, chain });
  const res = await fetch("/api/auth/connect-wallet", {
    method: "POST",
    headers,
    body: JSON.stringify({ address, chain }),
  });
  const data = await res.json().catch(() => ({}));
  const backendReportedFailure =
    (typeof data?.success === "boolean" && data.success === false) ||
    data?.status === "error";

  if (!res.ok) {
   
    if (res.status === 409 || res.status === 403) {
      console.log("[auth] connectWallet ownership conflict:", res.status, data);
    }
      // If the error is a 409 (conflict) or 403 (forbidden), it's likely a wallet ownership conflict
      throw new AuthApiError(data.message || "Failed to connect wallet", {
        status: res.status,
        code: data.code,
        shouldClearSession: data.shouldClearSession ?? false,
      });
  }

  console.log("[auth] connectWallet response:", data);
  return data as ConnectWalletResponse;
}

/**
 * Get all wallets linked to the authenticated user.
 * Auth token is sent via HTTP-only cookie automatically.
 */
export async function getWallets(): Promise<GetWalletsResponse> {
  const res = await fetch("/api/auth/wallets");

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to fetch wallets");
  }

  return res.json();
}

/**
 * Refresh the current access token.
 * Refresh token is sent via HTTP-only cookie automatically.
 * Fires an auth-expired event on failure so the session guard can auto-logout.
 */
export async function refreshAccessToken(): Promise<{ success: boolean }> {
  const res = await fetch("/api/auth/refresh-token", {
    method: "POST",
    headers,
  });

  if (!res.ok) {
    // Import dynamically to avoid circular deps in SSR
    import("@/hooks/useSessionGuard").then(({ fireAuthExpired }) => {
      fireAuthExpired();
    }).catch(() => {});
    throw new Error("Token refresh failed");
  }

  return res.json();
}

/**
 * Logout — invalidate the current token server-side.
 * Auth token is sent via HTTP-only cookie automatically.
 */
export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    headers,
  }).catch(() => {
    /* best-effort — always clear local state regardless */
  });
}

/**
 * Initiate KYC session — returns a SmileID SmileLinks URL.
 * Auth token is sent via HTTP-only cookie automatically.
 */
export async function initiateKYC(): Promise<KYCInitiateResponse> {
  console.log("[auth] initiateKYC ->");
  const res = await fetch("/api/kyc/initiate", {
    method: "POST",
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to initiate KYC");
  }

  return res.json();
}

/**
 * Check KYC status after returning from SmileLinks.
 * Auth token is sent via HTTP-only cookie automatically.
 */
export async function checkKYCStatus(
  sessionId: string,
): Promise<{ kyc_status: AuthUser["kyc_status"] }> {
  console.log("[auth] checkKYCStatus ->", { sessionId });
  const res = await fetch(`/api/kyc/status?session_id=${sessionId}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[auth] checkKYCStatus error:", res.status, err);
    throw new Error("Failed to check KYC status");
  }

  const data = await res.json();
  console.log("[auth] checkKYCStatus response:", data);
  return data;
}

// ─── Privy token bridge ──────────────────────────────────────────────────────

/**
 * Fetch the user's access token from the HTTP-only cookie via our API route.
 * Used to pass the token to Privy's `loginWithCustomAccessToken`.
 */
export async function getPrivyToken(): Promise<{ token: string }> {
  const res = await fetch("/api/auth/privy-token", {
    method: "POST",
    headers,
  });

  if (!res.ok) {
    throw new Error("No active session — cannot fetch Privy token");
  }

  return res.json();
}
