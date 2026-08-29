import { describe, expect, it } from 'vitest';

import {
  captureException,
  createLogger,
  getMetrics,
  getObservabilityContext,
  initializeObservability,
  measureOperation,
  normalizeError,
  registerHealthCheck,
  runHealthChecks,
  runWithObservabilityContext,
  shutdownObservability,
  startTimer,
  withSpan,
} from './index';

describe('observability public API', () => {
  it('exports the canonical consumer surface from the package entry point', () => {
    const publicFunctions = [
      captureException,
      createLogger,
      getMetrics,
      getObservabilityContext,
      initializeObservability,
      measureOperation,
      normalizeError,
      registerHealthCheck,
      runHealthChecks,
      runWithObservabilityContext,
      shutdownObservability,
      startTimer,
      withSpan,
    ];

    for (const publicFunction of publicFunctions) {
      expect(typeof publicFunction).toBe('function');
    }
  });
});
