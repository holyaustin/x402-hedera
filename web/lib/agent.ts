// lib/agent.ts
//
// The autonomous "agent" half of this project: instead of a human clicking
// Buy, this picks a product + symbol on its own and pays for it using the
// exact same signer/payment code the UI and CLI already use. Triggered on
// a schedule by Vercel Cron (see vercel.json + app/api/agent/run/route.ts),
// or manually with the same secret for testing/demo purposes.

import { payAndFetch, type PayResult } from "./payClient";
import { CATALOG } from "./sellerProducts";
import { SYMBOLS } from "./symbols";

export type AgentRunResult = {
  product: string;
  symbol: string;
  ranAt: string;
  result: PayResult;
};

// No database, no memory between runs — instead, the choice of what to buy
// rotates deterministically based on the current day, so repeated runs
// naturally cycle through the catalog and symbol list over time instead of
// always repeating the same purchase.
export async function runAgentOnce(): Promise<AgentRunResult> {
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const product = CATALOG[dayIndex % CATALOG.length];
  const symbol = SYMBOLS[dayIndex % SYMBOLS.length].symbol;

  const result = await payAndFetch(product.id, symbol);

  return {
    product: product.id,
    symbol,
    ranAt: new Date().toISOString(),
    result,
  };
}