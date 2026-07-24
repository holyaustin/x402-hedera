// scripts/buy.ts
//
// A plain command-line client, separate from the Next.js app, so you can
// prove the whole 402 -> pay -> 200 flow works from a real terminal before
// (or while) wiring up the web UI.
//
// Usage (from the server/ folder):
//   npx tsx scripts/buy.ts spot-price AAPL   # settles in HBAR
//   npx tsx scripts/buy.ts quote AAPL         # settles in USDC (needs association + balance)
//   npx tsx scripts/buy.ts ai-insight TSLA    # settles in HBAR
//
// Requires HEDERA_ACCOUNT_ID / HEDERA_PRIVATE_KEY for a FUNDED testnet
// buyer account in server/.env (different from PAY_TO_ACCOUNT, which is
// the seller). For USDC-priced products, run `npm run associate` first and
// make sure the account holds some testnet USDC (faucet.circle.com).

import "dotenv/config";
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

async function main() {
  const [product = "spot-price", symbol = "AAPL"] = process.argv.slice(2);

  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  if (!accountId || !privateKey) {
    console.error("Set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY in server/.env (a funded testnet buyer account).");
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

  // Read the raw body via a clone first, so we can print something useful
  // even if it's empty or not valid JSON, instead of crashing.
  const rawText = await response.clone().text();
  if (!rawText) {
    console.error(`\nEmpty response body. Status: ${response.status} ${response.statusText}`);
    console.error("Headers:");
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
