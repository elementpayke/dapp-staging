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
import { getTokenFromCookies } from "@/lib/auth-cookies";
import { fetchBackend, createBackendErrorResponse } from "@/lib/backend-fetch";

export async function POST() {
  const accessToken = await getTokenFromCookies();

  if (!accessToken) {
    return NextResponse.json(
      { error: "No active session" },
      { status: 401 },
    );
  }

  try {
    const res = await fetchBackend("/auth/privy/token", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

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

    return NextResponse.json({ token: data.token });
  } catch (error) {
    console.error("[privy-token] Proxy error:", error);
    return createBackendErrorResponse(error, "Failed to obtain Privy token");
  }
}
