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

    const res = await fetchBackend("/auth/wallets", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: data.message ?? "Failed to fetch wallets" },
        { status: res.status },
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[wallets] Error:", error);
    return createBackendErrorResponse(error);
  }
}
