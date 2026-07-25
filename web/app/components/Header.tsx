"use client";

import Logo from "./Logo";

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a href="#top" className="header-brand" aria-label="x402·Hedera-Agent, home">
          <Logo />
        </a>

        <nav className="header-nav" aria-label="Primary">
          <a href="/receipts">Receipts</a>
          <a href="https://hedera.com/x402-bounty" target="_blank" rel="noreferrer">Bounty</a>
          <a href="https://docs.x402.org" target="_blank" rel="noreferrer">x402 Docs</a>
          <a href="https://hashscan.io/testnet" target="_blank" rel="noreferrer" className="header-cta">HashScan ↗</a>
        </nav>
      </div>
      <div className="header-pulse-track" aria-hidden="true">
        <span className="header-pulse-dot" />
      </div>
    </header>
  );
}