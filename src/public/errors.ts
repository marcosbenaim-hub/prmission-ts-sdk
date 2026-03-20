/**
 * Enumerated error codes returned by the SDK.
 *
 * These codes are stable identifiers intended for programmatic handling.
 */
export enum PrmissionErrorCode {
  /** Configuration was missing required values or contained invalid values. */
  InvalidConfig = "INVALID_CONFIG",
  /** A write operation was attempted without a connected signer. */
  NoSigner = "NO_SIGNER",
  /** The RPC request failed (network, rate limit, upstream error). */
  RpcCallFailed = "RPC_CALL_FAILED",
  /** A transaction failed (revert, dropped, insufficient funds). */
  TransactionFailed = "TRANSACTION_FAILED",
  /** A required on-chain event was not found in a transaction receipt. */
  EventNotFound = "EVENT_NOT_FOUND",
  /** Fallback bucket when the SDK cannot classify the underlying error. */
  Unknown = "UNKNOWN",
}

/**
 * Structured SDK error returned inside `Result` failures.
 */
export interface PrmissionError {
  /** Stable, enumerated error code. */
  code: PrmissionErrorCode;
  /** Human-readable description of what went wrong. */
  message: string;
  /** Optional machine-readable context (inputs, operation name, ids). */
  context?: Record<string, unknown>;
  /** Optional underlying cause, preserved for debugging. */
  cause?: unknown;
}

/** Create a PrmissionError. */
export function prmissionError(
  code: PrmissionErrorCode,
  message: string,
  context?: Record<string, unknown>,
  cause?: unknown
): PrmissionError {
  return { code, message, context, cause };
}

