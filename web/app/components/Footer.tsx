import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-col footer-brand-col">
          <Logo size={26} />
          <p>
            A pay-per-call data demo built on the x402 standard, settling in real HBAR and
            USDC on Hedera testnet.
          </p>
        </div>

        <div className="footer-col">
          <h4>Project</h4>
          <a href="https://hedera.com/x402-bounty" target="_blank" rel="noreferrer">
            Hedera x402 bounty
          </a>
          <a href="https://docs.x402.org" target="_blank" rel="noreferrer">
            x402 protocol docs
          </a>
          <a href="https://portal.hedera.com" target="_blank" rel="noreferrer">
            Hedera developer portal
          </a>
        </div>

        <div className="footer-col">
          <h4>Verify</h4>
          <a href="https://hashscan.io/testnet" target="_blank" rel="noreferrer">
            HashScan (testnet)
          </a>
          <a href="https://faucet.circle.com" target="_blank" rel="noreferrer">
            Circle testnet USDC faucet
          </a>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>Hedera testnet only — no real funds move.</span>
        <span>Built for the Hedera x402 bounty · {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
