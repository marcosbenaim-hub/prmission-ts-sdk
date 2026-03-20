import { ethers } from "ethers";
import { PrmissionClientCore } from "../client.js";
import type {
  AccessCheck,
  AgentTrustProfile,
  EscrowDetails,
  PermissionDetails,
  PrmissionConfig,
  SettlementPreview,
} from "../types.js";
import {
  PRMISSION_CONTRACT_BASE_MAINNET,
  PrmissionNetwork,
  type PrmissionClientConfig,
} from "./config.js";
import {
  PrmissionErrorCode,
  type PrmissionError,
  prmissionError,
} from "./errors.js";
import { err, ok, type Result } from "./result.js";

/**
 * Read-only Prmission SDK client.
 *
 * This client can perform all read operations without a signer. To perform
 * write operations (transactions), use `client.withSigner(signer)`.
 *
 * The public API returns `Result` values instead of throwing so errors are
 * explicit and easy to handle.
 */
export class PrmissionClient {
  /** Target network. */
  public readonly network: PrmissionNetwork;
  /** Prmission contract address. */
  public readonly contractAddress: string;
  /** Optional chain id for the target network. */
  public readonly chainId?: number;

  protected readonly core: PrmissionClientCore;
  protected readonly coreConfig: PrmissionConfig;

  /**
   * Create a Prmission client.
   *
   * This performs lightweight config validation and returns a `Result` so
   * consumers don't need try/catch during initialization.
   */
  public static create(
    config: PrmissionClientConfig
  ): Result<PrmissionClient, PrmissionError> {
    const normalized = normalizeConfig(config);
    if (!normalized.ok) return normalized;

    const client = new PrmissionClient(
      config.network,
      normalized.value.contractAddress,
      normalized.value.chainId,
      normalized.value
    );
    return ok(client);
  }

  protected constructor(
    network: PrmissionNetwork,
    contractAddress: string,
    chainId: number | undefined,
    coreConfig: PrmissionConfig
  ) {
    this.network = network;
    this.contractAddress = contractAddress;
    this.chainId = chainId;
    this.coreConfig = coreConfig;
    this.core = new PrmissionClientCore(coreConfig);
  }

  /**
   * Return a new client instance with a connected signer for write operations.
   *
   * This method is immutable: it does not mutate the current client instance.
   */
  public withSigner(signer: ethers.Signer): PrmissionWriteClient {
    return PrmissionWriteClient.fromCoreConfig(
      this.network,
      this.contractAddress,
      this.chainId,
      this.coreConfig,
      signer
    );
  }

  /** Get a single permission with enriched metadata. */
  public async getPermission(
    permissionId: bigint
  ): Promise<Result<PermissionDetails, PrmissionError>> {
    return this.safeCall("getPermission", { permissionId: permissionId.toString() }, () =>
      this.core.getPermission(permissionId)
    );
  }

  /** Get all permission IDs for a user. */
  public async getUserPermissionIds(
    user: string
  ): Promise<Result<bigint[], PrmissionError>> {
    return this.safeCall("getUserPermissionIds", { user }, () =>
      this.core.getUserPermissionIds(user)
    );
  }

  /** Get all permissions for a user, fully resolved. */
  public async getUserPermissions(
    user: string
  ): Promise<Result<PermissionDetails[], PrmissionError>> {
    return this.safeCall("getUserPermissions", { user }, () =>
      this.core.getUserPermissions(user)
    );
  }

  /** Get only active permissions for a user. */
  public async getActivePermissions(
    user: string
  ): Promise<Result<PermissionDetails[], PrmissionError>> {
    return this.safeCall("getActivePermissions", { user }, () =>
      this.core.getActivePermissions(user)
    );
  }

  /** Check access for an agent on a permission. */
  public async checkAccess(
    permissionId: bigint,
    agent: string
  ): Promise<Result<AccessCheck, PrmissionError>> {
    return this.safeCall(
      "checkAccess",
      { permissionId: permissionId.toString(), agent },
      () => this.core.checkAccess(permissionId, agent)
    );
  }

  /** Get escrow details with enriched metadata. */
  public async getEscrow(
    escrowId: bigint
  ): Promise<Result<EscrowDetails, PrmissionError>> {
    return this.safeCall("getEscrow", { escrowId: escrowId.toString() }, () =>
      this.core.getEscrow(escrowId)
    );
  }

  /** Preview settlement amounts before settling. */
  public async previewSettlement(
    escrowId: bigint
  ): Promise<Result<SettlementPreview, PrmissionError>> {
    return this.safeCall(
      "previewSettlement",
      { escrowId: escrowId.toString() },
      () => this.core.previewSettlement(escrowId)
    );
  }

  /** Check an agent's trust profile (ERC-8004). */
  public async checkAgentTrust(
    agentId: bigint,
    agentAddress: string
  ): Promise<Result<AgentTrustProfile, PrmissionError>> {
    return this.safeCall(
      "checkAgentTrust",
      { agentId: agentId.toString(), agentAddress },
      () => this.core.checkAgentTrust(agentId, agentAddress)
    );
  }

  /** Get the list of trusted reviewer addresses. */
  public async getTrustedReviewers(): Promise<Result<string[], PrmissionError>> {
    return this.safeCall("getTrustedReviewers", undefined, () =>
      this.core.getTrustedReviewers()
    );
  }

  /** Check whether identity enforcement is currently active. */
  public async isIdentityEnforced(): Promise<Result<boolean, PrmissionError>> {
    return this.safeCall("isIdentityEnforced", undefined, () =>
      this.core.isIdentityEnforced()
    );
  }

  /** Check whether reputation gating is currently active. */
  public async isReputationEnforced(): Promise<Result<boolean, PrmissionError>> {
    return this.safeCall("isReputationEnforced", undefined, () =>
      this.core.isReputationEnforced()
    );
  }

  /** Get total protocol fees collected (lifetime). */
  public async getTotalProtocolFees(): Promise<
    Result<{ raw: bigint; formatted: string }, PrmissionError>
  > {
    return this.safeCall("getTotalProtocolFees", undefined, () =>
      this.core.getTotalProtocolFees()
    );
  }

  /** Get the protocol treasury address. */
  public async getTreasury(): Promise<Result<string, PrmissionError>> {
    return this.safeCall("getTreasury", undefined, () => this.core.getTreasury());
  }

  /** Get USDC balance for an address. */
  public async getBalance(address: string): Promise<Result<bigint, PrmissionError>> {
    return this.safeCall("getBalance", { address }, () => this.core.getBalance(address));
  }

  protected async safeCall<T>(
    operation: string,
    context: Record<string, unknown> | undefined,
    fn: () => Promise<T>
  ): Promise<Result<T, PrmissionError>> {
    try {
      return ok(await fn());
    } catch (cause: unknown) {
      const error = classifyError(operation, context, cause);
      return err(error);
    }
  }
}

/**
 * Write-enabled Prmission SDK client.
 *
 * This client performs state-changing operations on-chain (transactions).
 * Construct it from a read-only client via `client.withSigner(signer)`.
 */
export class PrmissionWriteClient extends PrmissionClient {
  private readonly signer: ethers.Signer;

  private constructor(
    network: PrmissionNetwork,
    contractAddress: string,
    chainId: number | undefined,
    coreConfig: PrmissionConfig,
    signer: ethers.Signer
  ) {
    super(network, contractAddress, chainId, coreConfig);
    this.signer = signer;
    this.core.connect(signer);
  }

  /** @internal */
  public static fromCoreConfig(
    network: PrmissionNetwork,
    contractAddress: string,
    chainId: number | undefined,
    coreConfig: PrmissionConfig,
    signer: ethers.Signer
  ): PrmissionWriteClient {
    return new PrmissionWriteClient(
      network,
      contractAddress,
      chainId,
      coreConfig,
      signer
    );
  }

  /**
   * Ensure the contract has sufficient USDC allowance for the requested amount.
   * Returns `true` when an approval transaction was submitted.
   */
  public async ensureAllowance(
    amount: bigint
  ): Promise<Result<boolean, PrmissionError>> {
    return this.safeCall(
      "ensureAllowance",
      { amount: amount.toString() },
      () => this.core.ensureAllowance(amount)
    );
  }

  /** Grant a new data-sharing permission. */
  public async grantPermission(params: {
    merchant?: string;
    dataCategory: string;
    purpose: string;
    compensationBps: number;
    upfrontFee?: bigint;
    validityPeriod: number;
  }): Promise<Result<bigint, PrmissionError>> {
    return this.safeCall(
      "grantPermission",
      {
        merchant: params.merchant,
        dataCategory: params.dataCategory,
        purpose: params.purpose,
      },
      () => this.core.grantPermission(params)
    );
  }

  /** Revoke an active permission. Only the permission owner can call this. */
  public async revokePermission(
    permissionId: bigint
  ): Promise<Result<void, PrmissionError>> {
    return this.safeCall(
      "revokePermission",
      { permissionId: permissionId.toString() },
      () => this.core.revokePermission(permissionId)
    );
  }

  /** Expire a permission that has passed its validity period. */
  public async expirePermission(
    permissionId: bigint
  ): Promise<Result<void, PrmissionError>> {
    return this.safeCall(
      "expirePermission",
      { permissionId: permissionId.toString() },
      () => this.core.expirePermission(permissionId)
    );
  }

  /**
   * Deposit escrow to access user data.
   *
   * Automatically handles USDC approval if needed.
   */
  public async depositEscrow(
    permissionId: bigint,
    amount: bigint,
    agentId?: bigint
  ): Promise<Result<bigint, PrmissionError>> {
    return this.safeCall(
      "depositEscrow",
      { permissionId: permissionId.toString(), amount: amount.toString() },
      () => this.core.depositEscrow(permissionId, amount, agentId)
    );
  }

  /** Report the outcome of a data access (agent only). */
  public async reportOutcome(params: {
    escrowId: bigint;
    outcomeValue: bigint;
    outcomeType: string;
    outcomeDescription: string;
  }): Promise<Result<void, PrmissionError>> {
    return this.safeCall(
      "reportOutcome",
      { escrowId: params.escrowId.toString(), outcomeType: params.outcomeType },
      () => this.core.reportOutcome(params)
    );
  }

  /** File a dispute during the dispute window. */
  public async disputeSettlement(
    escrowId: bigint,
    reason: string
  ): Promise<Result<void, PrmissionError>> {
    return this.safeCall(
      "disputeSettlement",
      { escrowId: escrowId.toString() },
      () => this.core.disputeSettlement(escrowId, reason)
    );
  }

  /** Settle an escrow after the dispute window closes. */
  public async settle(escrowId: bigint): Promise<Result<void, PrmissionError>> {
    return this.safeCall("settle", { escrowId: escrowId.toString() }, () =>
      this.core.settle(escrowId)
    );
  }

  /** Refund escrow (revoked permissions or resolved disputes). */
  public async refundEscrow(
    escrowId: bigint
  ): Promise<Result<void, PrmissionError>> {
    return this.safeCall("refundEscrow", { escrowId: escrowId.toString() }, () =>
      this.core.refundEscrow(escrowId)
    );
  }
}

function normalizeConfig(
  config: PrmissionClientConfig
): Result<PrmissionConfig, PrmissionError> {
  const chainId =
    config.network === PrmissionNetwork.BaseMainnet
      ? 8453
      : config.network === PrmissionNetwork.BaseSepolia
        ? 84532
        : config.chainId;

  const contractAddress =
    config.network === PrmissionNetwork.BaseMainnet
      ? config.contractAddress ?? PRMISSION_CONTRACT_BASE_MAINNET
      : config.contractAddress;

  if (!ethers.isAddress(contractAddress)) {
    return err(
      prmissionError(
        PrmissionErrorCode.InvalidConfig,
        "Invalid contract address",
        { contractAddress }
      )
    );
  }

  if (config.network === PrmissionNetwork.Custom && !config.rpcUrl) {
    return err(
      prmissionError(
        PrmissionErrorCode.InvalidConfig,
        "rpcUrl is required for a custom network",
        { network: config.network }
      )
    );
  }

  const rpcUrl =
    config.network === PrmissionNetwork.BaseMainnet
      ? config.rpcUrl ?? "https://mainnet.base.org"
      : config.rpcUrl;

  return ok({
    contractAddress: ethers.getAddress(contractAddress),
    rpcUrl,
    chainId,
  });
}

function classifyError(
  operation: string,
  context: Record<string, unknown> | undefined,
  cause: unknown
): PrmissionError {
  const maybeAny = cause as { code?: unknown; message?: unknown };
  const message =
    typeof maybeAny?.message === "string" ? maybeAny.message : "Unknown error";

  const lower = message.toLowerCase();
  if (lower.includes("no signer")) {
    return prmissionError(
      PrmissionErrorCode.NoSigner,
      message,
      { operation, ...context },
      cause
    );
  }

  if (lower.includes("event") && lower.includes("not found")) {
    return prmissionError(
      PrmissionErrorCode.EventNotFound,
      message,
      { operation, ...context },
      cause
    );
  }

  const code = typeof maybeAny?.code === "string" ? maybeAny.code : undefined;
  if (
    code &&
    (code.includes("NETWORK") ||
      code.includes("SERVER") ||
      code.includes("TIMEOUT"))
  ) {
    return prmissionError(
      PrmissionErrorCode.RpcCallFailed,
      message,
      { operation, ...context, ethersCode: code },
      cause
    );
  }

  if (
    code &&
    (code.includes("CALL_EXCEPTION") ||
      code.includes("INSUFFICIENT_FUNDS") ||
      code.includes("TRANSACTION"))
  ) {
    return prmissionError(
      PrmissionErrorCode.TransactionFailed,
      message,
      { operation, ...context, ethersCode: code },
      cause
    );
  }

  return prmissionError(
    PrmissionErrorCode.Unknown,
    message,
    { operation, ...context, ethersCode: code },
    cause
  );
}
