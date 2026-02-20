/**
 * Authentication service — handles OTP request/verify, token refresh, logout.
 * All calls proxy through Next.js API routes to keep the backend URL server-side.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

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
  session_id: string;
  smile_link_url: string;
}

// ─── API calls ───────────────────────────────────────────────────────────────

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

  const data = await res.json();
  console.log("[auth] verifyOTP response:", { ...data, access_token: data.access_token?.slice(0, 20) + "..." });
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

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[auth] connectWallet error:", res.status, err);
    throw new Error(err.message ?? "Failed to connect wallet");
  }

  const data = await res.json();
  console.log("[auth] connectWallet response:", data);
  return data;
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
