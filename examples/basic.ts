import { PrmissionClient } from "@prmission/sdk";
import { ethers } from "ethers";

async function main() {
  const client = new PrmissionClient({
    rpcUrl: "https://mainnet.base.org",
    contractAddress: "0x0c8B16a57524f4009581B748356E01e1a969223d",
  });

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, client.provider);
  client.connect(wallet);

  const fee = await client.getProtocolFeeBps();
  console.log("Protocol fee (bps):", fee.toString());
}

main();
