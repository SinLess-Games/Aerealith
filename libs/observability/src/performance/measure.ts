/** Combines operation timing, metrics, tracing, logging, and error capture. */
import { captureException } from '../sentry';
import {
  decrementGauge,
  getStandardServiceMetrics,
  incrementCounter,
  incrementGauge,
  observeHistogram,
} from '../metrics';
import { logger as defaultLogger } from '../logger/global-logger';
import type { ObservabilityLogger } from '../logger/logger.types';
import { withSpan } from '../tracing';
import { startTimer } from './timer';

/** Selects optional telemetry behaviors for one measured operation. */
export interface MeasureOperationOptions {
  readonly component?: string;
  readonly logger?: ObservabilityLogger;
  readonly log?: boolean;
  readonly trace?: boolean;
  readonly captureError?: boolean;
}

/** Measures, traces, logs, and records the outcome of an operation. */
export async function measureOperation<T>(
  operation: string,
  execute: () => Promise<T> | T,
  options: MeasureOperationOptions = {},
): Promise<T> {
  const instruments = getStandardServiceMetrics();
  const operationLogger = options.logger ?? defaultLogger;
  const timer = startTimer();
  const labels = { operation };
  // Count active work before execution so overlapping operations are visible.
  incrementGauge(instruments?.activeOperations, labels);

  const measuredOperation = async (): Promise<T> => {
    let outcome: 'success' | 'failure' = 'success';
    try {
      return await execute();
    } catch (error) {
      outcome = 'failure';
      // Error reporting is opt-in because some callers already capture errors
      // at a framework boundary and should not send duplicate events.
      if (options.captureError) {
        captureException(error, { operation, component: options.component });
      }
      throw error;
    } finally {
      // finally guarantees gauge balance and outcome metrics on every path.
      const durationMs = timer.end();
      const outcomeLabels = { operation, outcome };
      decrementGauge(instruments?.activeOperations, labels);
      incrementCounter(instruments?.operations, outcomeLabels);
      observeHistogram(
        instruments?.operationDuration,
        durationMs / 1_000,
        outcomeLabels,
      );

      if (options.log !== false) {
        operationLogger.info({
          event: 'observability.operation.measured',
          message: 'Operation completed.',
          operation,
          ...(options.component === undefined
            ? {}
            : { component: options.component }),
          durationMs,
          context: { outcome },
        });
      }
    }
  };

  // Tracing defaults on but can be suppressed for already-traced hot paths.
  return options.trace === false
    ? measuredOperation()
    : withSpan(operation, measuredOperation);
}
