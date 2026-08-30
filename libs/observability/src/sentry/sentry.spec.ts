/** Verifies Sentry remains optional and receives only redacted correlated data. */
import type * as SentryTypes from '@sentry/node';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { runWithObservabilityContext } from '../context';

const sentryMocks = vi.hoisted(() => {
  // Hoisting makes the complete fake SDK available before Vitest evaluates the
  // module-level @sentry/node mock.
  const scope = {
    setContext: vi.fn(),
    setTag: vi.fn(),
  };
  return {
    scope,
    init: vi.fn(),
    captureException: vi.fn(() => 'event-1'),
    captureMessage: vi.fn(() => 'event-2'),
    setUser: vi.fn(),
    setTag: vi.fn(),
    setContext: vi.fn(),
    flush: vi.fn(() => Promise.resolve(true)),
    withScope: vi.fn((callback: (value: unknown) => unknown) =>
      callback(scope),
    ),
  };
});

vi.mock('@sentry/node', () => sentryMocks);

import {
  captureException,
  captureMessage,
  flushSentry,
  getSentrySdk,
  initializeSentry,
  isSentryEnabled,
  resetSentryForTesting,
  setSentryContext,
  setSentryTag,
  setSentryUser,
  withSentryScope,
} from './sentry';

describe('Sentry boundary', () => {
  afterEach(() => {
    resetSentryForTesting();
    vi.clearAllMocks();
  });

  it('is a safe no-op without a DSN', async () => {
    expect(initializeSentry({ service: 'test' })).toEqual({
      enabled: false,
      initialized: false,
    });
    expect(captureException(new Error('ignored'))).toBeUndefined();
    expect(captureMessage('ignored')).toBeUndefined();
    expect(setSentryUser({ id: 'ignored' })).toBeUndefined();
    expect(setSentryTag('component', 'ignored')).toBeUndefined();
    expect(setSentryContext('test', {})).toBeUndefined();
    expect(withSentryScope((scope) => scope)).toBeUndefined();
    expect(isSentryEnabled()).toBe(false);
    await expect(flushSentry()).resolves.toBe(true);
    expect(sentryMocks.init).not.toHaveBeenCalled();
  });

  it('initializes once with sanitization and without a second OTel setup', () => {
    initializeSentry({
      service: 'auth',
      dsn: 'https://public@sentry.example/1',
      environment: 'test',
      release: '1.0.0',
      tracesSampleRate: 0.25,
    });
    initializeSentry({
      service: 'auth',
      dsn: 'https://public@sentry.example/1',
    });

    expect(sentryMocks.init).toHaveBeenCalledOnce();
    const options = sentryMocks.init.mock.calls[0]?.[0] as {
      skipOpenTelemetrySetup: boolean;
      sendDefaultPii: boolean;
      beforeSend: (event: Record<string, unknown>) => Record<string, unknown>;
    };
    expect(options).toMatchObject({
      skipOpenTelemetrySetup: true,
      sendDefaultPii: false,
    });
    expect(
      options.beforeSend({
        extra: {
          token: 'secret',
          databaseUrl: 'postgresql://admin:secret@db/test',
        },
      }),
    ).toMatchObject({
      extra: {
        token: '[REDACTED]',
        databaseUrl: '[REDACTED]',
      },
    });
  });

  it('captures original errors with sanitized operation context', async () => {
    initializeSentry({
      service: 'jobs',
      dsn: 'https://public@sentry.example/1',
    });
    const error = new Error('failed');

    runWithObservabilityContext(
      { correlationId: 'corr-1', requestId: 'request-1' },
      () => captureException(error, { token: 'secret', operation: 'run' }),
    );
    captureMessage('Failed postgresql://admin:secret@db/test', 'warning');
    setSentryUser({ id: 'user-1', accessToken: 'secret' } as Parameters<
      typeof SentryTypes.setUser
    >[0]);
    setSentryTag('component', 'worker');
    setSentryContext('job', { password: 'secret' });

    expect(sentryMocks.captureException).toHaveBeenCalledWith(error);
    expect(sentryMocks.scope.setContext).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ token: '[REDACTED]', operation: 'run' }),
    );
    expect(sentryMocks.captureMessage).toHaveBeenCalledWith(
      'Failed postgresql://[REDACTED]:[REDACTED]@db/test',
      'warning',
    );
    expect(sentryMocks.setUser).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: '[REDACTED]' }),
    );
  });

  it('supports enabled scope, null context, SDK access, and flushing', async () => {
    initializeSentry({
      service: 'jobs',
      dsn: 'https://public@sentry.example/1',
    });

    expect(isSentryEnabled()).toBe(true);
    expect(withSentryScope((scope) => scope)).toBe(sentryMocks.scope);
    setSentryContext('optional', null);
    captureException('non-error', {});
    expect(getSentrySdk()).toBeDefined();
    await expect(flushSentry(500)).resolves.toBe(true);

    expect(sentryMocks.setContext).toHaveBeenCalledWith('optional', null);
    expect(sentryMocks.flush).toHaveBeenCalledWith(500);

    expect(initializeSentry({ service: 'jobs', enabled: false })).toEqual({
      enabled: false,
      initialized: true,
    });
  });
});
