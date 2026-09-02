/** Verifies the stable global logger proxy before and after initialization. */
import type { ObservabilityLogger } from './logger.types';
import { logger, resetDefaultLogger, setDefaultLogger } from './global-logger';
import { afterEach, describe, expect, it, vi } from 'vitest';

function createLoggerMock(): ObservabilityLogger & {
  [key: string]: unknown;
} {
  const mock = {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(),
    flush: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  } as unknown as ObservabilityLogger & { [key: string]: unknown };
  vi.mocked(mock.child).mockReturnValue(mock);
  return mock;
}

describe('global logger proxy', () => {
  afterEach(() => resetDefaultLogger());

  it('is a complete safe no-op before initialization', async () => {
    resetDefaultLogger();

    logger.trace('trace');
    logger.debug('debug');
    logger.info('info');
    logger.warn('warn');
    logger.error('error');
    logger.fatal('fatal');

    expect(logger.child({ component: 'child' })).toBeDefined();
    await expect(logger.flush()).resolves.toBeUndefined();
    await expect(logger.close()).resolves.toBeUndefined();
  });

  it('forwards all overloads and lifecycle calls to the active logger', async () => {
    const active = createLoggerMock();
    setDefaultLogger(active);
    const input = { event: 'test.event', message: 'Structured message' };
    const bindings = { component: 'test', shardId: 2 };

    logger.trace('plain message');
    logger.debug(input);
    logger.info(bindings, 'bound message');
    logger.warn('warning');
    logger.error(input);
    logger.fatal(bindings, 'fatal message');

    expect(active.trace).toHaveBeenCalledWith('plain message');
    expect(active.debug).toHaveBeenCalledWith(input);
    expect(active.info).toHaveBeenCalledWith(
      { component: 'test', shardId: 2 },
      'bound message',
    );
    expect(active.warn).toHaveBeenCalledWith('warning');
    expect(active.error).toHaveBeenCalledWith(input);
    expect(active.fatal).toHaveBeenCalledWith(bindings, 'fatal message');
    expect(logger.child({ operation: 'child' })).toBe(active);
    await logger.flush();
    await logger.close();
    expect(active.flush).toHaveBeenCalledOnce();
    expect(active.close).toHaveBeenCalledOnce();
  });
});
