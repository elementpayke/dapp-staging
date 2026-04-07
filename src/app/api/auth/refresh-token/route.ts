import { NextRequest, NextResponse } from "next/server";
import { createBackendErrorResponse, fetchBackend } from "@/lib/backend-fetch";
import {
  getRefreshTokenFromCookies,
  setAuthCookies,
  clearAuthCookies,
} from "@/lib/auth-cookies";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = await getRefreshTokenFromCookies();
    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: "No refresh token" },
        { status: 401 },
      );
    }

    const res = await fetchBackend("/auth/refresh-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errResponse = NextResponse.json(
        { success: false, message: "Token refresh failed" },
        { status: res.status },
      );

      // Only clear cookies on 401 (genuine auth rejection).
      // Other errors (404, 500) indicate server issues, not invalid tokens —
      // clearing cookies on those would nuke a valid session.
      if (res.status === 401) {
        clearAuthCookies(errResponse);
      }

      return errResponse;
    }

    const newAccessToken: string | undefined = data.access_token ?? data.data?.access_token;
    const newRefreshToken: string | undefined = data.refresh_token ?? data.data?.refresh_token;

    if (!newAccessToken) {
      return NextResponse.json(
        { success: false, message: "No access token in refresh response" },
        { status: 502 },
      );
    }

    const response = NextResponse.json({ success: true });
    setAuthCookies(response, newAccessToken, newRefreshToken);
    return response;
  } catch (error: any) {
    console.error("[refresh-token] Error:", error);
    return createBackendErrorResponse(error);
  }
}
