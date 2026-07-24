"use client";

import { useState } from "react";
import ModeToggle, { type Mode } from "./components/ModeToggle";
import UIMode from "./components/UIMode";
import TerminalMode from "./components/TerminalMode";

export default function Home() {
  const [mode, setMode] = useState<Mode>("ui");

  return (
    <main className="wrap">
      <header>
        <h1>x402 on Hedera</h1>
        <p className="sub">
          Pay-per-call data, settled on Hedera testnet in seconds for fractions of a cent.
        </p>
      </header>

      <ModeToggle mode={mode} onChange={setMode} />

      {mode === "ui" ? <UIMode /> : <TerminalMode />}
    </main>
  );
}
