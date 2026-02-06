import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Accept both naming conventions for flexibility
    const currency = searchParams.get("currency") || searchParams.get("token");
    const orderType = searchParams.get("q") || searchParams.get("action");

    if (!currency) {
      return NextResponse.json(
        { error: "Missing required parameter: currency or token" },
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

    // Build the URL with proper query params for the external API
    const externalUrl = `${apiUrl}/fee-structure?currency=${currency}${orderType ? `&q=${orderType}` : ""}`;
    console.log("[fee-structure] Proxying request to:", externalUrl);

    const res = await fetch(externalUrl, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    
    // Log for debugging
    console.log("[fee-structure] Response status:", res.status);
    console.log("[fee-structure] Response data:", JSON.stringify(data).substring(0, 500));

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error proxying fee-structure:", error);
    return NextResponse.json(
      { error: "Failed to fetch fee structure" },
      { status: 500 },
    );
  }
}
