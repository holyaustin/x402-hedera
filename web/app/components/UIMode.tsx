"use client";

import { useState } from "react";

type PayResult = {
  ok: boolean;
  data?: unknown;
  paymentStatus?: string;
  hashscanUrl?: string;
  error?: string;
};

const PRODUCTS = [
  { id: "spot-price", label: "Spot Price", price: "$0.01" },
  { id: "quote", label: "Bid / Ask Quote", price: "$0.02" },
  { id: "ai-insight", label: "AI Insight", price: "$0.05" },
];

export default function UIMode() {
  const [symbol, setSymbol] = useState("AAPL");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, PayResult>>({});

  async function buy(productId: string) {
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
      <label className="symbol-input">
        Symbol
        <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} maxLength={10} />
      </label>

      <div className="cards">
        {PRODUCTS.map((p) => {
          const result = results[p.id];
          return (
            <div className="card" key={p.id}>
              <h3>{p.label}</h3>
              <p className="price">{p.price} · settled in HBAR</p>
              <button disabled={loadingId === p.id} onClick={() => buy(p.id)}>
                {loadingId === p.id ? "Paying…" : "Buy"}
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
