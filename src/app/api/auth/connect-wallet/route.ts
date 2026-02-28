import { NextRequest, NextResponse } from "next/server";
import { createBackendErrorResponse, fetchBackend } from "@/lib/backend-fetch";
import {
  normalizeWalletConnectFailure,
  isWalletOwnershipConflictResponse,
} from "@/lib/wallet-link-policy";
import { getTokenFromCookies } from "@/lib/auth-cookies";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = await getTokenFromCookies();

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    const res = await fetchBackend("/auth/connect-wallet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    const backendReportedFailure =
      (typeof data?.success === "boolean" && data.success === false) ||
      data?.status === "error";

    if (!res.ok || backendReportedFailure) {
      const normalized = normalizeWalletConnectFailure(res.status, data);
      return NextResponse.json(
        {
          success: false,
          message: normalized.message,
          code: normalized.code,
        },
        { status: normalized.status },
      );
    }

    if (isWalletOwnershipConflictResponse(res.status, data)) {
      const normalized = normalizeWalletConnectFailure(res.status, data);
      return NextResponse.json(
        {
          success: false,
          message: normalized.message,
          code: normalized.code,
        },
        { status: normalized.status },
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[connect-wallet] Error:", error);
    return createBackendErrorResponse(error);
  }
}
