import { NextResponse } from "next/server";
import { getTokenFromCookies } from "@/lib/auth-cookies";

/**
 * POST /api/user/mark-delegated
 *
 * Records that the user has delegated their embedded wallet.
 * Forwards the request to the backend with the user's session token.
 */
export async function POST(request: Request) {
  const token = getTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { walletAddress } = body;

  if (!walletAddress) {
    return NextResponse.json({ error: "walletAddress is required" }, { status: 400 });
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
  if (!backendUrl) {
    return NextResponse.json({ error: "Backend URL not configured" }, { status: 500 });
  }

  const response = await fetch(`${backendUrl}/api/user/mark-delegated`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ walletAddress }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return NextResponse.json(
      { error: errorData.message || "Failed to mark delegation" },
      { status: response.status },
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
