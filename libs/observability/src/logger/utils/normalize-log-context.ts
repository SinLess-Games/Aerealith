// libs/observability/src/logger/utils/normalize-log-context.ts

import type {
  LogContext,
  LogRecordContext,
  LogValue,
} from '@aerealith-ai/core';
import { redact } from '@aerealith-ai/utils';

const DEFAULT_MAX_DEPTH = 10;
const DEFAULT_MAX_COLLECTION_SIZE = 1000;

const CIRCULAR_REFERENCE_MARKER = '[Circular]';
const MAX_DEPTH_MARKER = '[Maximum depth exceeded]';
const UNREADABLE_VALUE_MARKER = '[Unreadable value]';

/**
 * Converts unprocessed logger context into a normalized, redacted, and
 * serializable record.
 */
export function normalizeLogContext(
  context: LogContext | undefined,
  maxDepth = DEFAULT_MAX_DEPTH,
  maxCollectionSize = DEFAULT_MAX_COLLECTION_SIZE,
): LogRecordContext {
  if (context === undefined) {
    return {};
  }

  const normalized = normalizeObject(
    context,
    0,
    maxDepth,
    maxCollectionSize,
    new WeakSet<object>(),
  );

  const redacted = redact(normalized);

  return isLogRecordContext(redacted) ? redacted : {};
}

function normalizeValue(
  value: unknown,
  depth: number,
  maxDepth: number,
  maxCollectionSize: number,
  ancestors: WeakSet<object>,
): LogValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return normalizePrimitive(value);
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'symbol') {
    return value.description === undefined
      ? '[Symbol]'
      : `[Symbol: ${value.description}]`;
  }

  if (typeof value === 'function') {
    return value.name.length === 0
      ? '[Anonymous function]'
      : `[Function: ${value.name}]`;
  }

  if (typeof value !== 'object') {
    return undefined;
  }

  if (depth >= maxDepth) {
    return MAX_DEPTH_MARKER;
  }

  if (ancestors.has(value)) {
    return CIRCULAR_REFERENCE_MARKER;
  }

  ancestors.add(value);

  try {
    return normalizeObjectValue(
      value,
      depth,
      maxDepth,
      maxCollectionSize,
      ancestors,
    );
  } finally {
    ancestors.delete(value);
  }
}

function normalizeObjectValue(
  value: object,
  depth: number,
  maxDepth: number,
  maxCollectionSize: number,
  ancestors: WeakSet<object>,
): LogValue {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString();
  }

  if (value instanceof URL) {
    return value.toString();
  }

  if (value instanceof RegExp) {
    return value.toString();
  }

  if (value instanceof Error) {
    return normalizeError(value, depth, maxDepth, maxCollectionSize, ancestors);
  }

  if (Array.isArray(value)) {
    return normalizeArray(value, depth, maxDepth, maxCollectionSize, ancestors);
  }

  if (value instanceof Map) {
    return normalizeMap(value, depth, maxDepth, maxCollectionSize, ancestors);
  }

  if (value instanceof Set) {
    return normalizeArray(
      Array.from(value),
      depth,
      maxDepth,
      maxCollectionSize,
      ancestors,
    );
  }

  if (ArrayBuffer.isView(value)) {
    return Array.from(
      new Uint8Array(value.buffer, value.byteOffset, value.byteLength),
    );
  }

  if (value instanceof ArrayBuffer) {
    return Array.from(new Uint8Array(value));
  }

  return normalizeObject(
    value as Readonly<Record<string, unknown>>,
    depth,
    maxDepth,
    maxCollectionSize,
    ancestors,
  );
}

function normalizePrimitive(
  value: string | number | boolean,
): string | number | boolean {
  if (typeof value !== 'number') {
    return value;
  }

  if (Number.isNaN(value)) {
    return 'NaN';
  }

  if (value === Number.POSITIVE_INFINITY) {
    return 'Infinity';
  }

  if (value === Number.NEGATIVE_INFINITY) {
    return '-Infinity';
  }

  return value;
}

function normalizeArray(
  values: readonly unknown[],
  depth: number,
  maxDepth: number,
  maxCollectionSize: number,
  ancestors: WeakSet<object>,
): readonly LogValue[] {
  const normalized: LogValue[] = [];
  const limit = Math.min(values.length, maxCollectionSize);

  for (let index = 0; index < limit; index += 1) {
    const value = normalizeValue(
      values[index],
      depth + 1,
      maxDepth,
      maxCollectionSize,
      ancestors,
    );

    if (value !== undefined) {
      normalized.push(value);
    }
  }

  if (values.length > maxCollectionSize) {
    normalized.push(
      `[Truncated ${values.length - maxCollectionSize} collection entries]`,
    );
  }

  return normalized;
}

function normalizeMap(
  value: ReadonlyMap<unknown, unknown>,
  depth: number,
  maxDepth: number,
  maxCollectionSize: number,
  ancestors: WeakSet<object>,
): LogValue {
  const entries = Array.from(value.entries());

  const allKeysAreStrings = entries.every(
    ([entryKey]) => typeof entryKey === 'string',
  );

  if (!allKeysAreStrings) {
    return normalizeArray(
      entries.map(([entryKey, entryValue]) => ({
        key: entryKey,
        value: entryValue,
      })),
      depth,
      maxDepth,
      maxCollectionSize,
      ancestors,
    );
  }

  const record: Record<string, unknown> = {};

  for (const [entryKey, entryValue] of entries) {
    record[normalizeMapKey(entryKey)] = entryValue;
  }

  return normalizeObject(record, depth, maxDepth, maxCollectionSize, ancestors);
}

function normalizeMapKey(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'symbol') return value.description ?? '[Symbol]';
  if (typeof value === 'function') return value.name || '[Function]';

  try {
    return JSON.stringify(value) ?? '[Object]';
  } catch {
    return UNREADABLE_VALUE_MARKER;
  }
}

function normalizeObject(
  value: Readonly<Record<string, unknown>>,
  depth: number,
  maxDepth: number,
  maxCollectionSize: number,
  ancestors: WeakSet<object>,
): LogRecordContext {
  const normalized: Record<string, LogValue> = {};
  const keys = Object.keys(value).sort((left, right) =>
    left.localeCompare(right),
  );
  const limit = Math.min(keys.length, maxCollectionSize);

  for (let index = 0; index < limit; index += 1) {
    const key = keys[index];

    if (key === undefined) {
      continue;
    }

    const propertyValue = readProperty(value, key);
    const normalizedValue = normalizeValue(
      propertyValue,
      depth + 1,
      maxDepth,
      maxCollectionSize,
      ancestors,
    );

    if (normalizedValue !== undefined) {
      normalized[key] = normalizedValue;
    }
  }

  if (keys.length > maxCollectionSize) {
    normalized['_truncated'] =
      `[Truncated ${keys.length - maxCollectionSize} object properties]`;
  }

  return normalized;
}

function normalizeError(
  error: Error,
  depth: number,
  maxDepth: number,
  maxCollectionSize: number,
  ancestors: WeakSet<object>,
): LogRecordContext {
  const errorRecord = error as Error & {
    readonly cause?: unknown;
    readonly code?: unknown;
    readonly [key: string]: unknown;
  };

  const normalized: Record<string, LogValue> = {
    name: error.name,
    message: error.message,
  };

  if (typeof error.stack === 'string') {
    normalized['stack'] = error.stack;
  }

  if (typeof errorRecord.code === 'string') {
    normalized['code'] = errorRecord.code;
  } else if (
    typeof errorRecord.code === 'number' ||
    typeof errorRecord.code === 'bigint'
  ) {
    normalized['code'] = errorRecord.code.toString();
  }

  if (errorRecord.cause !== undefined) {
    const cause = normalizeValue(
      errorRecord.cause,
      depth + 1,
      maxDepth,
      maxCollectionSize,
      ancestors,
    );

    if (cause !== undefined) {
      normalized['cause'] = cause;
    }
  }

  const additionalProperties = normalizeObject(
    errorRecord,
    depth,
    maxDepth,
    maxCollectionSize,
    ancestors,
  );

  for (const [key, value] of Object.entries(additionalProperties)) {
    if (!(key in normalized)) {
      normalized[key] = value;
    }
  }

  return normalized;
}

function readProperty(
  value: Readonly<Record<string, unknown>>,
  key: string,
): unknown {
  try {
    return value[key];
  } catch {
    return UNREADABLE_VALUE_MARKER;
  }
}

function isLogRecordContext(value: unknown): value is LogRecordContext {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
