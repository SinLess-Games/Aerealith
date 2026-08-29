// libs/observability/src/logger/factories/log-record.factory.ts

import type {
  LogContext,
  LogInput,
  LogLevel,
  LogRecord,
  LogRecordContext,
  LogValue,
} from '@aerealith-ai/core';

import type { LoggerOptions } from '../config/logger-options.interface';
import { normalizeLogContext } from '../utils/normalize-log-context';
import { normalizeLogError } from '../utils/normalize-log-error';

const DEFAULT_EVENT_NAME = 'application.log';
const DEFAULT_MESSAGE = 'Application log event';

let fallbackIdCounter = 0;

/**
 * Configuration required by the log-record factory.
 */
export type LogRecordFactoryOptions = Pick<
  LoggerOptions,
  | 'service'
  | 'environment'
  | 'version'
  | 'instanceId'
  | 'context'
  | 'contextProvider'
  | 'createId'
  | 'now'
>;

/**
 * Creates canonical, normalized, redacted, and serializable log records.
 */
export class LogRecordFactory {
  private readonly service: string;
  private readonly environment: string;
  private readonly version: string | undefined;
  private readonly instanceId: string | undefined;
  private readonly baseContext: LogContext;
  private readonly contextProvider: () => LogContext | undefined;
  private readonly createId: () => string;
  private readonly now: () => Date;

  public constructor(options: LogRecordFactoryOptions) {
    this.service = normalizeRequiredString(options.service, 'unknown-service');
    this.environment = normalizeRequiredString(
      options.environment,
      'unknown-environment',
    );
    this.version = normalizeOptionalString(options.version);
    this.instanceId = normalizeOptionalString(options.instanceId);
    this.baseContext = options.context ?? {};
    this.contextProvider = options.contextProvider ?? (() => undefined);
    this.createId = options.createId ?? createDefaultId;
    this.now = options.now ?? createCurrentDate;
  }

  /**
   * Creates a finalized log record for dispatch to configured sinks.
   */
  public create(
    level: LogLevel,
    input: LogInput,
    inheritedContext: LogContext = {},
  ): LogRecord {
    const context = normalizeLogContext({
      ...this.baseContext,
      ...this.contextProvider(),
      ...inheritedContext,
      ...input.context,
    });

    const promotedContext = promoteRecordContext(context);
    const error = normalizeLogError(input.error);
    const timestamp = normalizeTimestamp(this.now());

    return {
      schemaVersion: 1,
      id: this.createId(),
      timestamp,
      level,
      event: normalizeRequiredString(input.event, DEFAULT_EVENT_NAME),
      message: normalizeRequiredString(input.message, DEFAULT_MESSAGE),
      service: this.service,
      environment: this.environment,
      ...(this.version === undefined ? {} : { version: this.version }),
      ...(this.instanceId === undefined ? {} : { instanceId: this.instanceId }),
      ...(normalizeOptionalString(input.component) === undefined
        ? {}
        : { component: normalizeOptionalString(input.component) }),
      ...(normalizeOptionalString(input.operation) === undefined
        ? {}
        : { operation: normalizeOptionalString(input.operation) }),
      ...(promotedContext.requestId === undefined
        ? {}
        : { requestId: promotedContext.requestId }),
      ...(promotedContext.correlationId === undefined
        ? {}
        : { correlationId: promotedContext.correlationId }),
      ...(promotedContext.traceId === undefined
        ? {}
        : { traceId: promotedContext.traceId }),
      ...(promotedContext.spanId === undefined
        ? {}
        : { spanId: promotedContext.spanId }),
      ...(normalizeDuration(input.durationMs) === undefined
        ? {}
        : { durationMs: normalizeDuration(input.durationMs) }),
      ...(error === undefined ? {} : { error }),
      context: promotedContext.context,
    };
  }
}

interface PromotedRecordContext {
  readonly requestId?: string;
  readonly correlationId?: string;
  readonly traceId?: string;
  readonly spanId?: string;
  readonly context: LogRecordContext;
}

function promoteRecordContext(
  context: LogRecordContext,
): PromotedRecordContext {
  const remainingContext: Record<string, LogValue> = { ...context };

  const requestId = takeStringValue(remainingContext, 'requestId');
  const correlationId = takeStringValue(remainingContext, 'correlationId');
  const traceId = takeStringValue(remainingContext, 'traceId');
  const spanId = takeStringValue(remainingContext, 'spanId');

  return {
    ...(requestId === undefined ? {} : { requestId }),
    ...(correlationId === undefined ? {} : { correlationId }),
    ...(traceId === undefined ? {} : { traceId }),
    ...(spanId === undefined ? {} : { spanId }),
    context: remainingContext,
  };
}

function takeStringValue(
  context: Record<string, LogValue>,
  key: string,
): string | undefined {
  const value = context[key];

  if (typeof value !== 'string') {
    return undefined;
  }

  delete context[key];

  return normalizeOptionalString(value);
}

function normalizeRequiredString(value: string, fallback: string): string {
  const normalized = value.trim();

  return normalized.length === 0 ? fallback : normalized;
}

function normalizeOptionalString(
  value: string | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();

  return normalized.length === 0 ? undefined : normalized;
}

function normalizeDuration(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value) || value < 0) {
    return undefined;
  }

  return value;
}

function normalizeTimestamp(value: Date): string {
  if (Number.isNaN(value.getTime())) {
    return createCurrentDate().toISOString();
  }

  return value.toISOString();
}

function createCurrentDate(): Date {
  return new Date();
}

function createDefaultId(): string {
  if (
    typeof globalThis.crypto === 'object' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  fallbackIdCounter += 1;

  return `${Date.now().toString(36)}-${fallbackIdCounter.toString(36)}`;
}
