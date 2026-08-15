import { LogLevel, type LogRecord, type LogSink } from '@aerealith-ai/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CompositeLogSink } from './sinks/composite-log.sink';
import { ConsoleLogSink } from './sinks/console-log.sink';
import { LokiLogSink } from './sinks/loki-log.sink';

function createRecord(overrides: Partial<LogRecord> = {}): LogRecord {
  return {
    schemaVersion: 1,
    id: 'record-1',
    timestamp: '2026-08-13T12:00:00.000Z',
    level: LogLevel.Info,
    event: 'test.event',
    message: 'Test event',
    service: 'test',
    environment: 'test',
    context: {},
    ...overrides,
  };
}

function createSink(name: string): LogSink & {
  write: ReturnType<typeof vi.fn>;
  flush: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
} {
  return {
    name,
    write: vi.fn(),
    flush: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

describe('logger sinks', () => {
  afterEach(() => vi.restoreAllMocks());

  it('routes console errors to stderr and stops after close', async () => {
    const writer = { log: vi.fn(), error: vi.fn() };
    const sink = new ConsoleLogSink({ color: false }, writer, false);

    sink.write(createRecord());
    sink.write(createRecord({ level: LogLevel.Error }));
    expect(writer.log).toHaveBeenCalledOnce();
    expect(writer.error).toHaveBeenCalledOnce();

    await sink.flush();
    await sink.close();
    sink.write(createRecord());
    expect(writer.log).toHaveBeenCalledOnce();
  });

  it('keeps composite sinks isolated across write, flush, and close failures', async () => {
    const healthy = createSink('healthy');
    const failing = createSink('failing');
    failing.write.mockRejectedValue(new Error('write failed'));
    failing.flush.mockRejectedValue(new Error('flush failed'));
    failing.close.mockRejectedValue(new Error('close failed'));
    const onSinkError = vi.fn(() => {
      throw new Error('handler failed');
    });
    const sink = new CompositeLogSink([failing, healthy], onSinkError);
    const record = createRecord();

    sink.write(record);
    await sink.flush();
    await sink.close();
    sink.write(record);

    expect(healthy.write).toHaveBeenCalledOnce();
    expect(healthy.flush).toHaveBeenCalledTimes(2);
    expect(healthy.close).toHaveBeenCalledOnce();
    expect(onSinkError).toHaveBeenCalledWith(
      expect.objectContaining({ sink: 'failing', operation: 'write', record }),
    );
    expect(onSinkError).toHaveBeenCalledWith(
      expect.objectContaining({ sink: 'failing', operation: 'flush' }),
    );
    expect(onSinkError).toHaveBeenCalledWith(
      expect.objectContaining({ sink: 'failing', operation: 'close' }),
    );
  });

  it('pushes buffered records to a normalized Loki endpoint with tenant headers', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    const sink = new LokiLogSink(
      {
        endpoint: 'https://logs.example.com/',
        tenantId: ' tenant-1 ',
        headers: { Authorization: 'Bearer token' },
        compression: false,
        flushIntervalMs: 60_000,
      },
      fetchMock,
    );

    sink.write(createRecord());
    await sink.flush();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://logs.example.com/loki/api/v1/push',
    );
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(init.method).toBe('POST');
    expect(headers.get('authorization')).toBe('Bearer token');
    expect(headers.get('x-scope-orgid')).toBe('tenant-1');
    expect(headers.get('content-type')).toBe('application/json');
    expect(JSON.parse(String(init.body))).toMatchObject({
      streams: [{ values: [[expect.any(String), expect.any(String)]] }],
    });
    await sink.close();
  });

  it('restores a failed Loki batch so a later flush can retry it', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const sink = new LokiLogSink(
      {
        endpoint: 'https://logs.example.com/loki/api/v1/push',
        maxRetries: 0,
        flushIntervalMs: 60_000,
      },
      fetchMock,
    );

    sink.write(createRecord());
    await expect(sink.flush()).rejects.toThrow('offline');
    await expect(sink.flush()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await sink.close();
  });

  it('validates Loki endpoints and ignores disabled writes', async () => {
    expect(() => new LokiLogSink({ endpoint: ' ' }, vi.fn())).toThrow(
      'A Loki endpoint is required',
    );
    const fetchMock = vi.fn();
    const sink = new LokiLogSink(
      { endpoint: 'https://logs.example.com', enabled: false },
      fetchMock,
    );
    sink.write(createRecord());
    await sink.flush();
    await sink.close();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
