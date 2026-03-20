import { createClientFromEnv } from "./_shared/client.js";

async function main() {
  const created = createClientFromEnv();
  if (!created.ok) {
    console.error(created.error);
    process.exit(1);
  }

  const client = created.value;
  console.log("Network:", client.network);
  console.log("Contract:", client.contractAddress);

  const treasury = await client.getTreasury();
  if (!treasury.ok) {
    console.error(treasury.error);
    process.exit(1);
  }
  console.log("Treasury:", treasury.value);

  const fees = await client.getTotalProtocolFees();
  if (!fees.ok) {
    console.error(fees.error);
    process.exit(1);
  }
  console.log("Total protocol fees (USDC):", fees.value.formatted);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

