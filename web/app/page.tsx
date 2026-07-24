"use client";

import { useState } from "react";
import ModeToggle, { type Mode } from "./components/ModeToggle";
import UIMode from "./components/UIMode";
import TerminalMode from "./components/TerminalMode";

export default function Home() {
  const [mode, setMode] = useState<Mode>("ui");

  return (
    <main className="wrap">
      <section className="hero">
        <span className="eyebrow">Hedera testnet · x402 protocol</span>
        <h1>Pay per call. Settle on Hedera.</h1>
        <p className="sub">
          Every request below is metered by the x402 standard: an HTTP 402 is issued, a
          payment is signed and settled on Hedera testnet — in HBAR or USDC — and the data
          is returned. No accounts, no subscriptions, no invoices.
        </p>
      </section>

      <ModeToggle mode={mode} onChange={setMode} />

      {mode === "ui" ? <UIMode /> : <TerminalMode />}
    </main>
  );
}
