"use client";

import { useState } from "react";
import { SYMBOLS, DEFAULT_SYMBOL } from "@/lib/symbols";

type PayResult = {
  ok: boolean;
  data?: unknown;
  paymentStatus?: string;
  hashscanUrl?: string;
  error?: string;
};

const PRODUCTS = [
  { id: "spot-price", label: "Spot Price", price: "0.01 HBAR" },
  { id: "quote", label: "Bid / Ask Quote", price: "0.02 USDC" },
  { id: "ai-insight", label: "AI Insight", price: "0.05 HBAR" },
];

const CUSTOM_VALUE = "__custom__";

export default function UIMode() {
  const [selected, setSelected] = useState(DEFAULT_SYMBOL);
  const [customSymbol, setCustomSymbol] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, PayResult>>({});

  const symbol = selected === CUSTOM_VALUE ? customSymbol.trim().toUpperCase() : selected;

  async function buy(productId: string) {
    if (!symbol) return;
    setLoadingId(productId);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: productId, symbol }),
      });
      const json = (await res.json()) as PayResult;
      setResults((prev) => ({ ...prev, [productId]: json }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [productId]: { ok: false, error: err instanceof Error ? err.message : String(err) },
      }));
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section className="ui-mode">
      <div className="symbol-picker">
        <label htmlFor="symbol-select">Symbol</label>
        <div className="symbol-picker-row">
          <select
            id="symbol-select"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {SYMBOLS.map((s) => (
              <option key={s.symbol} value={s.symbol}>
                {s.symbol} — {s.label}
              </option>
            ))}
            <option value={CUSTOM_VALUE}>Custom symbol…</option>
          </select>

          {selected === CUSTOM_VALUE && (
            <input
              className="symbol-custom-input"
              placeholder="e.g. SHOP"
              value={customSymbol}
              maxLength={10}
              onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
              aria-label="Custom ticker symbol"
            />
          )}
        </div>
      </div>

      <div className="cards">
        {PRODUCTS.map((p) => {
          const result = results[p.id];
          return (
            <div className="card" key={p.id}>
              <h3>{p.label}</h3>
              <p className="price">{p.price} · Hedera testnet</p>
              <button
                disabled={loadingId === p.id || !symbol}
                onClick={() => buy(p.id)}
              >
                {loadingId === p.id ? "Paying…" : `Buy for ${symbol || "…"}`}
              </button>

              {result?.ok && (
                <>
                  <pre className="result">{JSON.stringify(result.data, null, 2)}</pre>
                  {result.hashscanUrl && (
                    <a href={result.hashscanUrl} target="_blank" rel="noreferrer">
                      View transaction on HashScan ↗
                    </a>
                  )}
                </>
              )}

              {result && !result.ok && <p className="error">{result.error}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
