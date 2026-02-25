import { NextRequest, NextResponse } from "next/server";

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

    // Forward the client's Authorization header to the backend
    const authHeader = request.headers.get("authorization");
    const headers: Record<string, string> = {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    // Make the request to Element Pay API from server
    const response = await fetch(`${apiUrl}/orders/tx/${txHash}`, {
      headers,
    });

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
    console.error("Error fetching order status:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch order status" },
      { status: 500 }
    );
  }
}
