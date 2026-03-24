import { NextRequest, NextResponse } from "next/server";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import { createBackendErrorResponse } from "@/lib/backend-fetch";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 },
      );
    }

    return await authenticatedFetch(
      `/orders/${encodeURIComponent(orderId)}`,
    );
  } catch (error: any) {
    console.error("[orders/get] Error:", error);
    return createBackendErrorResponse(error, "Failed to get order status");
  }
}
