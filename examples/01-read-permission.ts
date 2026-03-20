import { envBigint } from "./_shared/env.js";
import { createClientFromEnv } from "./_shared/client.js";

async function main() {
  const created = createClientFromEnv();
  if (!created.ok) {
    console.error(created.error);
    process.exit(1);
  }
  const client = created.value;

  const permissionId = envBigint("PERMISSION_ID", 1n);
  const permission = await client.getPermission(permissionId);
  if (!permission.ok) {
    console.error(permission.error);
    process.exit(1);
  }

  console.log(permission.value);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

