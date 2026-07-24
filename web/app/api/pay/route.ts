// app/api/pay/route.ts
//
// Single backend endpoint used by BOTH frontend modes (the button-based UI
// and the in-browser CLI). Keeping one route means the payment logic is
// written and tested once, and each mode is just a different presentation
// layer on top of it.

import { NextRequest, NextResponse } from "next/server";
import { payAndFetch } from "@/lib/payClient";

// Must run on the Node.js runtime (not Edge) — the Hedera SDK and the x402
// signer rely on Node APIs that Edge doesn't provide.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { product, symbol } = body as { product?: string; symbol?: string };

  if (!product) {
    return NextResponse.json({ ok: false, error: "Missing 'product' in request body" }, { status: 400 });
  }

  const result = await payAndFetch(product, symbol && symbol.trim() ? symbol.trim() : "AAPL");
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
