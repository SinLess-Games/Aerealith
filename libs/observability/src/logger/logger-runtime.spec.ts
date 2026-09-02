/** Verifies logger level filtering, child context, and shared sink lifecycle. */
import { LogLevel, noopLogger, type LogRecord } from '@aerealith-ai/core';
import { describe, expect, it, vi } from 'vitest';

import { createLogger } from './create-logger';
import { DefaultLogger } from './default-logger';
import { LogRecordFactory } from './factories/log-record.factory';

function createSink() {
  // A controllable in-memory sink makes write and lifecycle assertions explicit.
  return {
    name: 'memory',
    write: vi.fn<(record: LogRecord) => void | Promise<void>>(),
    flush: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    close: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  };
}

describe('logger runtime', () => {
  it('filters levels and shares child context and lifecycle', async () => {
    const sink = createSink();
    const logger = new DefaultLogger(
      LogLevel.Info,
      sink,
      new LogRecordFactory({
        service: 'test',
        environment: 'test',
        createId: () => 'record-1',
        now: () => new Date('2026-08-13T12:00:00.000Z'),
      }),
    );

    logger.debug({ event: 'ignored', message: 'Ignored' });
    logger.child({ requestId: 'request-1' }).info({
      event: 'accepted',
      message: 'Accepted',
      context: { operation: 'test' },
    });

    expect(sink.write).toHaveBeenCalledOnce();
    expect(sink.write.mock.calls[0]?.[0]).toMatchObject({
      event: 'accepted',
      requestId: 'request-1',
      context: { operation: 'test' },
    });

    await logger.close();
    logger.info({ event: 'after-close', message: 'Ignored' });
    expect(sink.write).toHaveBeenCalledOnce();
    expect(sink.flush).toHaveBeenCalledOnce();
    expect(sink.close).toHaveBeenCalledOnce();
  });

  it('waits for asynchronous writes and contains sink failures', async () => {
    const sink = createSink();
    let resolveWrite: (() => void) | undefined;
    sink.write.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveWrite = resolve;
      }),
    );
    sink.flush.mockRejectedValue(new Error('flush failed'));
    sink.close.mockRejectedValue(new Error('close failed'));
    const logger = createLogger({
      service: 'test',
      environment: 'test',
      console: { enabled: false },
      sinks: [sink],
    });

    logger.info({ event: 'async', message: 'Async write' });
    const close = logger.close();
    expect(sink.close).not.toHaveBeenCalled();
    resolveWrite?.();
    await expect(close).resolves.toBeUndefined();
    expect(sink.close).toHaveBeenCalledOnce();
  });

  it('returns the no-op logger when every sink is disabled', () => {
    expect(
      createLogger({
        service: 'test',
        environment: 'test',
        console: { enabled: false },
        loki: { enabled: false, endpoint: 'https://logs.example.com' },
      }),
    ).toBe(noopLogger);
  });

  it('contains synchronous factory and sink write failures', () => {
    const sink = createSink();
    sink.write.mockImplementation(() => {
      throw new Error('write failed');
    });
    const logger = new DefaultLogger(LogLevel.Trace, sink, {
      create: vi.fn(() => {
        throw new Error('factory failed');
      }),
    } as unknown as LogRecordFactory);
    expect(() =>
      logger.fatal({ event: 'failure', message: 'Failure' }),
    ).not.toThrow();

    const realLogger = createLogger({
      service: 'test',
      environment: 'test',
      console: { enabled: false },
      sinks: [sink],
    });
    expect(() =>
      realLogger.info({ event: 'failure', message: 'Failure' }),
    ).not.toThrow();
  });

  it('supports every level and canonical input overload', () => {
    const sink = createSink();
    const logger = new DefaultLogger(
      LogLevel.Trace,
      sink,
      new LogRecordFactory({ service: 'test', environment: 'test' }),
    );

    logger.trace('trace message');
    logger.debug({ component: 'worker' }, 'debug message');
    logger.info({ event: 'info.event', message: 'info message' });
    logger.warn({ operation: 'work', durationMs: 12 }, 'warn message');
    logger.error({ err: new Error('failed') }, 'error message');
    logger.fatal({ event: 'fatal.event', message: 'fatal message' });

    expect(sink.write).toHaveBeenCalledTimes(6);
    expect(sink.write.mock.calls.map(([record]) => record.level)).toEqual([
      LogLevel.Trace,
      LogLevel.Debug,
      LogLevel.Info,
      LogLevel.Warn,
      LogLevel.Error,
      LogLevel.Fatal,
    ]);
    expect(sink.write.mock.calls[1]?.[0]).toMatchObject({
      event: 'application.log',
      message: 'debug message',
      component: 'worker',
    });
    expect(sink.write.mock.calls[4]?.[0]).toMatchObject({
      message: 'error message',
      error: { message: 'failed' },
    });
  });

  it('deduplicates concurrent flush and close operations', async () => {
    const sink = createSink();
    let resolveFlush: (() => void) | undefined;
    sink.flush.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveFlush = resolve;
      }),
    );
    const logger = new DefaultLogger(
      LogLevel.Info,
      sink,
      new LogRecordFactory({ service: 'test', environment: 'test' }),
    );

    const firstFlush = logger.flush();
    const secondFlush = logger.flush();
    expect(secondFlush).toBe(firstFlush);
    resolveFlush?.();
    await firstFlush;

    const firstClose = logger.close();
    const secondClose = logger.close();
    expect(secondClose).toBe(firstClose);
    await firstClose;
    await expect(logger.flush()).resolves.toBeUndefined();
    await expect(logger.close()).resolves.toBeUndefined();
  });
});
