/** Wraps Sentry with redaction, metrics, and shared correlation context. */
import * as Sentry from '@sentry/node';
import { redact, redactText } from '@aerealith-ai/utils';

import { normalizeErrorContext } from '../errors/error-context';
import { normalizeError, toError } from '../errors/normalize-error';
import type { ErrorContext } from '../errors/error.types';
import { getStandardServiceMetrics, incrementCounter } from '../metrics';
import type { SentryConfig, SentryInitializationResult } from './sentry-config';
import { applySentryObservabilityContext } from './sentry-context';

// Separate flags distinguish an SDK initialized earlier from reporting that is
// disabled for the current configuration.
let sentryInitialized = false;
let sentryEnabled = false;

/** Initializes Sentry error reporting without replacing Aerealith OpenTelemetry. */
export function initializeSentry(
  config: SentryConfig,
): SentryInitializationResult {
  const dsn = config.dsn?.trim();

  if (config.enabled === false || !dsn) {
    // An empty DSN is a supported disabled state for local development.
    sentryEnabled = false;
    return { enabled: false, initialized: sentryInitialized };
  }

  if (sentryInitialized) {
    // Sentry is process-global; do not initialize integrations twice.
    sentryEnabled = true;
    return { enabled: true, initialized: true };
  }

  Sentry.init({
    dsn,
    enabled: true,
    environment: config.environment,
    release: config.release,
    tracesSampleRate: config.tracesSampleRate ?? 0,
    sendDefaultPii: false,
    initialScope: {
      tags: { service: config.service },
    },
    // The repository already owns the OpenTelemetry SDK and exporters.
    skipOpenTelemetrySetup: true,
    beforeSend(event) {
      // Final defensive redaction covers data added by Sentry integrations.
      return redact(event) as typeof event;
    },
  });

  sentryInitialized = true;
  sentryEnabled = true;
  return { enabled: true, initialized: true };
}

/** Reports whether calls currently forward events to Sentry. */
export function isSentryEnabled(): boolean {
  return sentryEnabled;
}

export function captureException(
  error: unknown,
  context?: ErrorContext,
): string | undefined {
  const normalized = normalizeError(error);
  // Error metrics remain useful even when Sentry itself is disabled.
  incrementCounter(getStandardServiceMetrics()?.errors, {
    component: normalizeMetricLabel(context?.['component']),
    code: normalizeMetricLabel(normalized.code ?? normalized.name),
  });

  if (!sentryEnabled) return undefined;

  return Sentry.withScope((scope) => {
    // Per-event scope prevents one operation's context leaking into another.
    applySentryObservabilityContext(scope);
    const normalizedContext = normalizeErrorContext(context);
    if (Object.keys(normalizedContext).length > 0) {
      scope.setContext('error', normalizedContext);
    }
    return Sentry.captureException(toError(error));
  });
}

function normalizeMetricLabel(value: unknown): string {
  // Restrict labels to bounded stable identifiers; messages and arbitrary user
  // values collapse to the shared unknown series.
  if (typeof value !== 'string') return 'unknown';
  const normalized = value.trim();
  return /^[a-zA-Z0-9_.-]{1,64}$/u.test(normalized) ? normalized : 'unknown';
}

/** Captures a redacted diagnostic message when Sentry is enabled. */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
): string | undefined {
  if (!sentryEnabled) return undefined;
  return Sentry.captureMessage(redactText(message), level);
}

/** Sets a redacted global Sentry user for consumers that explicitly need it. */
export function setSentryUser(
  user: Parameters<typeof Sentry.setUser>[0],
): void {
  if (!sentryEnabled) return;
  Sentry.setUser(redact(user) as Parameters<typeof Sentry.setUser>[0]);
}

/** Adds a redacted searchable tag to subsequent Sentry events. */
export function setSentryTag(key: string, value: string): void {
  if (!sentryEnabled) return;
  Sentry.setTag(key, redactText(value));
}

/** Sets structured, normalized context on subsequent Sentry events. */
export function setSentryContext(
  name: string,
  context: ErrorContext | null,
): void {
  if (!sentryEnabled) return;
  Sentry.setContext(
    name,
    context === null ? null : normalizeErrorContext(context),
  );
}

/** Runs a callback with an isolated scope, or undefined when disabled. */
export function withSentryScope<T>(
  callback: (scope: Sentry.Scope | undefined) => T,
): T {
  if (!sentryEnabled) return callback(undefined);
  return Sentry.withScope((scope) => callback(scope));
}

/** Flushes queued Sentry events within a bounded deadline. */
export async function flushSentry(timeoutMs = 2_000): Promise<boolean> {
  if (!sentryEnabled) return true;
  return Sentry.flush(timeoutMs);
}

/** Allows advanced consumers to reach SDK features not hidden by this layer. */
export function getSentrySdk(): typeof Sentry {
  return Sentry;
}

/** Clears wrapper flags between tests; the SDK remains process-managed. */
export function resetSentryForTesting(): void {
  sentryInitialized = false;
  sentryEnabled = false;
}
