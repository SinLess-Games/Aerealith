import { LogLevel } from '@aerealith-ai/core';
import { describe, expect, it } from 'vitest';

import { LogRecordFactory } from './factories/log-record.factory';
import { normalizeLogContext } from './utils/normalize-log-context';
import { normalizeLogError } from './utils/normalize-log-error';

describe('logger normalization', () => {
  it('normalizes runtime values, cycles, depth, collections, and unreadable fields', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic['self'] = cyclic;
    const unreadable: Record<string, unknown> = {};
    Object.defineProperty(unreadable, 'value', {
      enumerable: true,
      get() {
        throw new Error('unreadable');
      },
    });

    const context = normalizeLogContext(
      {
        bigint: 42n,
        date: new Date('2026-08-13T12:00:00.000Z'),
        invalidDate: new Date(Number.NaN),
        url: new URL('https://example.com/path'),
        regexp: /test/giu,
        symbol: Symbol('marker'),
        callback: function namedCallback() {
          return undefined;
        },
        numbers: [
          Number.NaN,
          Number.POSITIVE_INFINITY,
          Number.NEGATIVE_INFINITY,
        ],
        map: new Map([['key', 'value']]),
        set: new Set(['one', 'two']),
        bytes: new Uint8Array([1, 2]),
        cyclic,
        unreadable,
        password: 'secret',
      },
      5,
      100,
    );

    expect(context['bigint']).toBe('42');
    expect(context['date']).toBe('2026-08-13T12:00:00.000Z');
    expect(context['password']).toBe('[REDACTED]');
    expect(
      normalizeLogContext({ alpha: 1, beta: 2, gamma: 3 }, 5, 2)['_truncated'],
    ).toMatch(/Truncated/);

    const focused = normalizeLogContext({ cyclic, unreadable }, 5, 100);
    expect(focused['cyclic']).toEqual({ self: '[Circular]' });
    expect(focused['unreadable']).toEqual({ value: '[Unreadable value]' });
    expect(normalizeLogContext({ values: [1, 2, 3] }, 5, 2)['values']).toEqual([
      1,
      2,
      '[Truncated 1 collection entries]',
    ]);
  });

  it('normalizes errors, non-error throws, circular causes, and cause depth', () => {
    const root = new Error('root') as Error & {
      code: number;
      detail: string;
      cause?: unknown;
    };
    root.code = 42;
    root.detail = 'context';
    root.cause = new Error('cause');

    expect(normalizeLogError(root)).toMatchObject({
      name: 'Error',
      message: 'root',
      code: '42',
      context: { detail: 'context' },
      cause: { message: 'cause' },
    });
    expect(normalizeLogError('failed')).toEqual({
      name: 'NonErrorThrown',
      message: 'failed',
    });
    expect(normalizeLogError(undefined)).toBeUndefined();

    root.cause = root;
    expect(normalizeLogError(root)?.cause).toMatchObject({
      code: 'CIRCULAR_ERROR_CAUSE',
    });

    root.cause = new Error('nested', { cause: new Error('deep') });
    expect(normalizeLogError(root, 0)?.cause).toMatchObject({
      code: 'ERROR_CAUSE_DEPTH_EXCEEDED',
    });
  });

  it('creates normalized records and promotes trace identifiers', () => {
    const factory = new LogRecordFactory({
      service: ' auth ',
      environment: ' test ',
      version: ' 1.0.0 ',
      instanceId: ' worker-1 ',
      context: { requestId: 'base-request', password: 'secret' },
      createId: () => 'record-1',
      now: () => new Date('2026-08-13T12:00:00.000Z'),
    });

    expect(
      factory.create(
        LogLevel.Warn,
        {
          event: ' auth.failed ',
          message: ' Login failed ',
          component: ' transport ',
          operation: ' login ',
          durationMs: 12,
          error: new Error('invalid credentials'),
          context: {
            requestId: 'request-2',
            traceId: 'trace-1',
            userId: 'user-1',
          },
        },
        { correlationId: 'correlation-1' },
      ),
    ).toMatchObject({
      schemaVersion: 1,
      id: 'record-1',
      timestamp: '2026-08-13T12:00:00.000Z',
      level: LogLevel.Warn,
      event: 'auth.failed',
      message: 'Login failed',
      service: 'auth',
      environment: 'test',
      version: '1.0.0',
      instanceId: 'worker-1',
      component: 'transport',
      operation: 'login',
      requestId: 'request-2',
      correlationId: 'correlation-1',
      traceId: 'trace-1',
      durationMs: 12,
      error: { message: 'invalid credentials' },
      context: { password: '[REDACTED]', userId: 'user-1' },
    });
  });

  it('uses safe fallbacks for blank identity and invalid optional values', () => {
    const factory = new LogRecordFactory({
      service: ' ',
      environment: '',
      createId: () => 'record-2',
      now: () => new Date('2026-08-13T12:00:00.000Z'),
    });

    expect(
      factory.create(LogLevel.Info, {
        event: ' ',
        message: '',
        component: ' ',
        durationMs: -1,
      }),
    ).toMatchObject({
      service: 'unknown-service',
      environment: 'unknown-environment',
      event: 'application.log',
      message: 'Application log event',
      context: {},
    });
  });
});
