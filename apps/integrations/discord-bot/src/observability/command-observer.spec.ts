/** Verifies command outcomes without requiring Discord or telemetry exporters. */
import type { ObservabilityLogger } from '@aerealith-ai/observability';

import { createCommandObserver } from './command-observer';
import type { DiscordMetricsAdapter } from './metrics.adapter';

function createLoggerMock(): jest.Mocked<ObservabilityLogger> {
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

function createMetricsMock(): jest.Mocked<DiscordMetricsAdapter> {
  return {
    setBotReady: jest.fn(),
    setGuildCount: jest.fn(),
    setGatewayLatency: jest.fn(),
    recordCommand: jest.fn(),
    recordGatewayEvent: jest.fn(),
    recordShardEvent: jest.fn(),
    setShardConnected: jest.fn(),
    recordLavalinkEvent: jest.fn(),
    setLavalinkNodeConnected: jest.fn(),
  };
}

describe('Command observer', () => {
  it('returns successful results and records their outcome', async () => {
    const logger = createLoggerMock();
    const metrics = createMetricsMock();
    const now = jest
      .fn<() => number>()
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(125)
      .mockReturnValueOnce(125);
    const observer = createCommandObserver({ logger, metrics, now });

    await expect(
      observer.observe(
        { name: 'ping', type: 'chat-input', shardId: 1 },
        async () => 'pong',
      ),
    ).resolves.toBe('pong');

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'discord.command.succeeded',
        operation: 'ping',
        durationMs: 25,
      }),
    );
    expect(metrics.recordCommand).toHaveBeenCalledWith(
      'ping',
      'chat-input',
      'success',
      25,
    );
  });

  it('rethrows failures after logging and recording them', async () => {
    const logger = createLoggerMock();
    const metrics = createMetricsMock();
    const now = jest
      .fn<() => number>()
      .mockReturnValueOnce(200)
      .mockReturnValueOnce(240);
    const observer = createCommandObserver({ logger, metrics, now });
    const failure = new Error('command failed');

    await expect(
      observer.observe({ name: 'ping' }, async () => {
        throw failure;
      }),
    ).rejects.toBe(failure);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'discord.command.failed',
        operation: 'ping',
        error: failure,
      }),
    );
    expect(metrics.recordCommand).toHaveBeenCalledWith(
      'ping',
      'unknown',
      'failure',
      40,
    );
  });
});
