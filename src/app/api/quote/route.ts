import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const amountFiat = searchParams.get("amount_fiat");
    const token = searchParams.get("token");
    const orderType = searchParams.get("order_type"); // "OffRamp" or "OnRamp"

    if (!amountFiat || !token) {
      return NextResponse.json(
        { error: "Missing required parameters: amount_fiat, token" },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const apiKey = process.env.NEXT_PRIVATE_AGGR_API_KEY;

    if (!apiUrl || !apiKey) {
      console.error("Missing API configuration");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Convert order_type string to number (1 = OffRamp, 0 = OnRamp)
    const orderTypeNum = orderType === "OnRamp" ? 0 : 1;

    const res = await fetch(`${apiUrl}/quote/order`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount_fiat: parseFloat(amountFiat),
        token: token,
        order_type: orderTypeNum,
        currency: "KES",
      }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error fetching quote:", error);
    return NextResponse.json(
      { error: "Failed to fetch quote" },
      { status: 500 }
    );
  }
}
