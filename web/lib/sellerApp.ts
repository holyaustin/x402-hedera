// lib/sellerApp.ts
//
// The "seller" side of x402, now mounted as a Hono app INSIDE the Next.js
// deployment instead of a separate service. Nothing about the x402 protocol
// logic changes from the standalone version — same paymentMiddleware, same
// money parser, same dual-asset (HBAR + USDC) routing. The only real
// difference is basePath("/api/x402"), so routes live under that prefix
// when Next.js's catch-all route hands requests to this app.
//
// This file holds no private key, same as before — only PAY_TO_ACCOUNT,
// a plain receiving address.

import { Hono } from "hono";
import { paymentMiddleware } from "@x402/hono";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactHederaScheme } from "@x402/hedera/exact/server";
import { CATALOG, mockSpotPrice, mockQuote, mockAiInsight } from "./sellerProducts";

type CaipNetwork = `${string}:${string}`;

const PAY_TO = process.env.PAY_TO_ACCOUNT;
const FACILITATOR_URL = process.env.FACILITATOR_URL ?? "https://api.testnet.blocky402.com";
const NETWORK = (process.env.HEDERA_NETWORK ?? "hedera:testnet") as CaipNetwork;

if (!PAY_TO) {
  throw new Error(
    "Missing PAY_TO_ACCOUNT — set it to the Hedera testnet account id that should receive " +
      "payments, e.g. PAY_TO_ACCOUNT=0.0.123456. Locally: web/.env.local. On Vercel: Project " +
      "Settings -> Environment Variables.",
  );
}

const HBAR_NATIVE_ASSET = "0.0.0";
const TINYBARS_PER_HBAR = 100_000_000;

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
  return null; // falls through to default asset resolution -> USDC on Hedera testnet
});

const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const resourceServer = new x402ResourceServer(facilitatorClient).register(NETWORK, hederaScheme);

const app = new Hono().basePath("/api/x402");

app.get("/catalog", (c) => c.json({ products: CATALOG, network: NETWORK, payTo: PAY_TO }));

function priceString(priceUSD: number) {
  return `$${priceUSD}`;
}

// IMPORTANT: paymentMiddleware matches its config keys against the full,
// absolute request path Hono sees — NOT the path relative to basePath().
// Since this app is mounted at basePath("/api/x402"), every key here must
// include that prefix (e.g. "GET /api/x402/data/spot-price"), even though
// the actual route handlers below are registered with the shorter,
// basePath-relative form ("/data/spot-price"). Route registration and this
// middleware's matching are two separate mechanisms that don't share the
// same path convention — mismatching them here silently lets requests
// through UNPAID instead of failing closed, which is exactly what was
// happening before this fix.
const SELLER_BASE_PATH = "/api/x402";

app.use(
  paymentMiddleware(
    Object.fromEntries(
      CATALOG.map((product) => [
        `GET ${SELLER_BASE_PATH}/data/${product.id}`,
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

export default app;