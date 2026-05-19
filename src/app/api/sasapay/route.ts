import { NextRequest, NextResponse } from "next/server";

const ELEMENTPAY_API_BASE =
  process.env.ELEMENTPAY_API_BASE ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.elementpay.net";

// ── GET: fetch supported banks ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("action") !== "banks") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const url = `${ELEMENTPAY_API_BASE}/api/v1/banks`;
  console.log("[sasapay] Fetching banks from ElementPay backend:", url);

  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 3600 },
    });

    console.log("[sasapay] Banks response status:", res.status);

    const rawText = await res.text();
    console.log("[sasapay] Banks raw response (first 200 chars):", rawText.slice(0, 200));

    if (!res.ok) {
      throw new Error(`Banks fetch failed: ${res.status} — ${rawText.slice(0, 200)}`);
    }

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(`Banks returned non-JSON: ${rawText.slice(0, 200)}`);
    }

    return NextResponse.json({ data: Array.isArray(data) ? data : [] });
  } catch (err: any) {
    console.error("[sasapay] Failed to fetch banks:", err?.message ?? err);
    return NextResponse.json({ error: err?.message ?? "Failed to load banks" }, { status: 502 });
  }
}

// ── POST: validate bank code ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (body.action !== "validate") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  if (!body.bank_code) {
    return NextResponse.json({ error: "bank_code is required" }, { status: 400 });
  }

  const url = `${ELEMENTPAY_API_BASE}/api/v1/banks/validate`;
  console.log("[sasapay] Validating bank_code:", body.bank_code, "at:", url);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bank_code: body.bank_code, country: "KE" }),
    });

    console.log("[sasapay] Validate response status:", res.status);

    const rawText = await res.text();
    console.log("[sasapay] Validate raw response (first 200 chars):", rawText.slice(0, 200));

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(`Validate returned non-JSON: ${rawText.slice(0, 200)}`);
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("[sasapay] Bank validation failed:", err?.message ?? err);
    return NextResponse.json({ error: err?.message ?? "Validation request failed" }, { status: 502 });
  }
}