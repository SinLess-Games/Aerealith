// libs/observability/src/logger/utils/normalize-log-error.ts

import type { LogError, LogRecordContext } from '@aerealith-ai/core';
import { redactText } from '@aerealith-ai/utils';

import { normalizeLogContext } from './normalize-log-context';

const DEFAULT_MAX_CAUSE_DEPTH = 5;

const ERROR_PROPERTY_NAMES = new Set([
  'name',
  'message',
  'code',
  'stack',
  'cause',
]);

/**
 * Converts an arbitrary thrown value into the canonical serializable LogError
 * shape.
 *
 * JavaScript permits any value to be thrown, including strings, numbers,
 * objects, and null. This function safely handles each of those cases.
 */
export function normalizeLogError(
  value: unknown,
  maxCauseDepth = DEFAULT_MAX_CAUSE_DEPTH,
): LogError | undefined {
  if (value === undefined) {
    return undefined;
  }

  return normalizeErrorValue(value, 0, maxCauseDepth, new WeakSet<object>());
}

function normalizeErrorValue(
  value: unknown,
  depth: number,
  maxDepth: number,
  seen: WeakSet<object>,
): LogError {
  if (!isRecord(value)) {
    return {
      name: 'NonErrorThrown',
      message: stringifyThrownValue(value),
    };
  }

  if (seen.has(value)) {
    return {
      name: 'Error',
      message: 'Circular error cause detected',
      code: 'CIRCULAR_ERROR_CAUSE',
    };
  }

  seen.add(value);

  const name =
    readString(value, 'name') ?? getConstructorName(value) ?? 'Error';
  const message = redactText(
    readString(value, 'message') ?? stringifyThrownValue(value),
  );
  const code = readCode(value);
  const stackValue = readString(value, 'stack');
  const stack = stackValue === undefined ? undefined : redactText(stackValue);
  const context = extractErrorContext(value);

  const cause =
    depth < maxDepth
      ? readCause(value, depth, maxDepth, seen)
      : createTruncatedCause(value);

  return {
    name,
    message,
    ...(code === undefined ? {} : { code }),
    ...(stack === undefined ? {} : { stack }),
    ...(cause === undefined ? {} : { cause }),
    ...(context === undefined ? {} : { context }),
  };
}

function readCause(
  value: Readonly<Record<string, unknown>>,
  depth: number,
  maxDepth: number,
  seen: WeakSet<object>,
): LogError | undefined {
  const cause = value['cause'];

  if (cause === undefined) {
    return undefined;
  }

  return normalizeErrorValue(cause, depth + 1, maxDepth, seen);
}

function createTruncatedCause(
  value: Readonly<Record<string, unknown>>,
): LogError | undefined {
  if (value['cause'] === undefined) {
    return undefined;
  }

  return {
    name: 'Error',
    message: 'Error cause chain exceeded the maximum depth',
    code: 'ERROR_CAUSE_DEPTH_EXCEEDED',
  };
}

function extractErrorContext(
  value: Readonly<Record<string, unknown>>,
): LogRecordContext | undefined {
  const contextEntries = Object.entries(value).filter(
    ([key]) => !ERROR_PROPERTY_NAMES.has(key),
  );

  if (contextEntries.length === 0) {
    return undefined;
  }

  const context = normalizeLogContext(Object.fromEntries(contextEntries));

  return Object.keys(context).length === 0 ? undefined : context;
}

function readString(
  value: Readonly<Record<string, unknown>>,
  property: string,
): string | undefined {
  const propertyValue = value[property];

  if (typeof propertyValue !== 'string') {
    return undefined;
  }

  const normalizedValue = propertyValue.trim();

  return normalizedValue.length === 0 ? undefined : normalizedValue;
}

function readCode(
  value: Readonly<Record<string, unknown>>,
): string | undefined {
  const code = value['code'];

  if (typeof code === 'string') {
    const normalizedCode = code.trim();

    return normalizedCode.length === 0 ? undefined : normalizedCode;
  }

  if (typeof code === 'number' || typeof code === 'bigint') {
    return code.toString();
  }

  return undefined;
}

function getConstructorName(
  value: Readonly<Record<string, unknown>>,
): string | undefined {
  const constructor = value.constructor;

  if (
    typeof constructor !== 'function' ||
    constructor.name.trim().length === 0
  ) {
    return undefined;
  }

  return constructor.name;
}

function stringifyThrownValue(value: unknown): string {
  if (value === null) {
    return 'null was thrown';
  }

  if (typeof value === 'string') {
    return value.length === 0 ? 'An empty string was thrown' : value;
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'symbol') return value.description ?? 'A symbol';

  if (typeof value === 'function') {
    return value.name.length > 0
      ? `Function ${value.name} was thrown`
      : 'An anonymous function was thrown';
  }

  try {
    return JSON.stringify(value) ?? 'An unknown value was thrown';
  } catch {
    return 'An unknown value was thrown';
  }
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null;
}
