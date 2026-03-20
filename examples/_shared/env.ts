/**
 * Small environment variable helpers for the examples.
 *
 * These are intentionally minimal and dependency-free.
 */

export function env(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export function requiredEnv(name: string): string {
  const value = env(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function envNumber(name: string, fallback: number): number {
  const value = env(name);
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid number for environment variable ${name}: ${value}`);
  }
  return parsed;
}

export function envBigint(name: string, fallback: bigint): bigint {
  const value = env(name);
  if (!value) return fallback;
  try {
    return BigInt(value);
  } catch {
    throw new Error(`Invalid bigint for environment variable ${name}: ${value}`);
  }
}

