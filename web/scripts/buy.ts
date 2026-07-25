// scripts/buy.ts
//
// A plain command-line client for testing the bundled seller routes
// directly, separate from the browser UI. Run this against your local
// `npm run dev` (which now serves BOTH the frontend and the /api/x402
// seller routes on port 3000).
//
// Usage (from the web/ folder, with `npm run dev` running in another tab):
//   npx tsx scripts/buy.ts spot-price AAPL   # settles in HBAR
//   npx tsx scripts/buy.ts quote AAPL         # settles in USDC
//   npx tsx scripts/buy.ts ai-insight TSLA    # settles in HBAR

import "dotenv/config";
import { wrapFetchWithPayment, x402HTTPClient } from "@x402/fetch";
import { x402Client } from "@x402/core/client";
import { ExactHederaScheme } from "@x402/hedera/exact/client";
import { createClientHederaSigner } from "@x402/hedera";
import { PrivateKey } from "@hiero-ledger/sdk";

type CaipNetwork = `${string}:${string}`;

const BASE_URL = process.env.RESOURCE_SERVER_URL ?? "http://localhost:3000";
const RESOURCE_SERVER_URL = `${BASE_URL}/api/x402`;
const NETWORK = (process.env.HEDERA_NETWORK ?? "hedera:testnet") as CaipNetwork;

async function main() {
  const [product = "spot-price", symbol = "AAPL"] = process.argv.slice(2);

  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  if (!accountId || !privateKey) {
    console.error("Set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY in web/.env.local (a funded testnet buyer account).");
    process.exit(1);
  }

  const signer = createClientHederaSigner(accountId, PrivateKey.fromStringECDSA(privateKey), {
    network: NETWORK,
  });

  const client = new x402Client();
  client.register(NETWORK, new ExactHederaScheme(signer));

  const fetchWithPayment = wrapFetchWithPayment(fetch, client);
  const httpClient = new x402HTTPClient(client);

  const url = `${RESOURCE_SERVER_URL}/data/${product}?symbol=${encodeURIComponent(symbol)}`;
  console.log(`Requesting ${url} ...`);

  const response = await fetchWithPayment(url, { method: "GET" });

  const rawText = await response.clone().text();
  if (!rawText) {
    console.error(`\nEmpty response body. Status: ${response.status} ${response.statusText}`);
    response.headers.forEach((value, key) => console.error(`  ${key}: ${value}`));
    process.exit(1);
  }

  const result = await httpClient.processResponse(response);

  console.log("\nStatus:", response.status);
  console.log("Payment status:", result.paymentStatus);
  console.log("Body:", JSON.stringify(result.body, null, 2));
  console.log("Payment header (contains the Hedera transaction id):", result.header);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});