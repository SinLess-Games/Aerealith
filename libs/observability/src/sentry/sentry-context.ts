import type * as Sentry from '@sentry/node';

import { getObservabilityContext } from '../context';
import { normalizeLogContext } from '../logger/utils/normalize-log-context';

export function applySentryObservabilityContext(scope: Sentry.Scope): void {
  const context = normalizeLogContext(getObservabilityContext());
  if (Object.keys(context).length === 0) return;

  scope.setContext('observability', context);
  for (const key of ['correlationId', 'requestId', 'traceId', 'spanId']) {
    const value = context[key];
    if (typeof value === 'string') scope.setTag(key, value);
  }
}
