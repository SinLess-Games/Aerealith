import { noopLogger } from '@aerealith-ai/core';
import { describe, expect, it } from 'vitest';

import { createTestApiContext } from './create-test-api-context';
import { TestLogger } from './test-logger';

describe('API platform testing utilities', () => {
  it('creates deterministic default and customized contexts', () => {
    expect(createTestApiContext()).toEqual({
      requestId: 'test-request-id',
      logger: noopLogger,
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const logger = new TestLogger();
    const startedAt = new Date('2026-07-27T00:00:00.000Z');
    expect(
      createTestApiContext({
        requestId: 'request-1',
        correlationId: 'correlation-1',
        logger,
        principal: { id: 'user-1' },
        startedAt,
      }),
    ).toEqual({
      requestId: 'request-1',
      correlationId: 'correlation-1',
      logger,
      principal: { id: 'user-1' },
      startedAt,
    });
  });

  it('records every log level, child context, and lifecycle method', async () => {
    const logger = new TestLogger();
    const inputs = [
      { event: 'trace', message: 'trace' },
      { event: 'debug', message: 'debug' },
      { event: 'info', message: 'info' },
      { event: 'warn', message: 'warn' },
      { event: 'error', message: 'error' },
      { event: 'fatal', message: 'fatal' },
    ] as const;
    logger.trace(inputs[0]);
    logger.debug(inputs[1]);
    logger.info(inputs[2]);
    logger.warn(inputs[3]);
    logger.error(inputs[4]);
    logger.fatal(inputs[5]);

    expect(logger.records).toEqual(inputs);
    expect(logger.child({ requestId: 'request-1' })).toBe(logger);
    expect(logger.childContexts).toEqual([{ requestId: 'request-1' }]);
    await expect(logger.flush()).resolves.toBeUndefined();
    await expect(logger.close()).resolves.toBeUndefined();
  });
});
