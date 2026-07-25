// app/api/x402/[[...route]]/route.ts
//
// This catch-all route is what turns lib/sellerApp.ts's Hono app into real
// Next.js API endpoints. Every request under /api/x402/* (e.g.
// /api/x402/catalog, /api/x402/data/spot-price) gets handed to Hono, which
// does its own internal routing from there.
//
// Must run on the Node.js runtime, not Edge — the Hedera SDK dependencies
// used inside sellerApp.ts rely on Node built-ins (crypto, Buffer).

import { handle } from "hono/vercel";
import app from "@/lib/sellerApp";

export const runtime = "nodejs";

export const GET = handle(app);
export const POST = handle(app);