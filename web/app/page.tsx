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
        <span className="eyebrow">Hedera testnet · x402 protocol · Autonomous agent</span>
        <h1>An agent that pays as it goes.</h1>
        <p className="sub">
          Every request below is metered by the x402 standard: an HTTP 402 is issued, a
          payment is signed and settled on Hedera testnet — in HBAR or USDC — and the data
          is returned. The same agent also buys on its own daily schedule with no human
          involved — see the <a href="/receipts">receipts ledger</a> for proof.
        </p>
      </section>

      <ModeToggle mode={mode} onChange={setMode} />

      {mode === "ui" ? <UIMode /> : <TerminalMode />}
    </main>
  );
}