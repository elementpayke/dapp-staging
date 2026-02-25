import { NextRequest, NextResponse } from "next/server";
import { createBackendErrorResponse, fetchBackend } from "@/lib/backend-fetch";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    // Extract the raw token from "Bearer <token>"
    const token = authHeader.replace(/^Bearer\s+/i, "");

    //logging token
    console.log("[kyc/initiate] Received token:", token);

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
