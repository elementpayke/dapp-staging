import { NextRequest, NextResponse } from "next/server";

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

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const apiKey = process.env.NEXT_PRIVATE_AGGR_API_KEY;

    if (!apiUrl || !apiKey) {
      console.error("Missing API configuration (apiUrl or apiKey).");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    // Make the request to Element Pay API from server with API key
    const response = await fetch(
      `${apiUrl}/orders/tx/${encodeURIComponent(tx_hash)}`,
      {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    // Return the data to the client
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching transaction by hash:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction" },
      { status: 500 },
    );
  }
}
