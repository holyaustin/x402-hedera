// scripts/associate.ts
//
// One-time helper: associates your buyer account with a Hedera Token
// Service (HTS) token so it's able to hold/send that token. This is ONLY
// needed for the USDC-priced product(s) in this demo — native HBAR needs
// no association at all.
//
// Usage (from the server/ folder):
//   npx tsx scripts/associate.ts                # associates with Hedera testnet USDC
//   npx tsx scripts/associate.ts 0.0.SOMETOKEN  # associate with a different token

import "dotenv/config";
import { Client, AccountId, PrivateKey, TokenAssociateTransaction } from "@hiero-ledger/sdk";

const HEDERA_TESTNET_USDC = "0.0.429274";

async function main() {
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  if (!accountId || !privateKey) {
    console.error("Set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY in server/.env (your buyer account).");
    process.exit(1);
  }

  const tokenId = process.argv[2] ?? HEDERA_TESTNET_USDC;

  const account = AccountId.fromString(accountId);
  const key = PrivateKey.fromStringECDSA(privateKey);
  const client = Client.forTestnet().setOperator(account, key);

  console.log(`Associating account ${accountId} with token ${tokenId} ...`);

  const tx = await new TokenAssociateTransaction()
    .setAccountId(account)
    .setTokenIds([tokenId])
    .freezeWith(client)
    .sign(key);

  const submit = await tx.execute(client);
  const receipt = await submit.getReceipt(client);

  console.log("Association status:", receipt.status.toString());
  console.log("Done. This account can now hold/send that token.");
  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
