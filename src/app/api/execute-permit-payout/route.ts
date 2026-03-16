import { NextResponse } from "next/server";
import { getTokenFromCookies } from "@/lib/auth-cookies";

/**
 * POST /api/execute-permit-payout
 *
 * Receives EIP-2612 permit signature data from an external wallet user
 * and relays the permitAndTransfer onchain call via the backend gateway.
 *
 * The heavy lifting (calling the contract) should be done by the backend
 * service — this route simply forwards the signed permit data along with
 * the authenticated user's session to the backend.
 */
export async function POST(request: Request) {
  const token = getTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { tokenAddress, owner, spender, value, deadline, v, r, s, chainId } = body;

  if (!tokenAddress || !owner || !spender || !value || !deadline || v === undefined || !r || !s || !chainId) {
    return NextResponse.json({ error: "Missing required permit parameters" }, { status: 400 });
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
  if (!backendUrl) {
    return NextResponse.json({ error: "Backend URL not configured" }, { status: 500 });
  }

  const response = await fetch(`${backendUrl}/api/permit-payout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tokenAddress, owner, spender, value, deadline, v, r, s, chainId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return NextResponse.json(
      { error: errorData.message || "Permit payout failed" },
      { status: response.status },
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
