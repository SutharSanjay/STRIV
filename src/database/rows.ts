import type { StatementResult } from './migrate';

export function asNumber(value: unknown): number {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('Unexpected record shape');
  }
  return value;
}

export function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return asNumber(value);
}

export function asString(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Unexpected record shape');
  }
  return value;
}

export function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return asString(value);
}

export function countOf(result: StatementResult): number {
  return asNumber(result.rows[0]?.total ?? 0);
}

export function firstRow(
  result: StatementResult,
): Readonly<Record<string, unknown>> | null {
  return result.rows[0] ?? null;
}
