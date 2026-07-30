# x402·Hedera-Agent

An autonomous agent that buys live data one request at a time, via the **x402**
payment standard, settling on **Hedera testnet** in real HBAR and USDC — on
its own daily schedule, with no human in the loop. It also ships a UI and a
CLI so a person can trigger the identical payment flow on demand.

Built for the [Hedera x402 bounty](https://hedera.com/x402-bounty).

Transactions on Hedera testnet explorer for [All x402 API calls](https://hashscan.io/testnet/account/0.0.9693209/operations).

Live Url for demo [ Live Demo Url](https://x402-hedera-agent.vercel.app/).

Youtube video [YouTube Video Demo Url](https://youtu.be/XzkdQsLYPuY).

---

## What makes this a *payment solution*, not just a demo

x402's own framing is: **"software pays software directly... autonomous
agents and machine-to-machine systems can transact without a human in the
loop."** This project satisfies that literally, not just in spirit:

- **`app/api/agent/run`** is invoked by **Vercel Cron** once a day — no
  person clicks anything. It picks a product and a ticker on its own and
  pays for it, using the exact same signer and payment code as everything
  else in this app.
- **`/receipts`** is a live ledger with no database behind it — it queries
  Hedera's public mirror node directly for every payment received by the
  seller account. The blockchain *is* the audit trail.
- **UI Mode and CLI Mode** remain available for on-demand, human-triggered
  purchases — the same underlying payment engine, a different trigger.


## Architecture — one deployment

Everything lives in a single Next.js app (`web/`). There's no separate resource server to deploy or keep in sync: The Server (`server/`) was initially used to serve the web but was later abondoned for a single deployment through NExtJS (Since it can handle both server and client on one deployment)

```
web/
├── app/
│   ├── page.tsx                 # UI Mode + CLI Mode toggle
│   ├── receipts/page.tsx        # live payment ledger (mirror node)
│   ├── api/pay/route.ts         # buyer: human-triggered purchase
│   ├── api/agent/run/route.ts   # buyer: autonomous, cron-triggered
│   └── api/x402/[[...route]]/route.ts  # seller: Hono app mounted in Next.js
├── lib/
│   ├── payClient.ts             # shared buyer/signer logic
│   ├── sellerApp.ts             # x402 paymentMiddleware + Hedera scheme
│   ├── sellerProducts.ts        # catalog + mock data
│   ├── agent.ts                 # autonomous purchase decision logic
│   └── symbols.ts               # shared ticker list
├── scripts/
│   ├── buy.ts                   # CLI purchase tester
│   └── associate.ts             # one-time HTS token association
└── vercel.json                  # daily cron config
```

The "seller" (`lib/sellerApp.ts`, a Hono app with x402's `paymentMiddleware`) and the "buyer" (`lib/payClient.ts`) are still architecturally distinct — they just live in one deployment instead of two. Every purchase is still a real HTTP request carrying a real `402`, a real signed payment, and a real Hedera settlement.
```

## Setup

```bash
cd web
cp .env.local.example .env.local
```

Fill in `.env.local`:

- HEDERA_ACCOUNT_ID=0.0.YOUR_BUYER_ACCOUNT
- HEDERA_PRIVATE_KEY=YOUR_BUYER_ECDSA_PRIVATE_KEY
- PAY_TO_ACCOUNT=0.0.YOUR_SELLER_ACCOUNT
- FACILITATOR_URL=https://api.testnet.blocky402.com
- HEDERA_NETWORK=hedera:testnet
- CRON_SECRET=any-random-string-you-choose


Install and run:

```bash
npm install
npm run dev
```

Open **http://localhost:3000** — UI Mode and CLI Mode both work immediately,
no second server to start.

For the USDC-priced product, associate + fund your buyer account once:

```bash
npm run associate                 # associates with testnet USDC (0.0.429274)
# then get testnet USDC at https://faucet.circle.com (select Hedera Testnet)
```

Test from the command line directly:

```bash
npm run buy -- spot-price AAPL     # settles in HBAR
npm run buy -- quote AAPL           # settles in USDC
npm run buy -- ai-insight TSLA      # settles in HBAR
```

Test the autonomous agent locally:

```bash
curl -H "Authorization: Bearer any-random-string-you-choose" http://localhost:3000/api/agent/run
```

---

## Deploying to Vercel

1. Push to a public GitHub repo.
2. Vercel dashboard → **Add New → Project** → import the repo.
3. **Root Directory** → `web`.
4. **Environment Variables** (Settings → Environment Variables):

HEDERA_ACCOUNT_ID
HEDERA_PRIVATE_KEY
PAY_TO_ACCOUNT
FACILITATOR_URL
HEDERA_NETWORK
CRON_SECRET

5. Deploy. `vercel.json` registers the daily cron automatically — no extra
   dashboard step needed for that part.
6. Visit `/receipts` on your deployed URL to confirm the mirror-node query
   works in production.

No `RESOURCE_SERVER_URL` is needed on Vercel — `lib/payClient.ts` resolves
the seller's URL automatically via Vercel's own `VERCEL_URL` env var, since
buyer and seller are the same deployment.

---

## Verified transactions (Hedera testnet)

Real, settled purchases from this project, in both HBAR and USDC:

- <https://hashscan.io/testnet/transaction/0.0.7162784@1784919117.305354593> — `spot-price`, HBAR
- <https://hashscan.io/testnet/transaction/0.0.7162784@1784919156.713110754> — `ai-insight`, HBAR
- <https://hashscan.io/testnet/transaction/0.0.7162784@1784921057.817511506> — `quote`, USDC
- <https://hashscan.io/testnet/transaction/0.0.7162784@1784929986.329447882>
- <https://hashscan.io/testnet/transaction/0.0.7162784@1784931942.747461580>

Full account activity:

- Seller account (receives payment): <https://hashscan.io/testnet/account/0.0.9693209/operations>
- Buyer account (pays): <https://hashscan.io/testnet/account/0.0.9693221/operations>

Or see it live, always up to date, on the deployed app's [`/receipts`](/receipts)
page — no need to trust a static list once the app is running.

---

## Products

| Product | Price | Settles in |
|---|---|---|
| `spot-price` | $0.01 | HBAR (native, no association needed) |
| `quote` | $0.02 | USDC (testnet, requires association) |
| `ai-insight` | $0.05 | HBAR |

---

## Testing

```bash
npm test          # automated: Vitest + React Testing Library
```

See `TEST_PLAN.md` for the manual test checklist covering real payments,
responsive layout, and accessibility — things that need a real browser and
a real transaction, not a mock.

---
