/**
 * Proxies the HS256 session token to the backend's dedicated RS256
 * Privy token endpoint.
 *
 * Flow:
 *  1. Read the HS256 access token from the HTTP-only cookie.
 *  2. Call POST /auth/privy/token with Bearer auth.
 *  3. Return the RS256 JWT that Privy can verify via JWKS.
 *
 * The backend responds with: { token: string, token_type: "bearer" }
 */

import { NextResponse } from "next/server";
import { getTokenFromCookies, getRefreshTokenFromCookies, setAuthCookies } from "@/lib/auth-cookies";
import { fetchBackend, createBackendErrorResponse } from "@/lib/backend-fetch";

/**
 * Attempt a server-side token refresh using the refresh-token cookie.
 * Returns the new tokens on success, or null on failure.
 */
async function tryRefreshToken(): Promise<{
  accessToken: string;
  refreshToken?: string;
} | null> {
  try {
    const refreshToken = await getRefreshTokenFromCookies();
    if (!refreshToken) return null;

    const res = await fetchBackend("/auth/refresh-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json().catch(() => ({}));
    const newAccessToken: string | undefined =
      data.access_token ?? data.data?.access_token;
    const newRefreshToken: string | undefined =
      data.refresh_token ?? data.data?.refresh_token;

    if (!newAccessToken) return null;

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch {
    return null;
  }
}

export async function POST() {
  let accessToken = await getTokenFromCookies();
  let refreshedTokens: { accessToken: string; refreshToken?: string } | null = null;

  // If access token is missing or expired, try refreshing first
  if (!accessToken) {
    console.log("[privy-token] No access token — attempting refresh.");
    refreshedTokens = await tryRefreshToken();
    accessToken = refreshedTokens?.accessToken ?? null;
  }

  if (!accessToken) {
    return NextResponse.json(
      { error: "No active session" },
      { status: 401 },
    );
  }

  try {
    let res = await fetchBackend("/auth/privy/token", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    // If backend returns 401 and we haven't refreshed yet, try refresh + retry
    if (res.status === 401 && !refreshedTokens) {
      console.log("[privy-token] Backend returned 401 — attempting refresh and retry.");
      refreshedTokens = await tryRefreshToken();
      if (refreshedTokens?.accessToken) {
        accessToken = refreshedTokens.accessToken;
        res = await fetchBackend("/auth/privy/token", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
      }
    }

    if (!res.ok) {
      const body = await res.text();
      console.error("[privy-token] Backend error:", res.status, body);
      return NextResponse.json(
        { error: "Failed to obtain Privy token" },
        { status: res.status },
      );
    }

    const data = await res.json();

    // ── Diagnostic logging ────────────────────────────────────────────
    if (data.token) {
      try {
        const parts = data.token.split(".");
        const header = JSON.parse(Buffer.from(parts[0], "base64url").toString());
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
        console.log("[privy-token] Token diagnostics:", {
          alg: header.alg,
          typ: header.typ,
          kid: header.kid,
          iss: payload.iss,
          sub: payload.sub,
          aud: payload.aud,
          exp: payload.exp,
          iat: payload.iat,
          tokenLength: data.token.length,
          isRS256: header.alg === "RS256",
        });
        if (header.alg !== "RS256") {
          console.error(
            `[privy-token] ⚠️ Backend returned ${header.alg} token instead of RS256! ` +
            `Privy will reject this.`
          );
        }
      } catch {
        console.warn("[privy-token] Could not decode token for diagnostics");
      }
    } else {
      console.warn("[privy-token] Backend response has no token field. Keys:", Object.keys(data));
    }

    // Persist refreshed cookies if tokens were refreshed during this request
    const response = NextResponse.json({ token: data.token });
    if (refreshedTokens) {
      setAuthCookies(response, refreshedTokens.accessToken, refreshedTokens.refreshToken);
    }
    return response;
  } catch (error) {
    console.error("[privy-token] Proxy error:", error);
    return createBackendErrorResponse(error, "Failed to obtain Privy token");
  }
}
