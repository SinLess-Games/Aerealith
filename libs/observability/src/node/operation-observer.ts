import {
  SpanStatusCode,
  type Counter,
  type Histogram,
  type Meter,
  type Tracer,
} from '@opentelemetry/api';

export interface OperationObserver {
  observe<T>(
    operation: string,
    execute: () => Promise<T>,
    classifyError?: (error: unknown) => string,
  ): Promise<T>;
}

export function createOperationObserver(
  namespace: string,
  meter: Meter,
  tracer: Tracer,
): OperationObserver {
  const attempts: Counter = meter.createCounter(
    `aerealith.${namespace}.operations`,
    {
      description: `${namespace} operation attempts by operation and outcome.`,
      unit: '{operation}',
    },
  );
  const failures: Counter = meter.createCounter(
    `aerealith.${namespace}.failures`,
    {
      description: `${namespace} operation failures by safe error code.`,
      unit: '{failure}',
    },
  );
  const duration: Histogram = meter.createHistogram(
    `aerealith.${namespace}.operation.duration`,
    {
      description: `${namespace} operation duration.`,
      unit: 'ms',
    },
  );

  return {
    observe<T>(
      operation: string,
      execute: () => Promise<T>,
      classifyError: (error: unknown) => string = () => 'INTERNAL_ERROR',
    ): Promise<T> {
      return tracer.startActiveSpan(
        `${namespace}.${operation}`,
        async (span) => {
          const startedAt = performance.now();
          span.setAttribute(`${namespace}.operation`, operation);
          try {
            const result = await execute();
            attempts.add(1, { operation, outcome: 'success' });
            span.setStatus({ code: SpanStatusCode.OK });
            return result;
          } catch (error) {
            attempts.add(1, { operation, outcome: 'failure' });
            failures.add(1, {
              operation,
              'error.code': classifyError(error),
            });
            if (error instanceof Error) span.recordException(error);
            span.setStatus({ code: SpanStatusCode.ERROR });
            throw error;
          } finally {
            duration.record(performance.now() - startedAt, { operation });
            span.end();
          }
        },
      );
    },
  };
}
