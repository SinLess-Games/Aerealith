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

let tracingEnabled = true;
let activeTracer: Tracer = trace.getTracer('aerealith');

export function configureTracing(configuration: TracingConfiguration): void {
  tracingEnabled = configuration.enabled ?? true;
  activeTracer =
    configuration.tracer ??
    trace.getTracer(configuration.service, configuration.version);
}

export function isTracingEnabled(): boolean {
  return tracingEnabled;
}

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
  if (!tracingEnabled) return operation();

  return activeTracer.startActiveSpan(name, configuration, (span) => {
    const spanContext = span.spanContext();
    return runWithObservabilityContext(
      { traceId: spanContext.traceId, spanId: spanContext.spanId },
      () => executeSpanOperation(span, operation),
    );
  });
}

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
      if (ended) return;
      ended = true;
      span?.end();
    },
  };
}

function recordSpanFailure(span: Span, error: unknown): void {
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
