import { NextResponse } from "next/server";
import { isAddressEqual, parseUnits, type Address } from "viem";

import { getTokenFromCookies } from "@/lib/auth-cookies";
import { getPrivySponsoredWithdrawChainConfig } from "@/lib/privy-sponsorship/chains";
import {
  getPrivySponsoredWithdrawRuntimeConfig,
  parseSponsoredWithdrawChainKey,
} from "@/lib/privy-sponsorship/server-config";
import type {
  PrivySponsoredWithdrawValidationRequest,
  PrivySponsoredWithdrawValidationResponse,
} from "@/lib/privy-sponsorship/types";

export async function POST(request: Request) {
  const token = await getTokenFromCookies();

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body =
      (await request.json()) as Partial<PrivySponsoredWithdrawValidationRequest>;
    const chainKey = parseSponsoredWithdrawChainKey(body.chainKey);
    const runtimeConfig = getPrivySponsoredWithdrawRuntimeConfig(chainKey);
    const chainConfig = getPrivySponsoredWithdrawChainConfig(chainKey);
    const tokenAddress = body.tokenAddress?.trim().toLowerCase();
    const amount = body.amount?.trim();

    if (!tokenAddress) {
      return NextResponse.json(
        { message: "A token address is required." },
        { status: 400 },
      );
    }

    if (!amount) {
      return NextResponse.json(
        { message: "An amount is required." },
        { status: 400 },
      );
    }

    const supportedToken = chainConfig.supportedTokens.find(
      (item) => item.address.toLowerCase() === tokenAddress,
    );

    if (!supportedToken) {
      return NextResponse.json(
        { message: "This token is not enabled for sponsored withdrawals." },
        { status: 403 },
      );
    }

    const requestedRecipient = body.recipient?.trim() as Address | undefined;

    if (
      requestedRecipient &&
      !isAddressEqual(
        requestedRecipient,
        runtimeConfig.liquidationWalletAddress,
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Sponsored withdrawals can only send funds to the configured liquidation wallet.",
        },
        { status: 403 },
      );
    }

    let amountRaw: bigint;

    try {
      amountRaw = parseUnits(amount, supportedToken.decimals);
    } catch {
      return NextResponse.json(
        { message: "Amount has too many decimal places for this token." },
        { status: 400 },
      );
    }

    if (amountRaw <= 0n) {
      return NextResponse.json(
        { message: "Amount must be greater than zero." },
        { status: 400 },
      );
    }

    const payload: PrivySponsoredWithdrawValidationResponse = {
      ...runtimeConfig,
      token: supportedToken,
      transfer: {
        amount,
        amountRaw: amountRaw.toString(),
        recipient: runtimeConfig.liquidationWalletAddress,
      },
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Transfer validation failed.";
    const status =
      message.includes("Missing liquidation wallet address") ||
      message.includes("Environment variable")
        ? 500
        : 400;

    return NextResponse.json({ message }, { status });
  }
}
