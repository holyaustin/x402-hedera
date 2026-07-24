// lib/payClient.ts
//
// This runs ONLY on the server (inside app/api/pay/route.ts, a Node.js
// runtime API route) — never in the browser. That's what keeps the buyer's
// Hedera private key out of client-side JavaScript. The React components
// (UI mode and CLI mode) never see a key; they just POST { product, symbol }
// to /api/pay and get back the paid-for data plus a HashScan link.

import { wrapFetchWithPayment, x402HTTPClient } from "@x402/fetch";
import { x402Client } from "@x402/core/client";
import { ExactHederaScheme } from "@x402/hedera/exact/client";
import { createClientHederaSigner } from "@x402/hedera";
import { PrivateKey } from "@hiero-ledger/sdk";

// x402's PaymentOption.network is typed as this literal pattern (a CAIP-2
// id like "hedera:testnet"). process.env values are always plain `string`,
// so we cast once here rather than fighting the compiler at every call site.
type CaipNetwork = `${string}:${string}`;

const RESOURCE_SERVER_URL = process.env.RESOURCE_SERVER_URL ?? "http://localhost:4021";
const NETWORK = (process.env.HEDERA_NETWORK ?? "hedera:testnet") as CaipNetwork;

let fetchWithPayment: ReturnType<typeof wrapFetchWithPayment> | null = null;
let httpClient: x402HTTPClient | null = null;

// Build the paying client once and reuse it across requests (cheaper than
// re-deriving the signer on every call).
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

    // The settlement result (including the Hedera transaction id) comes back
    // in the decoded PAYMENT-RESPONSE header. The exact field name can vary
    // slightly by facilitator/SDK version — log `result.header` the first
    // time you run this and adjust the lookup below if needed.
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