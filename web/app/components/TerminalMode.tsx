"use client";

import { useEffect, useRef, useState } from "react";
import { SYMBOLS } from "@/lib/symbols";

type Line = { text: string; kind: "cmd" | "out" | "err" };

const HELP = `Available commands:
  help                        show this message
  catalog                     list products and prices
  symbols                     list quick-insert ticker symbols
  buy <product> <symbol>      pay for a product, e.g. "buy spot-price AAPL"
  clear                       clear the screen`;

const CATALOG_TEXT = [
  "spot-price   0.01 HBAR   latest mock spot price",
  "quote        0.02 USDC   mock bid/ask quote",
  "ai-insight   0.05 HBAR   AI-style market note",
].join("\n");

const SYMBOLS_TEXT = SYMBOLS.map((s) => `${s.symbol.padEnd(6)} ${s.label}`).join("\n");

export default function TerminalMode() {
  const [lines, setLines] = useState<Line[]>([
    { text: "x402 CLI — type 'help' to get started", kind: "out" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  function print(text: string, kind: Line["kind"] = "out") {
    setLines((prev) => [...prev, { text, kind }]);
  }

  function insertSymbol(symbol: string) {
    setInput((prev) => {
      const parts = prev.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return `buy spot-price ${symbol} `;
      if (parts.length === 1) return `${parts[0]} spot-price ${symbol} `;
      parts[2] = symbol;
      return `${parts.slice(0, 3).join(" ")} `;
    });
    inputRef.current?.focus();
  }

  async function runCommand(raw: string) {
    const cmd = raw.trim();
    if (!cmd) return;
    print(`$ ${cmd}`, "cmd");

    const [name, ...args] = cmd.split(/\s+/);

    switch (name) {
      case "help":
        print(HELP);
        return;
      case "clear":
        setLines([]);
        return;
      case "catalog":
        print(CATALOG_TEXT);
        return;
      case "symbols":
        print(SYMBOLS_TEXT);
        return;
      case "buy": {
        const [product, symbol = "AAPL"] = args;
        if (!product) {
          print("usage: buy <product> <symbol>", "err");
          return;
        }
        setBusy(true);
        print(`requesting ${product} for ${symbol.toUpperCase()} ...`);
        try {
          const res = await fetch("/api/pay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product, symbol }),
          });
          const json = await res.json();
          if (!json.ok) {
            print(`error: ${json.error ?? "request failed"}`, "err");
          } else {
            print(`402 Payment Required -> signed -> paid (${json.paymentStatus ?? "settled"})`);
            print(JSON.stringify(json.data, null, 2));
            if (json.hashscanUrl) print(`HashScan: ${json.hashscanUrl}`);
          }
        } catch (err) {
          print(err instanceof Error ? err.message : String(err), "err");
        } finally {
          setBusy(false);
        }
        return;
      }
      default:
        print(`command not found: ${name} (try 'help')`, "err");
    }
  }

  return (
    <section className="terminal-wrap">
      <div className="symbol-chips" role="group" aria-label="Quick-insert symbols">
        {SYMBOLS.slice(0, 8).map((s) => (
          <button key={s.symbol} type="button" onClick={() => insertSymbol(s.symbol)}>
            {s.symbol}
          </button>
        ))}
      </div>

      <div className="terminal" onClick={() => inputRef.current?.focus()}>
        <div className="terminal-body">
          {lines.map((line, i) => (
            <div key={i} className={`line ${line.kind}`}>
              {line.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <form
          className="terminal-input"
          onSubmit={(e) => {
            e.preventDefault();
            if (busy) return;
            const value = input;
            setInput("");
            runCommand(value);
          }}
        >
          <span className="prompt">$</span>
          <input
            ref={inputRef}
            autoFocus
            value={input}
            disabled={busy}
            onChange={(e) => setInput(e.target.value)}
            placeholder="buy ai-insight TSLA"
            spellCheck={false}
          />
        </form>
      </div>
    </section>
  );
}
