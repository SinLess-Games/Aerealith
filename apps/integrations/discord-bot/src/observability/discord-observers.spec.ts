/** Verifies gateway, shard, and Lavalink lifecycle telemetry adapters. */
import type { ObservabilityLogger } from '@aerealith-ai/observability';

import { createGatewayObserver } from './gateway-observer';
import { createLavalinkObserver } from './lavalink-observer';
import type { DiscordMetricsAdapter } from './metrics.adapter';
import { createShardObserver } from './shard-observer';

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

describe('Discord lifecycle observers', () => {
  it('provides safe default collaborators for each observer', async () => {
    await expect(
      createGatewayObserver().observe({ event: 'ready' }, () => undefined),
    ).resolves.toBeUndefined();
    expect(() => createShardObserver().ready(0)).not.toThrow();
    expect(() => createLavalinkObserver().trackStarted()).not.toThrow();
  });

  it('returns gateway handler results and records successful duration', async () => {
    const logger = createLoggerMock();
    const metrics = createMetricsMock();
    const now = jest
      .fn<number, []>()
      .mockReturnValueOnce(10)
      .mockReturnValueOnce(30)
      .mockReturnValueOnce(30);
    const observer = createGatewayObserver({ logger, metrics, now });

    await expect(
      observer.observe({ event: 'guildCreate', shardId: 1 }, () => 'handled'),
    ).resolves.toBe('handled');

    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'discord.gateway.event.handled',
        operation: 'guildCreate',
        durationMs: 20,
      }),
    );
    expect(metrics.recordGatewayEvent).toHaveBeenCalledWith(
      'guildCreate',
      'success',
      20,
    );
  });

  it('rethrows gateway failures after recording them', async () => {
    const logger = createLoggerMock();
    const metrics = createMetricsMock();
    const now = jest
      .fn<number, []>()
      .mockReturnValueOnce(50)
      .mockReturnValueOnce(80);
    const observer = createGatewayObserver({ logger, metrics, now });
    const failure = new Error('handler failed');

    await expect(
      observer.observe({ event: 'messageCreate' }, () => {
        throw failure;
      }),
    ).rejects.toBe(failure);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'discord.gateway.event.failed',
        error: failure,
      }),
    );
    expect(metrics.recordGatewayEvent).toHaveBeenCalledWith(
      'messageCreate',
      'failure',
      30,
    );
  });

  it('tracks shard connectivity while leaving error state unchanged', () => {
    const logger = createLoggerMock();
    const metrics = createMetricsMock();
    const observer = createShardObserver({ logger, metrics });
    const failure = new Error('shard failed');

    observer.ready(2, 3);
    observer.error(2, failure);

    expect(metrics.recordShardEvent).toHaveBeenNthCalledWith(1, 'ready', 2);
    expect(metrics.recordShardEvent).toHaveBeenNthCalledWith(2, 'error', 2);
    expect(metrics.setShardConnected).toHaveBeenCalledTimes(1);
    expect(metrics.setShardConnected).toHaveBeenCalledWith(2, true);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'discord.shard.ready',
        context: { shardId: 2, unavailableGuilds: 3 },
      }),
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'discord.shard.error',
        error: failure,
      }),
    );
  });

  it('records every non-error shard lifecycle transition', () => {
    const logger = createLoggerMock();
    const metrics = createMetricsMock();
    const observer = createShardObserver({ logger, metrics });

    observer.reconnecting(3);
    observer.resumed(3, 7);
    observer.disconnected(3, { code: 1001, clean: true });
    observer.disconnected(3);

    expect(metrics.recordShardEvent.mock.calls).toEqual([
      ['reconnecting', 3],
      ['resumed', 3],
      ['disconnected', 3],
      ['disconnected', 3],
    ]);
    expect(metrics.setShardConnected.mock.calls).toEqual([
      [3, false],
      [3, true],
      [3, false],
      [3, false],
    ]);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'discord.shard.disconnected',
        context: { shardId: 3, code: 1001, clean: true },
      }),
    );
  });

  it('records Lavalink node state and omits track payload metadata', () => {
    const logger = createLoggerMock();
    const metrics = createMetricsMock();
    const observer = createLavalinkObserver({ logger, metrics });
    const failure = new Error('track failed');

    observer.connected('primary');
    observer.trackFailed(failure, 'primary');

    expect(metrics.setLavalinkNodeConnected).toHaveBeenCalledWith(
      'primary',
      true,
    );
    expect(metrics.recordLavalinkEvent).toHaveBeenNthCalledWith(
      1,
      'connected',
      'success',
      'primary',
    );
    expect(metrics.recordLavalinkEvent).toHaveBeenNthCalledWith(
      2,
      'track_failed',
      'failure',
      'primary',
    );
    expect(logger.error).toHaveBeenCalledWith({
      event: 'discord.lavalink.track.failed',
      message: 'Lavalink track failed.',
      component: 'discord-lavalink',
      error: failure,
      context: { node: 'primary' },
    });
  });

  it('records remaining Lavalink connection and track transitions', () => {
    const logger = createLoggerMock();
    const metrics = createMetricsMock();
    const observer = createLavalinkObserver({ logger, metrics });
    const failure = new Error('node failed');

    observer.reconnecting('secondary');
    observer.disconnected('secondary', 4000);
    observer.error('secondary', failure);
    observer.trackStarted();
    observer.trackEnded('finished', 'secondary');

    expect(metrics.setLavalinkNodeConnected.mock.calls).toEqual([
      ['secondary', false],
      ['secondary', false],
    ]);
    expect(metrics.recordLavalinkEvent.mock.calls).toEqual([
      ['reconnecting', 'success', 'secondary'],
      ['disconnected', 'failure', 'secondary'],
      ['error', 'failure', 'secondary'],
      ['track_started', 'success', undefined],
      ['track_ended', 'success', 'secondary'],
    ]);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'discord.lavalink.error',
        error: failure,
      }),
    );
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'discord.lavalink.track.ended',
        context: { node: 'secondary', reason: 'finished' },
      }),
    );
  });
});
