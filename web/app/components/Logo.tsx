// components/Logo.tsx
//
// A hand-drawn inline SVG mark (a hexagon with a cut "x" motif, echoing the
// x402/ledger subject without copying Hedera's own hashgraph icon), plus an
// optional wordmark. Used in the header and reused conceptually in
// app/icon.svg for the browser favicon.

type Props = {
  withWordmark?: boolean;
  size?: number;
};

export default function Logo({ withWordmark = true, size = 32 }: Props) {
  return (
    <span className="logo">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="logoGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#7db2ff" />
            <stop offset="1" stopColor="#2f6fed" />
          </linearGradient>
        </defs>
        <path
          d="M24 3 L43 13.5 V34.5 L24 45 L5 34.5 V13.5 Z"
          stroke="url(#logoGrad)"
          strokeWidth="2.4"
          fill="rgba(47,111,237,0.08)"
        />
        <path d="M16 16 L32 32" stroke="url(#logoGrad)" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M32 16 L16 32" stroke="url(#logoGrad)" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="24" cy="24" r="2.6" fill="#7db2ff" />
      </svg>
      {withWordmark && (
        <span className="logo-word">
          x402<span className="logo-dot">·</span>Hedera
        </span>
      )}
    </span>
  );
}
