import { NextRequest, NextResponse } from "next/server";
import { getTokenFromCookies } from "@/lib/auth-cookies";

export async function POST(request: NextRequest) {
  try {
    // Parse body — guard against empty / malformed JSON
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid or empty request body" },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const apiKey = process.env.NEXT_PRIVATE_AGGR_API_KEY;
    if (!apiUrl || !apiKey) {
      console.error("Missing API configuration (apiUrl or apiKey).");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Read token from HTTP-only cookie (never from client header)
    const token = await getTokenFromCookies();
    const headers: Record<string, string> = {
      // "x-api-key": apiKey,
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${apiUrl}/orders/create`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    // Relay the backend response (including exact error messages)
    let data: unknown;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { error: text || res.statusText };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("Error proxying orders/create:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
