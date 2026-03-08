import { NextRequest, NextResponse } from "next/server";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import { createBackendErrorResponse } from "@/lib/backend-fetch";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const txHash = searchParams.get("txHash");

    if (!txHash) {
      return NextResponse.json(
        { error: "Transaction hash is required" },
        { status: 400 },
      );
    }

    return await authenticatedFetch(
      `/orders/tx/${encodeURIComponent(txHash)}`,
    );
  } catch (error: any) {
    console.error("[orders/status] Error:", error);
    return createBackendErrorResponse(error, "Failed to fetch order status");
  }
}
