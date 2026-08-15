import type { SerializableValue } from './logging-types';

/** Converts a record into a JSON-compatible representation. */
export function normalizeRecord(
  record: Readonly<Record<string, unknown>>,
): Record<string, SerializableValue> {
  const seen = new WeakSet<object>();
  seen.add(record);

  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      normalizeValue(value, seen),
    ]),
  );
}

function normalizeValue(
  value: unknown,
  seen: WeakSet<object>,
): SerializableValue {
  if (value === null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : String(value);
  }

  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'undefined') return '[UNDEFINED]';
  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'function')
    return `[Function: ${value.name || 'anonymous'}]`;
  if (typeof value !== 'object') return String(value);
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString();
  }
  if (value instanceof RegExp) return value.toString();
  if (seen.has(value)) return '[CIRCULAR]';

  seen.add(value);

  if (value instanceof Error) {
    const result: Record<string, SerializableValue> = {
      name: value.name,
      message: value.message,
    };

    if (value.stack) result['stack'] = value.stack;
    if (value.cause !== undefined) {
      result['cause'] = normalizeValue(value.cause, seen);
    }

    for (const [key, item] of Object.entries(value)) {
      result[key] = normalizeValue(item, seen);
    }

    return result;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item, seen));
  }

  if (value instanceof Map) {
    return Object.fromEntries(
      [...value].map(([key, item]) => [
        String(key),
        normalizeValue(item, seen),
      ]),
    );
  }

  if (value instanceof Set) {
    return [...value].map((item) => normalizeValue(item, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      normalizeValue(item, seen),
    ]),
  );
}
