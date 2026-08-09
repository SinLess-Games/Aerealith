import {
  SpanStatusCode,
  context,
  trace,
  type Counter,
  type Histogram,
  type Meter,
  type UpDownCounter,
} from '@opentelemetry/api';
import type {
  ApiRequestObservation,
  ApiRequestObserver,
  ApiRequestOutcome,
} from '@aerealith-ai/api-platform';

interface ApiInstruments {
  readonly requests: Counter;
  readonly duration: Histogram;
  readonly active: UpDownCounter;
  readonly failures: Counter;
}

/** Records low-cardinality RED metrics and enriches the active server span. */
export function createApiRequestObserver(meter: Meter): ApiRequestObserver {
  const instruments: ApiInstruments = {
    requests: meter.createCounter('aerealith.api.server.requests', {
      description: 'Completed API requests.',
      unit: '{request}',
    }),
    duration: meter.createHistogram('aerealith.api.server.duration', {
      description: 'API request duration.',
      unit: 'ms',
    }),
    active: meter.createUpDownCounter('aerealith.api.server.active_requests', {
      description: 'API requests currently being processed.',
      unit: '{request}',
    }),
    failures: meter.createCounter('aerealith.api.server.failures', {
      description: 'Failed API requests.',
      unit: '{request}',
    }),
  };

  return {
    requestStarted(observation) {
      const attributes = requestAttributes(observation);
      instruments.active.add(1, attributes);
      const span = activeSpan();
      span?.setAttributes({
        ...attributes,
        'aerealith.request.id': observation.requestId,
      });
      const spanContext = span?.spanContext();
      return spanContext
        ? { traceId: spanContext.traceId, spanId: spanContext.spanId }
        : undefined;
    },
    requestCompleted(outcome) {
      recordOutcome(instruments, outcome);
    },
    requestFailed(outcome, error) {
      const attributes = requestAttributes(outcome);
      instruments.failures.add(1, {
        ...attributes,
        'error.type': errorName(error),
      });
      recordOutcome(instruments, outcome);
      const span = activeSpan();
      if (error instanceof Error) span?.recordException(error);
      span?.setStatus({ code: SpanStatusCode.ERROR });
    },
  };
}

function recordOutcome(
  instruments: ApiInstruments,
  outcome: ApiRequestOutcome,
): void {
  const attributes = {
    ...requestAttributes(outcome),
    'http.response.status_code': outcome.status,
  };
  instruments.active.add(-1, requestAttributes(outcome));
  instruments.requests.add(1, attributes);
  instruments.duration.record(outcome.durationMs, attributes);
  activeSpan()?.setAttributes(attributes);
}

function requestAttributes(observation: ApiRequestObservation) {
  return {
    'service.name': observation.service,
    'http.request.method': observation.method,
    'http.route': normalizeRoute(observation.route),
  };
}

function normalizeRoute(route: string): string {
  return route
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/giu,
      '/:id',
    )
    .replace(/\/\d+(?=\/|$)/gu, '/:id');
}

function activeSpan() {
  return trace.getSpan(context.active());
}

function errorName(error: unknown): string {
  return error instanceof Error && error.name ? error.name : 'UnknownError';
}
