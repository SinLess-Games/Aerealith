/** Copies safe async observability context onto an isolated Sentry scope. */
import type * as Sentry from '@sentry/node';

import { getObservabilityContext } from '../context';
import { normalizeLogContext } from '../logger/utils/normalize-log-context';

/** Adds normalized context and searchable correlation tags to a Sentry event. */
export function applySentryObservabilityContext(scope: Sentry.Scope): void {
  const context = normalizeLogContext(getObservabilityContext());
  if (Object.keys(context).length === 0) return;

  scope.setContext('observability', context);
  // Only stable technical IDs are promoted to tags; arbitrary context remains
  // structured and does not create unbounded Sentry tag values.
  for (const key of ['correlationId', 'requestId', 'traceId', 'spanId']) {
    const value = context[key];
    if (typeof value === 'string') scope.setTag(key, value);
  }
}
