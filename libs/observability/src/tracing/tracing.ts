/** Wraps OpenTelemetry spans with async context and automatic error status. */
import {
  SpanStatusCode,
  context as openTelemetryContext,
  trace,
  type Span,
  type Tracer,
} from '@opentelemetry/api';

import {
  getObservabilityContext,
  runWithObservabilityContext,
} from '../context';
import { toError } from '../errors';
import type {
  SpanConfiguration,
  SpanHandle,
  TraceContext,
  TracingConfiguration,
} from './tracing.types';

// The API-provided tracer is safe before an SDK is installed; configuration can
// replace it with the Node SDK tracer after exporters start.
let tracingEnabled = true;
let activeTracer: Tracer = trace.getTracer('aerealith');

/** Configures the process tracer while retaining no-op-friendly API behavior. */
export function configureTracing(configuration: TracingConfiguration): void {
  tracingEnabled = configuration.enabled ?? true;
  activeTracer =
    configuration.tracer ??
    trace.getTracer(configuration.service, configuration.version);
}

/** Reports whether helpers currently create OpenTelemetry spans. */
export function isTracingEnabled(): boolean {
  return tracingEnabled;
}

/** Returns active OpenTelemetry IDs, falling back to propagated async context. */
export function getTraceContext(): TraceContext {
  const activeSpan = trace.getSpan(openTelemetryContext.active());
  const spanContext = activeSpan?.spanContext();
  const operationContext = getObservabilityContext();

  return {
    ...(spanContext?.traceId
      ? { traceId: spanContext.traceId }
      : typeof operationContext.traceId === 'string'
        ? { traceId: operationContext.traceId }
        : {}),
    ...(spanContext?.spanId
      ? { spanId: spanContext.spanId }
      : typeof operationContext.spanId === 'string'
        ? { spanId: operationContext.spanId }
        : {}),
  };
}

export function withSpan<T>(
  name: string,
  operation: () => T,
  configuration: SpanConfiguration = {},
): T {
  // Disabled tracing runs application code directly with zero span allocation.
  if (!tracingEnabled) return operation();

  return activeTracer.startActiveSpan(name, configuration, (span) => {
    const spanContext = span.spanContext();
    // Mirror trace IDs into the shared context so logs and Sentry correlate even
    // when they do not read OpenTelemetry context directly.
    return runWithObservabilityContext(
      { traceId: spanContext.traceId, spanId: spanContext.spanId },
      () => executeSpanOperation(span, operation),
    );
  });
}

/** Starts a manual span for callback APIs and returns an idempotent handle. */
export function startSpan(
  name: string,
  configuration: SpanConfiguration = {},
): SpanHandle {
  if (!tracingEnabled) return createSpanHandle(undefined);
  return createSpanHandle(activeTracer.startSpan(name, configuration));
}

function executeSpanOperation<T>(span: Span, operation: () => T): T {
  try {
    const result = operation();
    if (isPromiseLike(result)) {
      // Preserve the caller's original promise result while ending the span on
      // either asynchronous fulfillment or rejection.
      return Promise.resolve(result).then(
        (value) => {
          span.setStatus({ code: SpanStatusCode.OK });
          span.end();
          return value;
        },
        (error: unknown) => {
          recordSpanFailure(span, error);
          span.end();
          throw error;
        },
      ) as T;
    }

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
    return result;
  } catch (error) {
    recordSpanFailure(span, error);
    span.end();
    throw error;
  }
}

function createSpanHandle(span: Span | undefined): SpanHandle {
  const spanContext = span?.spanContext();
  let ended = false;

  return {
    span,
    ...(spanContext?.traceId ? { traceId: spanContext.traceId } : {}),
    ...(spanContext?.spanId ? { spanId: spanContext.spanId } : {}),
    setAttribute(name, value) {
      span?.setAttribute(name, value);
    },
    recordException(error) {
      if (span) recordSpanFailure(span, error);
    },
    run<T>(operation: () => T): T {
      // Running through both contexts makes the manual span active for nested
      // OpenTelemetry calls and shared logger correlation.
      if (!span || !spanContext) return operation();
      return openTelemetryContext.with(
        trace.setSpan(openTelemetryContext.active(), span),
        () =>
          runWithObservabilityContext(
            { traceId: spanContext.traceId, spanId: spanContext.spanId },
            operation,
          ),
      );
    },
    end() {
      // Event emitters may fire duplicate cleanup callbacks; end only once.
      if (ended) return;
      ended = true;
      span?.end();
    },
  };
}

function recordSpanFailure(span: Span, error: unknown): void {
  // OpenTelemetry requires an Error-like exception and explicit error status.
  span.recordException(toError(error));
  span.setStatus({ code: SpanStatusCode.ERROR });
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof value.then === 'function'
  );
}
