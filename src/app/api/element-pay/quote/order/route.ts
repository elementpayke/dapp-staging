import { NextRequest, NextResponse } from "next/server";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import { createBackendErrorResponse } from "@/lib/backend-fetch";

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid or empty request body" },
        { status: 400 },
      );
    }

    return await authenticatedFetch("/quote/order", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (error: any) {
    console.error("[quote/order] Error:", error);
    return createBackendErrorResponse(error, "Failed to fetch order quote");
  }
}
