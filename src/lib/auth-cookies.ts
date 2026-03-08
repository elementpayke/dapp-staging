/**
 * Server-side auth cookie helpers.
 * Tokens are stored in HTTP-only cookies — never exposed to client JS.
 *
 * Usage in API route handlers:
 *   import { getTokenFromCookies, setAuthCookies, clearAuthCookies } from "@/lib/auth-cookies";
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// ─── Cookie names ────────────────────────────────────────────────────────────

export const ACCESS_TOKEN_COOKIE = "ep_access_token";
export const REFRESH_TOKEN_COOKIE = "ep_refresh_token";

// ─── Cookie options ──────────────────────────────────────────────────────────

/**
 * Secure cookies require HTTPS. In production NODE_ENV this defaults to true,
 * but can be overridden with the COOKIE_SECURE env var for HTTP staging
 * environments (e.g. Docker on localhost without TLS).
 *
 *   COOKIE_SECURE=false  → cookies work over plain HTTP
 *   COOKIE_SECURE=true   → force Secure flag even in development
 *   (unset)              → follows NODE_ENV (production = secure)
 */
const isSecure =
  process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === "true"
    : process.env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  secure: isSecure,
  sameSite: "lax" as const,
  path: "/",
};

/** Access token expires in 24 hours (matches typical JWT TTL). */
const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24; // 24h

/** Refresh token lives longer — 30 days. */
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30d

// ─── Read ────────────────────────────────────────────────────────────────────

/**
 * Read the access token from the incoming request cookies.
 * Call this inside API route handlers (server-side only).
 */
export async function getTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
}

/**
 * Read the refresh token from the incoming request cookies.
 */
export async function getRefreshTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
}

// ─── Write ───────────────────────────────────────────────────────────────────

/**
 * Set auth cookies on a NextResponse instance.
 * Use this after verify-otp or refresh-token to persist tokens.
 */
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken?: string,
): NextResponse {
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseCookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  if (refreshToken) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...baseCookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }

  return response;
}

// ─── Clear ───────────────────────────────────────────────────────────────────

/**
 * Clear all auth cookies on a NextResponse instance.
 * Use this during logout.
 */
export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    ...baseCookieOptions,
    maxAge: 0,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    ...baseCookieOptions,
    maxAge: 0,
  });
  return response;
}
