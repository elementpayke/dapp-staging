import { NextRequest, NextResponse } from "next/server";
import { getTokenFromCookies } from "@/lib/auth-cookies";

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

    // Read token from HTTP-only cookie
    const token = await getTokenFromCookies();
    const headers: Record<string, string> = {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Make the request to Element Pay API from server with API key
    const response = await fetch(
      `${apiUrl}/orders/tx/${encodeURIComponent(tx_hash)}`,
      { headers },
    );

    let data: unknown;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { error: text || response.statusText };
    }

    // Return the data to the client
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Error fetching transaction by hash:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch transaction" },
      { status: 500 },
    );
  }
}
