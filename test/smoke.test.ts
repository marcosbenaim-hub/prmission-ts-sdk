import { PrmissionClient, PrmissionNetwork } from "prmission-sdk";

const created = PrmissionClient.create({ network: PrmissionNetwork.BaseMainnet });
if (!created.ok) {
  console.error(created.error);
  process.exit(1);
}

console.log("SDK test OK");
