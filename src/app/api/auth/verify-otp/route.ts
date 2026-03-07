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

    // Build a response that contains ONLY the user profile — no tokens
    const safePayload = {
      ...data,
      ...(data.data?.access_token
        ? { data: { ...data.data, access_token: undefined, refresh_token: undefined } }
        : { access_token: undefined, refresh_token: undefined }),
      user: payload.user,
    };

    const response = NextResponse.json(safePayload);
    setAuthCookies(response, accessToken, refreshToken);
    return response;
  } catch (error: any) {
    console.error("[verify-otp] Error:", error);
    return createBackendErrorResponse(error);
  }
}
