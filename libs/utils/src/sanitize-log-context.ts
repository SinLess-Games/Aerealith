import type { SerializableValue } from './logging-types';
import { normalizeRecord } from './normalize-record';
import { redactRecord, type RedactOptions } from './redact';

/** Redacts sensitive properties and normalizes structured logging context. */
export function sanitizeLogContext(
  context: Readonly<Record<string, unknown>>,
  options: RedactOptions = {},
): Record<string, SerializableValue> {
  return normalizeRecord(redactRecord(context, options));
}
