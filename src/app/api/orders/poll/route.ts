import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy route for polling order status by transaction hash
 * This redirects to the actual Element Pay orders status endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const txHash = searchParams.get("txHash");

    if (!txHash) {
      return NextResponse.json(
        { error: "Transaction hash is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PRIVATE_AGGR_API_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiKey || !apiUrl) {
      console.error("Missing required API configuration");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Make the request to Element Pay API from server
    const response = await fetch(`${apiUrl}/orders/tx/${txHash}`, {
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    // Return 202 for pending/processing status to indicate still in progress
    if (data?.data?.status?.toLowerCase() === "pending" || 
        data?.data?.status?.toLowerCase() === "processing") {
      return NextResponse.json(data, { status: 202 });
    }

    // Return the data to the client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error polling order status:", error);
    return NextResponse.json(
      { error: "Failed to poll order status" },
      { status: 500 }
    );
  }
}
