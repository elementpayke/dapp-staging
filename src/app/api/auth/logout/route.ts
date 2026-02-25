import { NextRequest, NextResponse } from "next/server";
import { createBackendErrorResponse, fetchBackend } from "@/lib/backend-fetch";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    const res = await fetchBackend("/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Bearer: token,
      },
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("[logout] Error:", error);
    return createBackendErrorResponse(error);
  }
}
