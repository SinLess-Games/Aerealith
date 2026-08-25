import { LogLevel, type LogRecord } from '@aerealith-ai/core';
import { describe, expect, it, vi } from 'vitest';

import { ConsoleLogFormatter } from './formatters/console-log.formatter';
import { LokiPayloadFormatter } from './formatters/loki-payload.formatter';

function createRecord(overrides: Partial<LogRecord> = {}): LogRecord {
  return {
    schemaVersion: 1,
    id: 'record-1',
    timestamp: '2026-08-13T12:00:00.123Z',
    level: LogLevel.Info,
    event: 'auth.login',
    message: 'Login succeeded',
    service: 'auth',
    environment: 'test',
    context: { userId: 'user-1' },
    ...overrides,
  };
}

describe('logger formatters', () => {
  it('formats pretty console output with metadata, context, and error causes', () => {
    const formatter = new ConsoleLogFormatter(
      { color: false, useUtc: true },
      false,
    );
    const output = formatter.format(
      createRecord({
        level: LogLevel.Error,
        version: '1.0.0',
        requestId: 'request-1',
        durationMs: 8,
        error: {
          name: 'DatabaseError',
          message: 'Query failed',
          code: 'DB_1',
          stack: 'DatabaseError: Query failed\n at query',
          context: { table: 'users' },
          cause: { name: 'Error', message: 'offline' },
        },
      }),
    );

    expect(output).toContain('2026-08-13T12:00:00.123Z ERROR');
    expect(output).toContain('[auth] auth.login Login succeeded');
    expect(output).toContain('requestId=request-1');
    expect(output).toContain('DatabaseError [DB_1]: Query failed');
    expect(output).toContain('Caused by:');
    expect(output).toContain('"userId": "user-1"');
  });

  it('supports compact JSON and optional pretty sections', () => {
    const compact = new ConsoleLogFormatter({ pretty: false }, false);
    expect(JSON.parse(compact.format(createRecord()))).toMatchObject({
      id: 'record-1',
      event: 'auth.login',
    });

    const minimal = new ConsoleLogFormatter(
      {
        color: false,
        includeTimestamp: false,
        includeService: false,
        includeEvent: false,
        includeContext: false,
        includeStackTrace: false,
      },
      false,
    );
    const output = minimal.format(
      createRecord({ error: new Error('failed') as never }),
    );
    expect(output).toContain('INFO');
    expect(output).not.toContain('[auth]');
    expect(output).not.toContain('user-1');
  });

  it('groups Loki entries by normalized low-cardinality labels', () => {
    const formatter = new LokiPayloadFormatter({
      ' deployment-region ': ' us west ',
      '9invalid': 'value',
      empty: ' ',
    });
    const payload = formatter.format([
      createRecord(),
      createRecord({ id: 'record-2' }),
      createRecord({ id: 'record-3', level: LogLevel.Error }),
    ]);

    expect(payload.streams).toHaveLength(2);
    expect(payload.streams[0]?.stream).toMatchObject({
      _9invalid: 'value',
      deployment_region: 'us west',
      environment: 'test',
      level: 'info',
      service: 'auth',
    });
    expect(payload.streams[0]?.values).toHaveLength(2);
    expect(payload.streams[0]?.values[0]?.[0]).toBe('1786622400123000000');
    expect(
      JSON.parse(payload.streams[0]?.values[0]?.[1] ?? '{}'),
    ).toMatchObject({
      id: 'record-1',
    });
  });

  it('uses the current time when a Loki timestamp is invalid', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1234);
    const value = new LokiPayloadFormatter().format([
      createRecord({ timestamp: 'invalid' }),
    ]).streams[0]?.values[0]?.[0];
    expect(value).toBe('1234000000');
    vi.restoreAllMocks();
  });
});
