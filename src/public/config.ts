/**
 * Supported Prmission networks.
 */
export enum PrmissionNetwork {
  /** Base mainnet (chainId 8453). */
  BaseMainnet = "base-mainnet",
  /** Base Sepolia testnet (chainId 84532). */
  BaseSepolia = "base-sepolia",
  /** Custom chain/rpc for advanced usage. */
  Custom = "custom",
}

/**
 * Default Prmission Protocol contract on Base mainnet.
 *
 * This is the address referenced in the public Prmission docs and examples.
 */
export const PRMISSION_CONTRACT_BASE_MAINNET =
  "0x0c8B16a57524f4009581B748356E01e1a969223d" as const;

/**
 * Public SDK configuration used to create a Prmission client.
 *
 * The SDK is "API-first": this is the only supported configuration type.
 * Implementation-level config (provider objects, ABI details) are hidden.
 */
export type PrmissionClientConfig =
  | {
      network: PrmissionNetwork.BaseMainnet;
      /** Optional RPC URL override. If omitted, ethers defaults are used. */
      rpcUrl?: string;
      /** Optional contract override. Defaults to the known Base mainnet deployment. */
      contractAddress?: string;
    }
  | {
      network: PrmissionNetwork.BaseSepolia;
      /** Optional RPC URL override. If omitted, ethers defaults are used. */
      rpcUrl?: string;
      /** Contract address for Base Sepolia deployments. */
      contractAddress: string;
    }
  | {
      network: PrmissionNetwork.Custom;
      /** RPC URL for a custom network. */
      rpcUrl: string;
      /** Contract address for the custom deployment. */
      contractAddress: string;
      /** Optional chain id, used for metadata and validation. */
      chainId?: number;
    };

