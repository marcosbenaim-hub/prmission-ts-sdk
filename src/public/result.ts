/**
 * Result type used throughout the public SDK API surface.
 *
 * Prefer returning `Result` over throwing so callers can handle failures
 * predictably without relying on exception control flow.
 */
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/** Construct an ok Result. */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/** Construct an err Result. */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/** Type guard for ok Results. */
export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

/** Type guard for err Results. */
export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}

