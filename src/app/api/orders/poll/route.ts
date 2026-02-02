import { NextRequest, NextResponse } from "next/server";

interface OrderData {
  order_id: string;
  status: string;
  failure_reason?: string;
  amount_fiat: number;
  wallet_address: string;
  phone_number: string;
  transaction_hashes?: {
    settlement?: string;
    creation?: string;
  };
}

interface PollResponse {
  status: "success" | "error" | "pending";
  data?: OrderData;
  message?: string;
}

/**
 * Server-side route to poll order status by transaction hash
 * Uses secure API key stored in environment variables
 *
 * GET /api/orders/poll?txHash=<hash>
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<PollResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const txHash = searchParams.get("txHash");

    if (!txHash) {
      return NextResponse.json(
        { status: "error", message: "Transaction hash is required" },
        { status: 400 }
      );
    }

    // Normalize the hash
    const normalizedHash = txHash.startsWith("0x") ? txHash.slice(2) : txHash;

    // Use server-side environment variables (without NEXT_PUBLIC prefix)
    const AGGREGATOR_URL =
      process.env.AGGREGATOR_URL || process.env.NEXT_PUBLIC_API_URL;
    const API_KEY =
      process.env.AGGR_API_KEY || process.env.NEXT_PUBLIC_AGGR_API_KEY;

    if (!AGGREGATOR_URL) {
      console.error("AGGREGATOR_URL is not configured");
      return NextResponse.json(
        { status: "error", message: "Server configuration error" },
        { status: 500 }
      );
    }

    if (!API_KEY) {
      console.error("AGGR_API_KEY is not configured");
      return NextResponse.json(
        { status: "error", message: "Server configuration error" },
        { status: 500 }
      );
    }

    // Make the request to the aggregator service on the server side
    const response = await fetch(
      `${AGGREGATOR_URL}/orders/tx/${normalizedHash}`,
      {
        method: "GET",
        headers: {
          "x-api-key": API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      const responseData = await response.json();
      const orderData: OrderData = responseData?.data;

      if (!orderData) {
        return NextResponse.json(
          { status: "error", message: "Invalid response from aggregator" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        status: "success",
        data: orderData,
      });
    } else if (response.status === 404) {
      return NextResponse.json(
        { status: "pending", message: "Order not found yet, still processing" },
        { status: 202 }
      );
    } else {
      const errorData = await response.text();
      console.error(`Aggregator API error (${response.status}):`, errorData);
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to fetch order status from aggregator",
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Error polling order status:", error);
    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
