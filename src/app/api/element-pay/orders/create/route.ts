import { NextRequest, NextResponse } from "next/server";
import {
  getTokenFromCookies,
  getRefreshTokenFromCookies,
  setAuthCookies,
} from "@/lib/auth-cookies";

/**
 * Attempt a server-side token refresh using the refresh-token cookie.
 * Returns the new access token on success, or undefined on failure.
 */
async function tryRefreshToken(): Promise<{
  accessToken?: string;
  refreshToken?: string;
} | null> {
  try {
    const refreshToken = await getRefreshTokenFromCookies();
    if (!refreshToken) {
      console.warn("[orders/create] No refresh token cookie — cannot refresh.");
      return null;
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!backendUrl) return null;

    const res = await fetch(`${backendUrl}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      console.warn("[orders/create] Token refresh failed:", res.status);
      return null;
    }

    const data = await res.json().catch(() => ({}));
    const newAccessToken: string | undefined =
      data.access_token ?? data.data?.access_token;
    const newRefreshToken: string | undefined =
      data.refresh_token ?? data.data?.refresh_token;

    if (!newAccessToken) {
      console.warn("[orders/create] Refresh response missing access_token.");
      return null;
    }

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (err) {
    console.error("[orders/create] Token refresh threw:", err);
    return null;
  }
}

/**
 * Forward the order-create request to the backend with the given token.
 */
async function forwardCreateOrder(
  apiUrl: string,
  body: unknown,
  token?: string,
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(`${apiUrl}/orders/create`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

/**
 * Parse the backend response into a JSON-safe value.
 */
async function parseBackendResponse(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  const text = await res.text();
  return { error: text || res.statusText };
}

export async function POST(request: NextRequest) {
  try {
    // Parse body — guard against empty / malformed JSON
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid or empty request body" },
        { status: 400 },
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const apiKey = process.env.NEXT_PRIVATE_AGGR_API_KEY;
    if (!apiUrl || !apiKey) {
      console.error("Missing API configuration (apiUrl or apiKey).");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    // ── 1. Read access token from HTTP-only cookie ──────────────────────
    let token = await getTokenFromCookies();

    // ── 2. If no access token, try refreshing before the first call ─────
    let refreshedTokens: { accessToken?: string; refreshToken?: string } | null =
      null;

    if (!token) {
      console.warn("[orders/create] No access token cookie — attempting refresh.");
      refreshedTokens = await tryRefreshToken();
      token = refreshedTokens?.accessToken;
    }

    if (!token) {
      console.error("[orders/create] No valid token after refresh attempt.");
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 },
      );
    }

    // ── 3. Forward request to backend ───────────────────────────────────
    let res = await forwardCreateOrder(apiUrl, body, token);

    // ── 4. If 401, try one refresh + retry ──────────────────────────────
    if (res.status === 401 && !refreshedTokens) {
      console.warn("[orders/create] Backend returned 401 — attempting token refresh + retry.");
      refreshedTokens = await tryRefreshToken();
      if (refreshedTokens?.accessToken) {
        token = refreshedTokens.accessToken;
        res = await forwardCreateOrder(apiUrl, body, token);
      }
    }

    // ── 5. Build client response ────────────────────────────────────────
    const data = await parseBackendResponse(res);
    const response = NextResponse.json(data, { status: res.status });

    // Persist refreshed tokens as cookies so subsequent requests use them
    if (refreshedTokens?.accessToken) {
      setAuthCookies(
        response,
        refreshedTokens.accessToken,
        refreshedTokens.refreshToken,
      );
    }

    return response;
  } catch (error: any) {
    console.error("Error proxying orders/create:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create order" },
      { status: 500 },
    );
  }
}
