import { AsyncLocalStorage } from 'node:async_hooks';

import { generateId } from '@aerealith-ai/utils';

export interface ObservabilityContext {
  readonly correlationId?: string;
  readonly requestId?: string;
  readonly traceId?: string;
  readonly spanId?: string;
  readonly jobId?: string;
  readonly guildId?: string;
  readonly shardId?: string | number;
  readonly userId?: string;
  readonly component?: string;
  readonly operation?: string;
  readonly [key: string]: unknown;
}

const observabilityContextStorage = new AsyncLocalStorage<
  Readonly<ObservabilityContext>
>();

/** Returns the context associated with the current asynchronous operation. */
export function getObservabilityContext(): Readonly<ObservabilityContext> {
  return observabilityContextStorage.getStore() ?? {};
}

export function getCorrelationId(): string | undefined {
  return getObservabilityContext().correlationId;
}

/** Creates a correlation identifier using the repository's standard ID utility. */
export function createCorrelationId(): string {
  return generateId('corr');
}

/**
 * Runs an operation with isolated context that is inherited by normal Node.js
 * asynchronous work. Nested calls inherit and may override parent values.
 */
export function runWithObservabilityContext<T>(
  context: ObservabilityContext,
  operation: () => T,
): T {
  const parent = getObservabilityContext();
  const nextContext = Object.freeze({
    ...parent,
    ...context,
    correlationId:
      normalizeIdentifier(context.correlationId) ??
      normalizeIdentifier(parent.correlationId) ??
      createCorrelationId(),
  });

  return observabilityContextStorage.run(nextContext, operation);
}

export const withObservabilityContext = runWithObservabilityContext;

/**
 * Replaces values in the context for the remainder of the current async
 * execution chain. When called outside a context, it starts a new one.
 */
export function updateObservabilityContext(
  context: ObservabilityContext,
): Readonly<ObservabilityContext> {
  const current = getObservabilityContext();
  const nextContext = Object.freeze({
    ...current,
    ...context,
    correlationId:
      normalizeIdentifier(context.correlationId) ??
      normalizeIdentifier(current.correlationId) ??
      createCorrelationId(),
  });

  observabilityContextStorage.enterWith(nextContext);

  return nextContext;
}

function normalizeIdentifier(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}
