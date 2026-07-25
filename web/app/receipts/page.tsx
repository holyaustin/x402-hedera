// app/receipts/page.tsx
//
// A payment ledger with no database behind it — it queries Hedera's public
// testnet mirror node directly for every incoming transfer to the seller
// account (PAY_TO_ACCOUNT), server-side, on every page load. The blockchain
// IS the ledger; this page just renders it.

export const revalidate = 30; // re-fetch at most every 30s

type MirrorTransaction = {
  transaction_id: string;
  consensus_timestamp: string;
  result: string;
  name: string;
};

async function getTransactions(accountId: string): Promise<MirrorTransaction[]> {
  const url = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}/transactions?transactiontype=cryptotransfer&limit=25&order=desc`;
  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) return [];
  const json = await res.json();
  return json.transactions ?? [];
}

function formatTimestamp(consensusTimestamp: string) {
  const seconds = Number(consensusTimestamp.split(".")[0]);
  return new Date(seconds * 1000).toLocaleString();
}

export default async function ReceiptsPage() {
  const payTo = process.env.PAY_TO_ACCOUNT;

  if (!payTo) {
    return (
      <main className="wrap">
        <p className="error">PAY_TO_ACCOUNT is not configured on this deployment.</p>
      </main>
    );
  }

  const transactions = await getTransactions(payTo);

  return (
    <main className="wrap">
      <section className="hero">
        <span className="eyebrow">Live from the Hedera testnet mirror node</span>
        <h1>Payment receipts</h1>
        <p className="sub">
          Every incoming transfer to the seller account <code>{payTo}</code>, read directly
          from Hedera — no database, no app-level logging. The ledger is the chain itself.
        </p>
      </section>

      <div className="receipts-table-wrap">
        <table className="receipts-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Transaction ID</th>
              <th>Result</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.transaction_id}>
                <td>{formatTimestamp(tx.consensus_timestamp)}</td>
                <td className="mono">{tx.transaction_id}</td>
                <td>{tx.result}</td>
                <td>
                  <a href={`https://hashscan.io/testnet/transaction/${tx.transaction_id}`} target="_blank" rel="noreferrer">
                    HashScan ↗
                  </a>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={4}>No transactions found yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="receipts-footnote">
        Full account history:{" "}
        <a href={`https://hashscan.io/testnet/account/${payTo}/operations`} target="_blank" rel="noreferrer">
          hashscan.io/testnet/account/{payTo}/operations ↗
        </a>
      </p>
    </main>
  );
}