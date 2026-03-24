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

    return await authenticatedFetch("/orders/create", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (error: any) {
    console.error("[orders/create] Error:", error);
    return createBackendErrorResponse(error, "Failed to create order");
  }
}
