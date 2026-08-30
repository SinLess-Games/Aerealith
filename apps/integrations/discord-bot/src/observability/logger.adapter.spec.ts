/** Verifies conversion from Sapphire log calls to structured shared logs. */
import type { ObservabilityLogger } from '@aerealith-ai/observability';

import { createDiscordLoggerAdapter } from './logger.adapter';

function createLoggerMock(): jest.Mocked<ObservabilityLogger> {
  // The adapter only depends on this small logger contract, so tests need no
  // concrete sink, exporter, or process-wide observability initialization.
  const logger = {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    child: jest.fn(),
    flush: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ObservabilityLogger>;
  logger.child.mockReturnValue(logger);
  return logger;
}

describe('Discord logger adapter', () => {
  it('preserves primitive messages and structured framework metadata', () => {
    const logger = createLoggerMock();
    const adapter = createDiscordLoggerAdapter(logger);
    const metadata = { shardId: 2 };

    adapter.info(metadata, 'Gateway', 'connected', 2);

    expect(logger.info).toHaveBeenCalledWith({
      event: 'discord.framework.info',
      message: 'Gateway connected 2',
      component: 'discord-framework',
      context: { values: [metadata, 2] },
    });
  });

  it('keeps Error objects available for shared serialization', () => {
    const logger = createLoggerMock();
    const adapter = createDiscordLoggerAdapter(logger);
    const error = new Error('gateway unavailable');

    adapter.error(error, 'Discord request failed.');

    expect(logger.error).toHaveBeenCalledWith({
      event: 'discord.framework.error',
      message: 'Discord request failed.',
      component: 'discord-framework',
      error,
      context: { values: [] },
    });
  });

  it('bounds framework metadata and ignores unsupported levels', () => {
    const logger = createLoggerMock();
    const adapter = createDiscordLoggerAdapter(logger);
    const metadata = Array.from({ length: 25 }, (_, index) => ({ index }));

    adapter.debug(...metadata);
    adapter.write(999 as never, 'ignored');

    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Discord framework event.',
        context: { values: metadata.slice(0, 20) },
      }),
    );
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('routes every Sapphire level to the matching shared logger method', () => {
    const logger = createLoggerMock();
    const adapter = createDiscordLoggerAdapter(logger);

    adapter.trace('trace');
    adapter.warn('warn');
    adapter.fatal('fatal');
    adapter.write(30 as never, 'written info');

    expect(logger.trace).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'trace' }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'warn' }),
    );
    expect(logger.fatal).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'fatal' }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'written info' }),
    );
  });
});
