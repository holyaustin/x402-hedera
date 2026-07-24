// products.ts
//
// This file defines WHAT you are selling (the catalog) and HOW each product's
// data is generated. Everything here is deterministic mock data so the whole
// demo works with zero external API keys. Swap any of these functions for a
// real data source or a real LLM call — the x402 payment layer in index.ts
// does not need to change.
//
// Each product also declares which SETTLEMENT ASSET it charges in. This demo
// intentionally sells two products in native HBAR and one in USDC, to prove
// the resource server can accept BOTH assets side by side on Hedera testnet
// — see the money parser in index.ts for how that routing works.

export type SettlementAsset = "HBAR" | "USDC";

export type Product = {
  id: string;
  priceUSD: number; // the numeric price value used in the x402 "$" price string
  asset: SettlementAsset; // which asset this product actually settles in
  description: string;
};

export const CATALOG: Product[] = [
  {
    id: "spot-price",
    priceUSD: 0.01,
    asset: "HBAR",
    description: "Latest mock spot price for a ticker symbol (settled in HBAR)",
  },
  {
    id: "quote",
    priceUSD: 0.02,
    asset: "USDC",
    description: "Mock bid/ask quote for a ticker symbol (settled in USDC)",
  },
  {
    id: "ai-insight",
    priceUSD: 0.05,
    asset: "HBAR",
    description: "One-paragraph AI-style market note for a ticker symbol (settled in HBAR)",
  },
];

export function getProduct(id: string): Product | undefined {
  return CATALOG.find((p) => p.id === id);
}

// --- Small deterministic PRNG so repeated calls for the same symbol/minute
// --- look consistent, without needing any external data provider.
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (Math.imul(1103515245, h) + 12345) | 0;
    return ((h >>> 0) % 10000) / 10000;
  };
}

export function mockSpotPrice(symbol: string) {
  const minuteBucket = Math.floor(Date.now() / 60000).toString();
  const rand = seededRandom(symbol.toUpperCase() + minuteBucket);
  const base = 50 + rand() * 450;
  return {
    symbol: symbol.toUpperCase(),
    price: Number(base.toFixed(2)),
    currency: "USD",
    ts: new Date().toISOString(),
  };
}

export function mockQuote(symbol: string) {
  const { price } = mockSpotPrice(symbol);
  const spread = price * 0.001;
  return {
    symbol: symbol.toUpperCase(),
    bid: Number((price - spread).toFixed(2)),
    ask: Number((price + spread).toFixed(2)),
    ts: new Date().toISOString(),
  };
}

const NOTES = [
  "showing steady accumulation on light volume, consistent with range-bound trading",
  "testing resistance after a sharp move, watch for a pullback into support",
  "consolidating near the mid-point of its recent range, low conviction either way",
  "diverging from sector peers, a possible idiosyncratic catalyst is in play",
  "extended above its short-term average, mean reversion risk looks elevated",
];

export function mockAiInsight(symbol: string) {
  const rand = seededRandom(symbol.toUpperCase());
  const note = NOTES[Math.floor(rand() * NOTES.length)];
  return {
    symbol: symbol.toUpperCase(),
    insight: `${symbol.toUpperCase()} is ${note}.`,
    modelNote: "mock output — replace this function with a real LLM call to make it a genuine AI product",
    ts: new Date().toISOString(),
  };
}
