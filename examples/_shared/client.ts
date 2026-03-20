import {
  PrmissionClient,
  PrmissionErrorCode,
  PrmissionNetwork,
  prmissionError,
  type PrmissionClientConfig,
  type PrmissionError,
  type Result,
} from "prmission-sdk";
import { env } from "./env.js";

export function createClientFromEnv(): Result<PrmissionClient, PrmissionError> {
  const networkResult = parseNetwork(env("PRMISSION_NETWORK"));
  if (!networkResult.ok) return networkResult;

  const rpcUrl = env("PRMISSION_RPC_URL");
  const contractAddress = env("PRMISSION_CONTRACT_ADDRESS");

  const network = networkResult.value;

  if (network === PrmissionNetwork.BaseSepolia && !contractAddress) {
    return {
      ok: false,
      error: prmissionError(
        PrmissionErrorCode.InvalidConfig,
        "PRMISSION_CONTRACT_ADDRESS is required for PRMISSION_NETWORK=base-sepolia",
        { network }
      ),
    };
  }

  if (network === PrmissionNetwork.Custom && !rpcUrl) {
    return {
      ok: false,
      error: prmissionError(
        PrmissionErrorCode.InvalidConfig,
        "PRMISSION_RPC_URL is required for PRMISSION_NETWORK=custom",
        { network }
      ),
    };
  }

  if (network === PrmissionNetwork.Custom && !contractAddress) {
    return {
      ok: false,
      error: prmissionError(
        PrmissionErrorCode.InvalidConfig,
        "PRMISSION_CONTRACT_ADDRESS is required for PRMISSION_NETWORK=custom",
        { network }
      ),
    };
  }

  const config: PrmissionClientConfig =
    network === PrmissionNetwork.BaseMainnet
      ? {
          network,
          rpcUrl,
          contractAddress,
        }
      : network === PrmissionNetwork.BaseSepolia
        ? {
            network,
            rpcUrl,
            contractAddress: contractAddress!,
          }
        : {
            network,
            rpcUrl: rpcUrl!,
            contractAddress: contractAddress!,
            chainId: env("PRMISSION_CHAIN_ID")
              ? Number(env("PRMISSION_CHAIN_ID"))
              : undefined,
          };

  const created = PrmissionClient.create(config);
  if (!created.ok) return created;

  return created;
}

function parseNetwork(
  value: string | undefined
): Result<PrmissionNetwork, PrmissionError> {
  if (!value) return { ok: true, value: PrmissionNetwork.BaseMainnet };

  const normalized = value.trim().toLowerCase();
  if (normalized === "base-mainnet" || normalized === "base") {
    return { ok: true, value: PrmissionNetwork.BaseMainnet };
  }
  if (normalized === "base-sepolia" || normalized === "sepolia") {
    return { ok: true, value: PrmissionNetwork.BaseSepolia };
  }
  if (normalized === "custom") {
    return { ok: true, value: PrmissionNetwork.Custom };
  }

  return {
    ok: false,
    error: prmissionError(PrmissionErrorCode.InvalidConfig, "Invalid network", {
      value,
    }),
  };
}
