import { NextRequest, NextResponse } from "next/server";
import { createBackendErrorResponse, fetchBackend } from "@/lib/backend-fetch";
import { getTokenFromCookies } from "@/lib/auth-cookies";

export async function GET(req: NextRequest) {
  try {
    const token = await getTokenFromCookies();

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    const sessionId = req.nextUrl.searchParams.get("session_id");

    const res = await fetchBackend(`/kyc/status?session_id=${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: data.message ?? "KYC status check failed" },
        { status: res.status },
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[kyc/status] Error:", error);
    return createBackendErrorResponse(error);
  }
}
