import { NextRequest, NextResponse } from "next/server";

import { getTokenFromCookies } from "@/lib/auth-cookies";
import {
  getPrivySponsoredWithdrawRuntimeConfig,
  parseSponsoredWithdrawChainKey,
} from "@/lib/privy-sponsorship/server-config";

export async function GET(request: NextRequest) {
  const token = await getTokenFromCookies();

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const chainKey = parseSponsoredWithdrawChainKey(
      request.nextUrl.searchParams.get("chainKey"),
    );

    return NextResponse.json(getPrivySponsoredWithdrawRuntimeConfig(chainKey));
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load sponsored withdrawal configuration.";
    const status =
      message.includes("Missing liquidation wallet address") ||
      message.includes("Environment variable")
        ? 500
        : 400;

    return NextResponse.json({ message }, { status });
  }
}
