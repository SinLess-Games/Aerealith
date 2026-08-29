import { LogLevel, type LogRecord, type LogSink } from '@aerealith-ai/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLogger } from '../logger';
import {
  configureMetrics,
  getMetrics,
  resetMetricsForTesting,
} from '../metrics';
import { measureOperation } from './measure';
import { startTimer } from './timer';

describe('performance measurement', () => {
  afterEach(() => resetMetricsForTesting());

  it('uses an idempotent high-resolution timer', () => {
    const now = vi.fn().mockReturnValueOnce(10).mockReturnValueOnce(18);
    const timer = startTimer(now);
    expect(timer.end()).toBe(8);
    expect(timer.end()).toBe(8);
  });

  it('records successful and failed operation outcomes', async () => {
    configureMetrics({ service: 'test', collectProcessMetrics: false });
    const records: LogRecord[] = [];
    const sink: LogSink = {
      name: 'memory',
      write: (record) => {
        records.push(record);
      },
      flush: () => Promise.resolve(),
      close: () => Promise.resolve(),
    };
    const operationLogger = createLogger({
      service: 'test',
      environment: 'test',
      level: LogLevel.Info,
      console: { enabled: false },
      sinks: [sink],
    });

    await expect(
      measureOperation('job.execute', () => 'done', {
        logger: operationLogger,
        trace: false,
      }),
    ).resolves.toBe('done');
    await expect(
      measureOperation(
        'job.fail',
        () => {
          throw new Error('failed');
        },
        { logger: operationLogger, trace: false },
      ),
    ).rejects.toThrow('failed');

    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      operation: 'job.execute',
      context: { outcome: 'success' },
    });
    const output = await getMetrics();
    expect(output).toContain('operation="job.execute",outcome="success"');
    expect(output).toContain('operation="job.fail",outcome="failure"');
  });
});
