// libs/utils/src/redact.ts

export const DEFAULT_REDACTION_REPLACEMENT = '[REDACTED]';
export const DEFAULT_CIRCULAR_REPLACEMENT = '[CIRCULAR]';
export const DEFAULT_MAX_DEPTH_REPLACEMENT = '[MAX_DEPTH]';

export const DEFAULT_SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'passwordConfirmation',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'passphrase',

  'token',
  'accessToken',
  'refreshToken',
  'sessionToken',
  'verificationToken',
  'resetToken',
  'csrfToken',
  'idToken',

  'apiKey',
  'authorization',
  'proxyAuthorization',

  'cookie',
  'setCookie',

  'secret',
  'clientSecret',
  'privateKey',
  'signingKey',

  'recoveryCode',
  'recoveryCodes',
  'otp',
  'otpCode',
  'totpSecret',
] as const;

export interface RedactOptions {
  /**
   * Additional sensitive property names.
   *
   * These are combined with {@link DEFAULT_SENSITIVE_KEYS}.
   */
  readonly sensitiveKeys?: readonly string[];

  /**
   * Replacement used for sensitive values.
   *
   * @default "[REDACTED]"
   */
  readonly replacement?: string;

  /**
   * Replacement used when a circular reference is detected.
   *
   * @default "[CIRCULAR]"
   */
  readonly circularReplacement?: string;

  /**
   * Replacement used when the maximum traversal depth is reached.
   *
   * @default "[MAX_DEPTH]"
   */
  readonly maxDepthReplacement?: string;

  /**
   * Maximum object traversal depth.
   *
   * This protects logging and telemetry code from unexpectedly large or deeply
   * nested values.
   *
   * @default 20
   */
  readonly maxDepth?: number;
}

interface ResolvedRedactOptions {
  readonly sensitiveKeys: ReadonlySet<string>;
  readonly replacement: string;
  readonly circularReplacement: string;
  readonly maxDepthReplacement: string;
  readonly maxDepth: number;
}

/**
 * Returns a normalized representation of a property name for
 * case-insensitive sensitive-key comparisons.
 *
 * Examples:
 *
 * - `accessToken` becomes `accesstoken`
 * - `access_token` becomes `accesstoken`
 * - `set-cookie` becomes `setcookie`
 */
function normalizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function resolveOptions(options: RedactOptions): ResolvedRedactOptions {
  const sensitiveKeys = new Set<string>();

  for (const key of DEFAULT_SENSITIVE_KEYS) {
    sensitiveKeys.add(normalizeKey(key));
  }

  for (const key of options.sensitiveKeys ?? []) {
    sensitiveKeys.add(normalizeKey(key));
  }

  return {
    sensitiveKeys,
    replacement: options.replacement ?? DEFAULT_REDACTION_REPLACEMENT,
    circularReplacement:
      options.circularReplacement ?? DEFAULT_CIRCULAR_REPLACEMENT,
    maxDepthReplacement:
      options.maxDepthReplacement ?? DEFAULT_MAX_DEPTH_REPLACEMENT,
    maxDepth: Math.max(0, options.maxDepth ?? 20),
  };
}

function isSensitiveKey(key: string, options: ResolvedRedactOptions): boolean {
  return options.sensitiveKeys.has(normalizeKey(key));
}

function redactError(
  error: Error,
  options: ResolvedRedactOptions,
  seen: WeakSet<object>,
  depth: number,
): Record<string, unknown> {
  const record: Record<string, unknown> = {
    name: error.name,
    message: error.message,
  };

  if (error.stack !== undefined) {
    record['stack'] = error.stack;
  }

  if ('cause' in error && error.cause !== undefined) {
    record['cause'] = redactValue(error.cause, options, seen, depth + 1);
  }

  for (const [key, value] of Object.entries(error)) {
    record[key] = isSensitiveKey(key, options)
      ? options.replacement
      : redactValue(value, options, seen, depth + 1);
  }

  return record;
}

function redactArray(
  value: readonly unknown[],
  options: ResolvedRedactOptions,
  seen: WeakSet<object>,
  depth: number,
): unknown[] {
  return value.map((item) => redactValue(item, options, seen, depth + 1));
}

function redactMap(
  value: ReadonlyMap<unknown, unknown>,
  options: ResolvedRedactOptions,
  seen: WeakSet<object>,
  depth: number,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, item] of value.entries()) {
    const propertyName = String(key);

    result[propertyName] = isSensitiveKey(propertyName, options)
      ? options.replacement
      : redactValue(item, options, seen, depth + 1);
  }

  return result;
}

function redactSet(
  value: ReadonlySet<unknown>,
  options: ResolvedRedactOptions,
  seen: WeakSet<object>,
  depth: number,
): unknown[] {
  return Array.from(value, (item) =>
    redactValue(item, options, seen, depth + 1),
  );
}

function redactObject(
  value: object,
  options: ResolvedRedactOptions,
  seen: WeakSet<object>,
  depth: number,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(value)) {
    result[key] = isSensitiveKey(key, options)
      ? options.replacement
      : redactValue(item, options, seen, depth + 1);
  }

  return result;
}

function redactValue(
  value: unknown,
  options: ResolvedRedactOptions,
  seen: WeakSet<object>,
  depth: number,
): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return value;

  if (typeof value === 'symbol') {
    return value.toString();
  }

  if (typeof value === 'function') {
    return `[Function: ${value.name || 'anonymous'}]`;
  }

  if (typeof value !== 'object') return String(value);

  if (depth > options.maxDepth) {
    return options.maxDepthReplacement;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof RegExp) {
    return value.toString();
  }

  if (seen.has(value)) {
    return options.circularReplacement;
  }

  seen.add(value);

  if (value instanceof Error) {
    return redactError(value, options, seen, depth);
  }

  if (Array.isArray(value)) {
    return redactArray(value, options, seen, depth);
  }

  if (value instanceof Map) {
    return redactMap(value, options, seen, depth);
  }

  if (value instanceof Set) {
    return redactSet(value, options, seen, depth);
  }

  return redactObject(value, options, seen, depth);
}

/**
 * Creates a redacted copy of an arbitrary value.
 *
 * The original value is never modified.
 *
 * Sensitive property names are matched case-insensitively and ignore common
 * separators. For example, `accessToken`, `access_token`, and `access-token`
 * are treated as the same property name.
 *
 * Circular references and deeply nested objects are replaced with safe marker
 * strings so the result can be passed to logging and telemetry systems.
 */
export function redact<T>(value: T, options: RedactOptions = {}): unknown {
  return redactValue(value, resolveOptions(options), new WeakSet<object>(), 0);
}

/**
 * Creates a redacted record while preserving the record-oriented return type
 * expected by structured loggers.
 */
export function redactRecord(
  record: Readonly<Record<string, unknown>>,
  options: RedactOptions = {},
): Record<string, unknown> {
  const redacted = redact(record, options);

  if (
    redacted !== null &&
    typeof redacted === 'object' &&
    !Array.isArray(redacted)
  ) {
    return redacted as Record<string, unknown>;
  }

  return {
    value: redacted,
  };
}
