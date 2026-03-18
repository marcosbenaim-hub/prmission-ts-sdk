import { PrmissionClient } from "@prmission/sdk";

async function main() {
  const client = new PrmissionClient({
    rpcUrl: "https://mainnet.base.org",
    contractAddress: "0x0c8B16a57524f4009581B748356E01e1a969223d",
  });

  const permissionId = 1n;
  const permission = await client.getPermission(permissionId);

  console.log("Permission loaded successfully");
  console.log(permission);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
