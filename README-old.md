# x402 + Hedera Pay-Per-Call Demo

A complete, working example for the Hedera x402 bounty: a **resource server**
that sells data one request at a time, and a **Next.js frontend** where a
person can buy that data either by clicking buttons (**UI Mode**) or by
typing commands into a simulated terminal (**CLI Mode**) — both call the same
backend and both settle real payments on **Hedera testnet**.

This guide assumes you're comfortable in a terminal but have never touched
Hedera or x402 before. Every step is spelled out.

---

## 1. How this fits together

```
┌─────────────────────┐      HTTP GET /data/spot-price?symbol=AAPL
│   Next.js web app    │ ───────────────────────────────────────────┐
│  (UI Mode / CLI Mode) │                                            │
│                       │ <── 402 Payment Required ──────────────── │
│  app/api/pay/route.ts │        (price, network, payTo address)    │
│  holds the BUYER key  │                                            ▼
│  (server-side only)   │                              ┌───────────────────────┐
└──────────┬────────────┘                              │  Resource server       │
           │  signs a Hedera payment,                  │  (Hono, port 4021)     │
           │  retries the request with it               │  holds NO private key  │
           └──────────────────────────────────────────► │  just a receiving      │
                                                          │  account (PAY_TO)      │
                                                          └───────────┬───────────┘
                                                                      │ verify + settle
                                                                      ▼
                                                          ┌───────────────────────┐
                                                          │  Blocky402 facilitator │
                                                          │  (Hedera testnet)      │
                                                          │  pays the network fee, │
                                                          │  broadcasts the tx     │
                                                          └───────────┬───────────┘
                                                                      ▼
                                                              Hedera testnet
                                                           (visible on HashScan)
```

Two independent apps, two `package.json` files:

- **`server/`** — the seller. A small [Hono](https://hono.dev) API. Advertises
  a price per route using `@x402/hono`'s `paymentMiddleware`, and never
  touches a private key — it only needs a Hedera **account id** to receive
  funds.
- **`web/`** — the buyer's front end. A Next.js app with two ways to trigger a
  purchase (buttons, or a typed CLI), both of which call one API route,
  `app/api/pay/route.ts`, which holds the buyer's key **server-side** and
  performs the actual `402 → sign → pay → 200` flow using `@x402/fetch` and
  `@x402/hedera`.

---

## 2. Prerequisites

- **Node.js 20+** and npm. Check with `node -v`.
- A **code editor** (VS Code recommended).
- Two free **Hedera testnet accounts** — one to receive money, one to spend
  it. You'll create these in Step 3.
- (Optional but recommended) a **Discord/GitHub account** if you want to ask
  for help in Hedera's dev Discord.

Unzip this project, then open it in your editor. You should see:

```
x402-hedera-demo/
├── README.md          <- you are here
├── server/             <- the seller API (Hono)
└── web/                 <- the buyer's Next.js app (UI + CLI)
```

---

## 3. Get two Hedera testnet accounts

x402 needs a **buyer** (pays) and a **seller** (receives). Using two separate
accounts makes the demo believable and easy to verify on HashScan.

1. Go to **https://portal.hedera.com** and sign up (free).
2. Create a testnet account — the portal gives you an **Account ID**
   (looks like `0.0.123456`) and a **private key**. Do this **twice**, or
   create one account and note its keys, then create a second.
   - Call one of them your **buyer** account (this one pays; it needs a real
     ECDSA private key you'll paste into `web/.env.local`).
   - Call the other your **seller** account (this one only needs its account
     ID; no key required — it just receives funds).
3. Both accounts are automatically funded with testnet HBAR by the portal.
   If either runs low, use the faucet button in the portal to top it up.
4. Save both Account IDs and the buyer's private key somewhere safe — you'll
   paste them into `.env` files in the next steps.

> **Why ECDSA?** The x402 Hedera scheme in this project uses
> `PrivateKey.fromStringECDSA(...)`. Make sure the key type you copy from the
> portal is ECDSA (this is the default for new testnet accounts). If your
> account uses an ED25519 key instead, swap that one line in
> `web/lib/payClient.ts` and `server/scripts/buy.ts` to
> `PrivateKey.fromStringED25519(...)`.

---

## 4. Set up and run the resource server (the seller)

```bash
cd server
cp .env.example .env
```

Open `.env` and fill in:

```
PAY_TO_ACCOUNT=0.0.YOUR_SELLER_ACCOUNT
```

Leave `FACILITATOR_URL` and `HEDERA_NETWORK` as-is — they're already pointed
at Hedera testnet via Blocky402's open facilitator, which needs no API key.

Install dependencies and start the server:

```bash
npm install
npm run dev
```

You should see:

```
Resource server:  http://localhost:4021
Paying out to:    0.0.YOUR_SELLER_ACCOUNT
Facilitator:      https://api.testnet.blocky402.com
Network:          hedera:testnet
```

**Sanity check** — in a second terminal, confirm the paywall is live:

```bash
curl -i http://localhost:4021/data/spot-price?symbol=AAPL
```

You should get back **HTTP 402** with a `payment-required` header describing
the price. That 402 is the whole point of x402 — it's the protocol working
correctly. You'll pay it in the next step, not with curl.

Keep this server running in its own terminal for the rest of the guide.

---

## 5. (Optional) Prove the payment flow works from a plain terminal first

Before wiring up the web app, you can test the full paid flow with a small
script that ships in `server/scripts/buy.ts`. This isolates any Hedera/x402
issues from any Next.js issues.

Add buyer credentials to the same `server/.env` file:

```
HEDERA_ACCOUNT_ID=0.0.YOUR_BUYER_ACCOUNT
HEDERA_PRIVATE_KEY=YOUR_BUYER_ECDSA_PRIVATE_KEY
```

Then, with the server still running, in a second terminal:

```bash
cd server
npm run buy -- spot-price AAPL
```

You should see a `402` happen internally, a payment get signed, and then a
`200` with real JSON data plus a payment header containing a Hedera
transaction id. That id is what you'll look up on HashScan later.

---

## 6. Set up and run the web app (UI + CLI)

Open a **third** terminal (leave the resource server running):

```bash
cd web
cp .env.local.example .env.local
```

Fill in `.env.local`:

```
HEDERA_ACCOUNT_ID=0.0.YOUR_BUYER_ACCOUNT
HEDERA_PRIVATE_KEY=YOUR_BUYER_ECDSA_PRIVATE_KEY
HEDERA_NETWORK=hedera:testnet
RESOURCE_SERVER_URL=http://localhost:4021
```

Install and run:

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. You'll see the title, a **UI Mode / CLI Mode**
toggle, and whichever mode is selected below it.

### UI Mode

- Type a ticker symbol (default `AAPL`).
- Click **Buy** on any of the three product cards (`spot-price`, `quote`,
  `ai-insight`).
- The button shows "Paying…" while `app/api/pay/route.ts` runs the real
  `402 → sign → pay → 200` flow against your resource server.
- On success you'll see the returned JSON and a **"View transaction on
  HashScan"** link.

### CLI Mode

- Click the **CLI Mode** tab. You get a small in-browser terminal.
- Type `help` to see commands.
- Type `catalog` to list products and prices.
- Type `buy ai-insight TSLA` (or any product + symbol) to trigger a real
  payment — this hits the exact same `/api/pay` route as the buttons above,
  just from a typed command instead of a click.

Both modes are two skins over one payment engine — that's intentional, so
the demo video can show the identical flow twice, once friendly and once
technical.

---

## 7. Get your HashScan links (required for submission)

Every successful purchase returns a Hedera transaction id in the payment
response header, and the app turns it into a link like:

```
https://hashscan.io/testnet/transaction/0.0.xxxxx@169...
```

Click that link (or the one printed by `scripts/buy.ts`) to see the real,
on-chain transfer from your buyer account to your seller account, its fee,
and its consensus timestamp. Save a few of these links — the bounty
submission form asks for them directly.

---

## 8. Record your demo (under 5 minutes)

A simple, effective recording:

1. Show `server/` running in one terminal (`npm run dev`), and mention it's
   a plain Hono API with no private key.
2. Switch to the browser, show **UI Mode**: pick a symbol, click Buy on
   `ai-insight`, show the 402 happening (open devtools Network tab if you
   want to be thorough), then the data appearing.
3. Click the HashScan link live, so viewers see the real testnet transaction.
4. Switch to **CLI Mode**, type `buy spot-price TSLA`, and narrate that it's
   the same backend, same payment logic, different front end.
5. Briefly show the code for `server/src/index.ts` (the `paymentMiddleware`
   config) and `web/lib/payClient.ts` (the `ExactHederaScheme` signer) — this
   is what judges are checking for: real x402 usage on real Hedera rails.

---

## 9. Submit

1. Push this repo to a **public** GitHub repository.
2. Make sure your `.env` / `.env.local` files are **not** committed (the
   provided `.gitignore` already excludes them — double check).
3. Upload your demo video.
4. Fill out the submission form:
   https://forms.gle/oWbifBqkvbk2oANC7
   with your repo link, video, and your HashScan transaction links.
5. Submit before **11:59 PM ET, July 31**.

---

## 10. Customizing this into something more original

The scaffold is intentionally generic (mock market data) so it installs and
runs with zero external API keys. To make it your own for the bounty, pick
one:

- **Real AI product**: in `server/src/products.ts`, replace `mockAiInsight`
  with a real call to an LLM API (OpenAI, Anthropic, etc.), gated behind the
  existing `ai-insight` x402 route. This is the strongest demo narrative —
  "an agent pays per call for real AI output, settled on Hedera."
- **New product type**: add a new entry to `CATALOG` in `products.ts`, a new
  price block in the `paymentMiddleware` config in `server/src/index.ts`,
  and a new route handler — e.g. weather, sports scores, a paywalled file
  download.
- **Autonomous agent buyer**: instead of a human clicking Buy, write a small
  script (start from `server/scripts/buy.ts`) that runs on a timer and buys
  fresh data automatically — this matches Hedera's official "agent that pays
  per query" reference architecture almost exactly.

---

## 11. Troubleshooting

- **"Missing PAY_TO_ACCOUNT" / "Missing HEDERA_ACCOUNT_ID"** — you forgot to
  fill in a `.env` or `.env.local` file, or forgot to `cp` the example file
  first.
- **402 never resolves / payment fails** — confirm your buyer account
  actually has testnet HBAR (check its balance in the Hedera portal or on
  HashScan) and that you copied an **ECDSA** private key, not ED25519 (or
  swap the `fromStringECDSA` call as noted in Step 3).
- **Module not found / type errors on `@x402/...` or `@hiero-ledger/sdk`
  packages** — these are actively evolving packages tied to a live bounty.
  Run `npm install` fresh, and if an import path has moved, check the
  package's README on npmjs.com for the current export path (the shapes of
  `x402Client`, `wrapFetchWithPayment`, `ExactHederaScheme`, and
  `createClientHederaSigner` used here reflect the published x402 docs at
  the time this project was written, but a fast-moving library can rename
  an export between versions).
- **CORS or "fetch failed" from the web app to the resource server** — make
  sure `server` is actually running on port 4021 and `RESOURCE_SERVER_URL`
  in `web/.env.local` matches. Since the payment call happens inside a
  Next.js **server-side** API route (not the browser), CORS itself isn't
  actually a factor here — a connection refused error almost always means
  the resource server isn't running.
- **Facilitator errors** — Blocky402's testnet endpoint
  (`https://api.testnet.blocky402.com`) is open access with no API key. If
  it's ever down, check https://hedera.com/discord for the current
  recommended facilitator URL, and update `FACILITATOR_URL` in
  `server/.env`.

---

## 12. Project structure reference

```
x402-hedera-demo/
├── server/
│   ├── src/
│   │   ├── index.ts        # Hono app, x402 paymentMiddleware, routes
│   │   └── products.ts     # catalog + mock data generators
│   ├── scripts/
│   │   └── buy.ts          # standalone terminal buyer, for testing
│   ├── .env.example
│   └── package.json
└── web/
    ├── app/
    │   ├── page.tsx                 # mode toggle + layout
    │   ├── layout.tsx
    │   ├── globals.css
    │   ├── components/
    │   │   ├── ModeToggle.tsx
    │   │   ├── UIMode.tsx           # button-based buying
    │   │   └── TerminalMode.tsx     # in-browser CLI buying
    │   └── api/pay/route.ts         # server-side payment endpoint
    ├── lib/
    │   └── payClient.ts             # x402 + Hedera signer, server-only
    ├── .env.local.example
    └── package.json
```

Good luck with the bounty.
