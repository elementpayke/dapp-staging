import { NextRequest, NextResponse } from "next/server";
import { createBackendErrorResponse, fetchBackend } from "@/lib/backend-fetch";
import { getTokenFromCookies } from "@/lib/auth-cookies";

export async function POST(req: NextRequest) {
  try {
    const token = await getTokenFromCookies();

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    const res = await fetchBackend("/kyc/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: data.message ?? "Failed to initiate KYC" },
        { status: res.status },
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[kyc/initiate] Error:", error);
    return createBackendErrorResponse(error);
  }
}
