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
  access_token: string;
  refresh_token?: string;
  user: AuthUser;
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
 */
export async function requestOTP(email: string): Promise<OTPRequestResponse> {
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
  return data;
}

/**
 * Verify OTP and exchange for JWT tokens.
 * Returns access_token, refresh_token, and user data.
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
  console.log("[auth] verifyOTP raw response:", JSON.stringify(raw, null, 2));

  // Backend may wrap in { status, message, data: { access_token, ... } }
  const data: OTPVerifyResponse = raw.data?.access_token ? raw.data : raw;

  console.log("[auth] verifyOTP normalised:", {
    access_token: data.access_token ? data.access_token.slice(0, 20) + "..." : "MISSING",
    refresh_token: data.refresh_token ? "present" : "missing",
    user: data.user ? { email: data.user.email, kyc_status: data.user.kyc_status } : "MISSING",
  });

  if (!data.access_token) {
    console.error("[auth] verifyOTP — no access_token in response! Full payload:", JSON.stringify(raw));
    throw new Error("No access token received from server");
  }

  return data;
}

/**
 * Connect a wallet address to the authenticated user.
 * Requires JWT auth. Enforces one-wallet-per-user.
 */
export async function connectWallet(
  token: string,
  address: string,
  chain: string = "evm",
): Promise<ConnectWalletResponse> {
  console.log("[auth] connectWallet ->", { address, chain });
  const res = await fetch("/api/auth/connect-wallet", {
    method: "POST",
    headers: { ...headers, Authorization: `Bearer ${token}` },
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
 */
export async function getWallets(
  token: string,
): Promise<GetWalletsResponse> {
  const res = await fetch("/api/auth/wallets", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to fetch wallets");
  }

  return res.json();
}

/**
 * Refresh the current access token.
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<{ access_token: string }> {
  const res = await fetch("/api/auth/refresh-token", {
    method: "POST",
    headers,
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    throw new Error("Token refresh failed");
  }

  return res.json();
}

/**
 * Logout — invalidate the current token server-side.
 */
export async function logout(token: string): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    headers: { ...headers, Authorization: `Bearer ${token}` },
  }).catch(() => {
    /* best-effort — always clear local state regardless */
  });
}

/**
 * Initiate KYC session — returns a SmileID SmileLinks URL.
 */
export async function initiateKYC(
  token: string,
): Promise<KYCInitiateResponse> {
  console.log("[auth] initiateKYC -> token:", token ? token.slice(0, 20) + "..." : "MISSING!");
  const res = await fetch("/api/kyc/initiate", {
    method: "POST",
    headers: { ...headers, Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to initiate KYC");
  }

  return res.json();
}

/**
 * Check KYC status after returning from SmileLinks.
 */
export async function checkKYCStatus(
  token: string,
  sessionId: string,
): Promise<{ kyc_status: AuthUser["kyc_status"] }> {
  console.log("[auth] checkKYCStatus ->", { sessionId });
  const res = await fetch(`/api/kyc/status?session_id=${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[auth] checkKYCStatus error:", res.status, err);
    throw new Error("Failed to check KYC status");
  }

  const data = await res.json();
  console.log("[auth] checkKYCStatus response:", data);
  return data;
}
