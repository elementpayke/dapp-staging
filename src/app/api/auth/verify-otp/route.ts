import { NextRequest, NextResponse } from "next/server";
import { createBackendErrorResponse, fetchBackend } from "@/lib/backend-fetch";
import { setAuthCookies } from "@/lib/auth-cookies";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetchBackend("/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: data.message ?? "Invalid OTP" },
        { status: res.status },
      );
    }

    // Extract tokens — backend may wrap in { data: { access_token, ... } }
    // Check multiple possible response shapes
    const payload = data.data?.access_token ? data.data : data;
    const accessToken: string | undefined =
      payload.access_token ?? data.data?.access_token ?? data.access_token;
    const refreshToken: string | undefined =
      payload.refresh_token ?? data.data?.refresh_token ?? data.refresh_token;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "No access token received from backend" },
        { status: 502 },
      );
    }

    if (!refreshToken) {
      console.warn(
        "[verify-otp] Backend did not return a refresh_token. Session refresh will not work.",
        "Response keys:", Object.keys(data),
        "Nested keys:", data.data ? Object.keys(data.data) : "N/A",
      );
    }

    // ── Chain the Privy RS256 token request ────────────────────────────
    // Use the just-obtained accessToken (not cookies — they aren't on the
    // incoming request yet) to also fetch the RS256 JWT that Privy needs.
    let privyToken: string | null = null;
    try {
      const privyRes = await fetchBackend("/auth/privy/token", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (privyRes.ok) {
        const privyData = await privyRes.json();
        privyToken = privyData.token ?? null;

        // ── Diagnostic logging ──────────────────────────────────────
        if (privyToken) {
          try {
            const parts = privyToken.split(".");
            const header = JSON.parse(Buffer.from(parts[0], "base64url").toString());
            const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
            console.log("[verify-otp] Privy RS256 token diagnostics:", {
              alg: header.alg,
              typ: header.typ,
              kid: header.kid,
              iss: payload.iss,
              sub: payload.sub,
              aud: payload.aud,
              exp: payload.exp,
              iat: payload.iat,
              tokenLength: privyToken.length,
              isRS256: header.alg === "RS256",
            });
            if (header.alg !== "RS256") {
              console.error(
                `[verify-otp] ⚠️ Backend returned ${header.alg} token, NOT RS256! ` +
                `Privy will reject this. The /auth/privy/token endpoint needs to return RS256.`
              );
            }
          } catch (decodeErr) {
            console.warn("[verify-otp] Could not decode privy token for diagnostics", decodeErr);
          }
        }
      } else {
        const errBody = await privyRes.text().catch(() => "");
        console.warn(
          "[verify-otp] Privy token request failed (non-blocking):",
          privyRes.status,
          errBody,
        );
      }
    } catch (privyErr) {
      console.warn("[verify-otp] Privy token fetch error (non-blocking):", privyErr);
    }

    // Build a response that contains ONLY the user profile — no tokens
    const safePayload = {
      ...data,
      ...(data.data?.access_token
        ? { data: { ...data.data, access_token: undefined, refresh_token: undefined } }
        : { access_token: undefined, refresh_token: undefined }),
      user: payload.user,
      privy_token: privyToken,
    };

    const response = NextResponse.json(safePayload);
    setAuthCookies(response, accessToken, refreshToken);
    return response;
  } catch (error: any) {
    console.error("[verify-otp] Error:", error);
    return createBackendErrorResponse(error);
  }
}
