import { NextRequest, NextResponse } from "next/server";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import { createBackendErrorResponse } from "@/lib/backend-fetch";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tx_hash: string }> },
) {
  try {
    const { tx_hash } = await params;

    if (!tx_hash) {
      return NextResponse.json(
        { error: "tx_hash is required" },
        { status: 400 },
      );
    }

    return await authenticatedFetch(
      `/orders/tx/${encodeURIComponent(tx_hash)}`,
    );
  } catch (error: any) {
    console.error("[orders/tx] Error:", error);
    return createBackendErrorResponse(error, "Failed to fetch transaction");
  }
}
