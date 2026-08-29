import { Writable } from 'node:stream';

import { LogLevel, type LogRecord, type LogSink } from '@aerealith-ai/core';
import { describe, expect, it } from 'vitest';

import { runWithObservabilityContext } from '../context';
import { createLogger } from './create-logger';
import { PinoLogSink } from './sinks/pino-log.sink';

describe('Pino-backed logging', () => {
  it('supports Pino-style bindings, child metadata, and async context', () => {
    const records: LogRecord[] = [];
    const sink: LogSink = {
      name: 'memory',
      write: (record) => {
        records.push(record);
      },
      flush: () => Promise.resolve(),
      close: () => Promise.resolve(),
    };
    const logger = createLogger({
      service: 'discord-bot',
      environment: 'test',
      console: { enabled: false },
      sinks: [sink],
    });

    runWithObservabilityContext(
      { correlationId: 'corr-1', requestId: 'request-1' },
      () => {
        logger
          .child({ shardId: 3 })
          .error(
            { err: new Error('Command failed'), guildId: 'guild-1' },
            'Command failed',
          );
      },
    );

    expect(records[0]).toMatchObject({
      level: LogLevel.Error,
      message: 'Command failed',
      correlationId: 'corr-1',
      requestId: 'request-1',
      error: { message: 'Command failed' },
      context: { shardId: 3, guildId: 'guild-1' },
    });
  });

  it('emits production records as structured Pino JSON', async () => {
    let output = '';
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        output += String(chunk);
        callback();
      },
    });
    const sink = new PinoLogSink({
      destination,
      hostname: 'host-1',
      pid: 42,
    });

    sink.write(createRecord());
    await sink.flush();

    expect(JSON.parse(output.trim())).toMatchObject({
      hostname: 'host-1',
      pid: 42,
      level: 'info',
      service: 'auth',
      message: 'Started',
    });
  });
});

function createRecord(): LogRecord {
  return {
    schemaVersion: 1,
    id: 'record-1',
    timestamp: '2026-08-27T12:00:00.000Z',
    level: LogLevel.Info,
    event: 'service.started',
    message: 'Started',
    service: 'auth',
    environment: 'production',
    context: {},
  };
}
