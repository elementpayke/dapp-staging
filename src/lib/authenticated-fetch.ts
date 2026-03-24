/**
 * Authenticated fetch utility for server-side API route handlers.
 *
 * Wraps fetchBackend with:
 *  1. Bearer token from HTTP-only cookie
 *  2. Automatic token refresh on 401
 *  3. Cookie update on the response when tokens are refreshed
 *  4. auth_expired flag when both access + refresh tokens are invalid
 *     (signals the client to force logout)
 *
 * Usage in API route handlers:
 *
 *   import { authenticatedFetch } from "@/lib/authenticated-fetch";
 *
 *   export async function POST(request: NextRequest) {
 *     const body = await request.json();
 *     return authenticatedFetch("/orders/create", {
 *       method: "POST",
 *       body: JSON.stringify(body),
 *     });
 *   }
 */

import { NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend-fetch";
import {
  getTokenFromCookies,
  getRefreshTokenFromCookies,
  setAuthCookies,
  clearAuthCookies,
} from "@/lib/auth-cookies";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    if (!refreshToken) {
      console.warn("[authenticated-fetch] No refresh token cookie — cannot refresh.");
      return null;
    }

    const res = await fetchBackend("/auth/refresh-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      console.warn("[authenticated-fetch] Token refresh failed:", res.status);
      return null;
    }

    const data = await res.json().catch(() => ({}));
    const newAccessToken: string | undefined =
      data.access_token ?? data.data?.access_token;
    const newRefreshToken: string | undefined =
      data.refresh_token ?? data.data?.refresh_token;

    if (!newAccessToken) {
      console.warn("[authenticated-fetch] Refresh response missing access_token.");
      return null;
    }

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (err) {
    console.error("[authenticated-fetch] Token refresh threw:", err);
    return null;
  }
}

/**
 * Parse a backend response body as JSON, falling back to a text error.
 */
async function parseResponse(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  const text = await res.text();
  return { error: text || res.statusText };
}

/**
 * Build headers for a backend request with Bearer token auth.
 */
function buildHeaders(
  token: string,
  extraHeaders?: Record<string, string>,
): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...extraHeaders,
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

/**
 * Options for authenticatedFetch. Same as RequestInit but with optional
 * extra configuration.
 */
export interface AuthenticatedFetchOptions extends Omit<RequestInit, "headers"> {
  /** Extra headers to include in addition to Content-Type and Authorization. */
  headers?: Record<string, string>;
}

/**
 * Makes an authenticated request to the backend and returns a NextResponse.
 *
 * Flow:
 *  1. Read access token from HTTP-only cookie
 *  2. If no token → try refresh → if refresh fails → return 401 + auth_expired
 *  3. Make request with Bearer token
 *  4. If 401 → try refresh → retry request once
 *  5. If retry 401 or refresh fails → return 401 + auth_expired + clear cookies
 *  6. If tokens were refreshed, set new cookies on the response
 */
export async function authenticatedFetch(
  path: string,
  options: AuthenticatedFetchOptions = {},
): Promise<NextResponse> {
  const { headers: extraHeaders, ...fetchOptions } = options;

  // ── 1. Read access token ────────────────────────────────────────────────
  let token = await getTokenFromCookies();
  let refreshedTokens: { accessToken: string; refreshToken?: string } | null =
    null;

  // ── 2. No access token → try refresh first ─────────────────────────────
  if (!token) {
    console.warn("[authenticated-fetch] No access token — attempting refresh.");
    refreshedTokens = await tryRefreshToken();
    token = refreshedTokens?.accessToken;
  }

  if (!token) {
    console.error("[authenticated-fetch] No valid token after refresh attempt.");
    const errResponse = NextResponse.json(
      {
        error: "Authentication required. Please log in again.",
        auth_expired: true,
      },
      { status: 401 },
    );
    clearAuthCookies(errResponse);
    return errResponse;
  }

  // ── 3. Make the request ─────────────────────────────────────────────────
  let res = await fetchBackend(path, {
    ...fetchOptions,
    headers: buildHeaders(token, extraHeaders),
  });

  // ── 4. If 401 and haven't refreshed yet → refresh + retry once ─────────
  if (res.status === 401 && !refreshedTokens) {
    console.warn("[authenticated-fetch] Backend returned 401 — refreshing token.");
    refreshedTokens = await tryRefreshToken();

    if (refreshedTokens?.accessToken) {
      token = refreshedTokens.accessToken;
      res = await fetchBackend(path, {
        ...fetchOptions,
        headers: buildHeaders(token, extraHeaders),
      });
    } else {
      // Refresh failed — force client logout
      console.warn("[authenticated-fetch] Token refresh failed — auth expired.");
      const errResponse = NextResponse.json(
        {
          error: "Session expired. Please log in again.",
          auth_expired: true,
        },
        { status: 401 },
      );
      clearAuthCookies(errResponse);
      return errResponse;
    }
  }

  // ── 5. If still 401 after refresh + retry → auth expired ───────────────
  if (res.status === 401) {
    console.warn("[authenticated-fetch] Still 401 after refresh — auth expired.");
    const errResponse = NextResponse.json(
      {
        error: "Session expired. Please log in again.",
        auth_expired: true,
      },
      { status: 401 },
    );
    clearAuthCookies(errResponse);
    return errResponse;
  }

  // ── 6. Build client response ────────────────────────────────────────────
  const data = await parseResponse(res);
  const response = NextResponse.json(data, { status: res.status });

  // Persist refreshed tokens so subsequent requests use them
  if (refreshedTokens?.accessToken) {
    setAuthCookies(
      response,
      refreshedTokens.accessToken,
      refreshedTokens.refreshToken,
    );
  }

  return response;
}
