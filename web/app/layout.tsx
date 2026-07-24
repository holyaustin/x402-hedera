import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "x402 + Hedera Demo",
  description: "Pay-per-call data settled on Hedera testnet via the x402 standard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
