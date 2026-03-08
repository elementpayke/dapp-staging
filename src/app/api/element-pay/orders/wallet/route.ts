import { NextRequest, NextResponse } from "next/server";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import { createBackendErrorResponse } from "@/lib/backend-fetch";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("wallet_address");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "wallet_address is required" },
        { status: 400 },
      );
    }

    return await authenticatedFetch(
      `/orders/wallet?wallet_address=${encodeURIComponent(walletAddress)}`,
    );
  } catch (error: any) {
    console.error("[orders/wallet] Error:", error);
    return createBackendErrorResponse(error, "Failed to fetch transactions");
  }
}
