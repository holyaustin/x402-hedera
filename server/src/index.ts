// index.ts
//
// This is the "resource server" — the API that SELLS data. It never touches
// a Hedera private key itself. It only:
//   1. Advertises a price per route via the x402 paymentMiddleware.
//   2. Hands verification + settlement off to a Hedera facilitator (Blocky402).
//   3. Serves the actual data once payment is confirmed.
//
// MIXING NATIVE HBAR AND USDC
// -----------------------------
// PaymentOption (the "accepts" entry) only takes a `price` string like
// "$0.01" — it does NOT accept flat `asset`/`amount` fields directly. The
// sanctioned way to control which real asset a price resolves to is a
// "money parser" registered on the scheme, exactly as shown in x402's own
// official example (x402-foundation/x402, examples/typescript/servers/
// advanced — "Custom Tokens: Accept payments in tokens other than USDC"):
//
//   new ExactEvmScheme().registerMoneyParser(async (amount, network) => {
//     if (network === "eip155:100") {
//       return { amount: BigInt(Math.round(amount * 1e18)).toString(), asset: "0x..." };
//     }
//   });
//
// A money parser only receives (amount, network) — it has no idea which
// route triggered it. To sell SOME products in HBAR and others in the
// default USDC on the same server, we give each product in the catalog a
// distinct numeric price and pre-compute which of those exact numbers
// should resolve to HBAR. For any amount that ISN'T in that set, the parser
// returns null, which tells x402 to fall through to the network's default
// asset resolution — which on Hedera testnet is USDC (0.0.429274).
//
// Run with:  npm run dev   (from the server/ folder)

import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { paymentMiddleware } from "@x402/hono";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactHederaScheme } from "@x402/hedera/exact/server";
import { CATALOG, mockSpotPrice, mockQuote, mockAiInsight } from "./products.js";

// x402's PaymentOption.network is typed as this literal pattern (a CAIP-2
// id like "hedera:testnet"). process.env values are always plain `string`,
// so we cast once here rather than fighting the compiler at every call site.
type CaipNetwork = `${string}:${string}`;

const PORT = Number(process.env.PORT ?? 4021);

// The Hedera ACCOUNT ID that should RECEIVE payment for every sale.
// This is just an address (0.0.xxxxx) — no private key needed on this server.
const PAY_TO = process.env.PAY_TO_ACCOUNT;

// Blocky402 runs an open, no-API-key-required x402 facilitator for Hedera
// testnet. It verifies each signed payment and broadcasts it on-chain on
// behalf of the buyer, paying the network fee itself.
const FACILITATOR_URL = process.env.FACILITATOR_URL ?? "https://api.testnet.blocky402.com";

// CAIP-2 style network id x402 uses to identify Hedera testnet.
const NETWORK = (process.env.HEDERA_NETWORK ?? "hedera:testnet") as CaipNetwork;

if (!PAY_TO) {
  throw new Error(
    "Missing PAY_TO_ACCOUNT in server/.env — set it to the Hedera testnet account id " +
      "that should receive payments, e.g. PAY_TO_ACCOUNT=0.0.123456",
  );
}

// --- Dual-asset pricing: HBAR for some products, USDC (default) for others
const HBAR_NATIVE_ASSET = "0.0.0";
const TINYBARS_PER_HBAR = 100_000_000;

// Every priceUSD value in CATALOG that's tagged asset: "HBAR" gets routed to
// native HBAR by the parser below. Anything else (asset: "USDC") falls
// through untouched to the default USDC resolution on Hedera testnet.
const HBAR_PRICE_POINTS = new Set(
  CATALOG.filter((p) => p.asset === "HBAR").map((p) => p.priceUSD),
);

const hederaScheme = new ExactHederaScheme().registerMoneyParser(async (amount, network) => {
  if (network === NETWORK && HBAR_PRICE_POINTS.has(amount)) {
    return {
      amount: String(Math.round(amount * TINYBARS_PER_HBAR)),
      asset: HBAR_NATIVE_ASSET,
    };
  }
  // Not one of our HBAR-priced products (or a different network) — fall
  // back to the default asset resolution, which is USDC on Hedera testnet.
  return null;
});

const app = new Hono();

// Wire up the facilitator + register Hedera's "exact" payment scheme
// (with our dual-asset money parser attached).
const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const resourceServer = new x402ResourceServer(facilitatorClient).register(NETWORK, hederaScheme);

// Public, free route — lets a buyer (or an agent) discover what's for sale,
// at what price, and in which asset, before spending anything.
app.get("/catalog", (c) => c.json({ products: CATALOG, network: NETWORK, payTo: PAY_TO }));

function priceString(priceUSD: number) {
  return `$${priceUSD}`;
}

// This middleware intercepts requests to the three routes below. If no valid
// payment is attached, it responds with HTTP 402 and a PAYMENT-REQUIRED
// header describing exactly how to pay. If a valid, signed payment IS
// attached, it verifies + settles it via the facilitator, then calls next()
// so your route handler runs and returns the actual data.
//
// `price` below is built straight from CATALOG's priceUSD field, so the
// catalog is the single source of truth for both what's advertised on
// /catalog and what the payment middleware actually charges.
app.use(
  paymentMiddleware(
    Object.fromEntries(
      CATALOG.map((product) => [
        `GET /data/${product.id}`,
        {
          accepts: [
            {
              scheme: "exact" as const,
              price: priceString(product.priceUSD),
              network: NETWORK,
              payTo: PAY_TO,
            },
          ],
          description: product.description,
          mimeType: "application/json",
        },
      ]),
    ),
    resourceServer,
  ),
);

app.get("/data/spot-price", (c) => {
  const symbol = c.req.query("symbol") ?? "AAPL";
  return c.json(mockSpotPrice(symbol));
});

app.get("/data/quote", (c) => {
  const symbol = c.req.query("symbol") ?? "AAPL";
  return c.json(mockQuote(symbol));
});

app.get("/data/ai-insight", (c) => {
  const symbol = c.req.query("symbol") ?? "AAPL";
  return c.json(mockAiInsight(symbol));
});

app.get("/", (c) => c.text("x402 + Hedera resource server is running. See GET /catalog"));

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`\n  Resource server:  http://localhost:${info.port}`);
  console.log(`  Paying out to:    ${PAY_TO}`);
  console.log(`  Facilitator:      ${FACILITATOR_URL}`);
  console.log(`  Network:          ${NETWORK}`);
  console.log(`  Products:`);
  for (const p of CATALOG) {
    console.log(`    - ${p.id.padEnd(12)} $${p.priceUSD}  ->  settles in ${p.asset}`);
  }
  console.log("");
});
