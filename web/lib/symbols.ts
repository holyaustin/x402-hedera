// lib/symbols.ts
//
// Shared ticker symbol list used by both UI Mode's dropdown and CLI Mode's
// quick-insert chips, so the two front ends stay in sync with one source
// of truth.

export type SymbolOption = {
  symbol: string;
  label: string;
};

export const SYMBOLS: SymbolOption[] = [
  { symbol: "AAPL", label: "Apple Inc." },
  { symbol: "MSFT", label: "Microsoft Corp." },
  { symbol: "GOOGL", label: "Alphabet Inc." },
  { symbol: "AMZN", label: "Amazon.com Inc." },
  { symbol: "NVDA", label: "NVIDIA Corp." },
  { symbol: "TSLA", label: "Tesla Inc." },
  { symbol: "META", label: "Meta Platforms Inc." },
  { symbol: "NFLX", label: "Netflix Inc." },
  { symbol: "AMD", label: "Advanced Micro Devices" },
  { symbol: "JPM", label: "JPMorgan Chase & Co." },
  { symbol: "HBAR", label: "Hedera Hashgraph" },
  { symbol: "BTC", label: "Bitcoin" },
];

export const DEFAULT_SYMBOL = SYMBOLS[0].symbol;
