import { envBigint } from "./_shared/env.js";
import { createClientFromEnv } from "./_shared/client.js";

async function main() {
  const created = createClientFromEnv();
  if (!created.ok) {
    console.error(created.error);
    process.exit(1);
  }
  const client = created.value;

  const escrowId = envBigint("ESCROW_ID", 1n);
  const escrow = await client.getEscrow(escrowId);
  if (!escrow.ok) {
    console.error(escrow.error);
    process.exit(1);
  }

  console.log(escrow.value);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

