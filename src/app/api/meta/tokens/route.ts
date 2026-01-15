import { NextRequest, NextResponse } from "next/server";

const AGGREGATOR_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.NEXT_PRIVATE_AGGR_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const env = searchParams.get("env") || "live";
    const symbol = searchParams.get("symbol") || "USDC";

    // Make request to aggregator API
    const response = await fetch(
      `${AGGREGATOR_URL}/meta/tokens?env=${env}&symbol=${symbol}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY || "",
        },
      }
    );

    if (!response.ok) {
      console.error(
        "Aggregator API error:",
        response.status,
        response.statusText
      );
      return NextResponse.json(
        { error: "Failed to fetch rates from aggregator" },
        { status: response.status }
      );
    }
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching rates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
