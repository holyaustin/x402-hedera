// lib/payClient.ts
//
// This runs ONLY on the server (inside app/api/pay/route.ts, a Node.js
// runtime API route) — never in the browser. That's what keeps the buyer's
// Hedera private key out of client-side JavaScript. The React components
// (UI mode and CLI mode) never see a key; they just POST { product, symbol }
// to /api/pay and get back the paid-for data plus a HashScan link.
//
// The "seller" x402 endpoints now live in THIS SAME Next.js deployment
// (see lib/sellerApp.ts + app/api/x402/[[...route]]/route.ts), so this
// still does a real HTTP round-trip — a genuine 402 challenge and a signed
// payment retry — it's just calling a route on the same app instead of a
// separate service. That keeps the demo to a single deployment while the
// x402 protocol mechanics stay identical.

import { wrapFetchWithPayment, x402HTTPClient } from "@x402/fetch";
import { x402Client } from "@x402/core/client";
import { ExactHederaScheme } from "@x402/hedera/exact/client";
import { createClientHederaSigner } from "@x402/hedera";
import { PrivateKey } from "@hiero-ledger/sdk";

type CaipNetwork = `${string}:${string}`;

const NETWORK = (process.env.HEDERA_NETWORK ?? "hedera:testnet") as CaipNetwork;

// Resolve the base URL of the seller endpoints, in priority order:
//   1. RESOURCE_SERVER_URL, if you explicitly set one (e.g. still pointing
//      at a standalone server/ deployment instead of the bundled routes).
//   2. VERCEL_URL, which Vercel auto-injects with the current deployment's
//      hostname — no manual config needed once deployed.
//   3. localhost:3000, for local `npm run dev`.
function resolveResourceServerBase(): string {
  if (process.env.RESOURCE_SERVER_URL) return process.env.RESOURCE_SERVER_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

const RESOURCE_SERVER_URL = `${resolveResourceServerBase()}/api/x402`;

let fetchWithPayment: ReturnType<typeof wrapFetchWithPayment> | null = null;
let httpClient: x402HTTPClient | null = null;

function getClient() {
  if (fetchWithPayment && httpClient) {
    return { fetchWithPayment, httpClient };
  }

  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  if (!accountId || !privateKey) {
    throw new Error(
      "Missing HEDERA_ACCOUNT_ID / HEDERA_PRIVATE_KEY in web/.env.local. " +
        "This must be a FUNDED Hedera testnet account — get one at https://portal.hedera.com",
    );
  }

  const signer = createClientHederaSigner(accountId, PrivateKey.fromStringECDSA(privateKey), {
    network: NETWORK,
  });

  const client = new x402Client();
  client.register(NETWORK, new ExactHederaScheme(signer));

  fetchWithPayment = wrapFetchWithPayment(fetch, client);
  httpClient = new x402HTTPClient(client);

  return { fetchWithPayment, httpClient };
}

export type PayResult = {
  ok: boolean;
  status: number;
  data?: unknown;
  paymentStatus?: string;
  transactionId?: string;
  hashscanUrl?: string;
  error?: string;
};

export async function payAndFetch(product: string, symbol: string): Promise<PayResult> {
  try {
    const { fetchWithPayment, httpClient } = getClient();
    const url = `${RESOURCE_SERVER_URL}/data/${product}?symbol=${encodeURIComponent(symbol)}`;

    const response = await fetchWithPayment(url, { method: "GET" });
    const result = await httpClient.processResponse(response);

    const header = result.header as Record<string, unknown> | undefined;
    const txId =
      (header?.transaction as string | undefined) ??
      (header?.transactionId as string | undefined) ??
      undefined;

    return {
      ok: response.ok,
      status: response.status,
      data: result.body,
      paymentStatus: result.paymentStatus,
      transactionId: txId,
      hashscanUrl: txId ? `https://hashscan.io/testnet/transaction/${txId}` : undefined,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}