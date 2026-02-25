import { NextRequest, NextResponse } from "next/server";
import { createBackendErrorResponse, fetchBackend } from "@/lib/backend-fetch";

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

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[verify-otp] Error:", error);
    return createBackendErrorResponse(error);
  }
}
