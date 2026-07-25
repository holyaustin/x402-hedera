import type { ReactNode } from "react";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import Header from "./components/Header";
import Footer from "./components/Footer";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata = {
  title: "x402·Hedera-Agent — Autonomous Pay-Per-Call Demo",
  description:
    "An autonomous agent that buys live data one request at a time via the x402 standard, settling on Hedera testnet in HBAR or USDC — on a schedule, no human required.",
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05070b",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <div className="app-shell" id="top">
          <div className="bg-grid" aria-hidden="true" />
          <div className="bg-glow" aria-hidden="true" />
          <Header />
          <div className="app-content">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
