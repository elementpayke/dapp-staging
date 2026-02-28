import { NextRequest, NextResponse } from "next/server";
import { createBackendErrorResponse, fetchBackend } from "@/lib/backend-fetch";
import { getTokenFromCookies, clearAuthCookies } from "@/lib/auth-cookies";

export async function POST(req: NextRequest) {
  try {
    const token = await getTokenFromCookies();

    // Best-effort backend logout — still clear cookies even if it fails
    if (token) {
      await fetchBackend("/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    }

    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);
    return response;
  } catch (error: any) {
    console.error("[logout] Error:", error);
    // Still clear cookies on error
    const errResponse = createBackendErrorResponse(error);
    clearAuthCookies(errResponse as NextResponse);
    return errResponse;
  }
}
