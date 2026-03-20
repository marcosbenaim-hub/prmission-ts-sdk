import { ethers } from "ethers";
import {
  PrmissionClient,
  PrmissionNetwork,
  parseUsdc,
  type PrmissionClientConfig,
} from "prmission-sdk";
import { env, envBigint, requiredEnv } from "./_shared/env.js";

async function main() {
  const rpcUrl = requiredEnv("PRMISSION_RPC_URL");
  const privateKey = requiredEnv("PRIVATE_KEY");

  const config: PrmissionClientConfig = {
    network: PrmissionNetwork.BaseMainnet,
    rpcUrl,
  };

  const created = PrmissionClient.create(config);
  if (!created.ok) {
    console.error(created.error);
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const signed = created.value.withSigner(wallet);

  const merchant = env("MERCHANT_ADDRESS");
  const purpose = env("PURPOSE") ?? "consented data access";
  const dataCategory = env("DATA_CATEGORY") ?? "browsing";
  const compensationBps = Number(env("COMPENSATION_BPS") ?? "2000");
  const validityPeriod = Number(env("VALIDITY_SECONDS") ?? "86400");
  const escrowAmount = parseUsdc(env("ESCROW_USDC") ?? "1.00");

  const permissionIdOverride = env("PERMISSION_ID");
  const permissionIdResult = permissionIdOverride
    ? { ok: true as const, value: BigInt(permissionIdOverride) }
    : await signed.grantPermission({
        merchant: merchant ?? undefined,
        dataCategory,
        purpose,
        compensationBps,
        validityPeriod,
      });

  if (!permissionIdResult.ok) {
    console.error(permissionIdResult.error);
    process.exit(1);
  }

  const permissionId = permissionIdResult.value;
  console.log("permissionId:", permissionId.toString());

  const escrowIdResult = await signed.depositEscrow(
    permissionId,
    escrowAmount,
    envBigint("AGENT_ID", 0n)
  );
  if (!escrowIdResult.ok) {
    console.error(escrowIdResult.error);
    process.exit(1);
  }
  const escrowId = escrowIdResult.value;
  console.log("escrowId:", escrowId.toString());

  const reportResult = await signed.reportOutcome({
    escrowId,
    outcomeValue: escrowAmount,
    outcomeType: env("OUTCOME_TYPE") ?? "completed",
    outcomeDescription: env("OUTCOME_DESCRIPTION") ?? "example outcome",
  });
  if (!reportResult.ok) {
    console.error(reportResult.error);
    process.exit(1);
  }
  console.log("outcome reported");

  const escrow = await signed.getEscrow(escrowId);
  if (!escrow.ok) {
    console.error(escrow.error);
    process.exit(1);
  }

  if (!escrow.value.isSettleable) {
    console.log(
      "Not settleable yet. Dispute window ends at unix:",
      escrow.value.disputeWindowEnd.toString()
    );
    return;
  }

  const settleResult = await signed.settle(escrowId);
  if (!settleResult.ok) {
    console.error(settleResult.error);
    process.exit(1);
  }
  console.log("settled");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

