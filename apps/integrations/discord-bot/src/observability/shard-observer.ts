/** Converts Discord shard lifecycle events into logs, traces, and metrics. */
import {
  captureException,
  logger as defaultLogger,
  type ObservabilityLogger,
} from '@aerealith-ai/observability';

import {
  createDiscordMetricsAdapter,
  type DiscordMetricsAdapter,
} from './metrics.adapter';
import { withDiscordTrace } from './traces.adapter';

/** Safe subset of disconnect information supplied by Discord. */
export interface ShardDisconnectDetails {
  readonly code?: number;
  readonly clean?: boolean;
}

/** Callback-oriented interface suitable for Discord.js shard events. */
export interface ShardObserver {
  ready(shardId: number, unavailableGuilds?: number): void;
  reconnecting(shardId: number): void;
  resumed(shardId: number, replayedEvents: number): void;
  disconnected(shardId: number, details?: ShardDisconnectDetails): void;
  error(shardId: number, error: unknown): void;
}

/** Optional dependencies support child loggers and deterministic tests. */
export interface ShardObserverOptions {
  readonly logger?: ObservabilityLogger;
  readonly metrics?: DiscordMetricsAdapter;
}

/** Records Discord shard lifecycle events with bounded shard labels. */
export function createShardObserver(
  options: ShardObserverOptions = {},
): ShardObserver {
  const logger = options.logger ?? defaultLogger;
  const metrics = options.metrics ?? createDiscordMetricsAdapter();

  const observe = (
    event: string,
    shardId: number,
    connected: boolean | undefined,
    log: () => void,
  ): void => {
    // The shared helper guarantees every lifecycle callback uses the same span
    // naming, event counter, connection gauge, and log ordering.
    withDiscordTrace(
      `shard.${event}`,
      () => {
        metrics.recordShardEvent(event, shardId);
        // Some events report activity without changing connectivity; undefined
        // deliberately leaves the existing gauge value untouched.
        if (connected !== undefined) {
          metrics.setShardConnected(shardId, connected);
        }
        log();
      },
      { 'shard.id': shardId, 'shard.event': event },
    );
  };

  return {
    ready(shardId, unavailableGuilds = 0) {
      observe('ready', shardId, true, () =>
        logger.info({
          event: 'discord.shard.ready',
          message: 'Discord shard is ready.',
          component: 'discord-shard',
          context: { shardId, unavailableGuilds },
        }),
      );
    },
    reconnecting(shardId) {
      observe('reconnecting', shardId, false, () =>
        logger.warn({
          event: 'discord.shard.reconnecting',
          message: 'Discord shard is reconnecting.',
          component: 'discord-shard',
          context: { shardId },
        }),
      );
    },
    resumed(shardId, replayedEvents) {
      observe('resumed', shardId, true, () =>
        logger.info({
          event: 'discord.shard.resumed',
          message: 'Discord shard session resumed.',
          component: 'discord-shard',
          context: { shardId, replayedEvents },
        }),
      );
    },
    disconnected(shardId, details = {}) {
      observe('disconnected', shardId, false, () =>
        logger.warn({
          event: 'discord.shard.disconnected',
          message: 'Discord shard disconnected.',
          component: 'discord-shard',
          context: { shardId, code: details.code, clean: details.clean },
        }),
      );
    },
    error(shardId, error) {
      // Preserve the actual exception for Sentry and structured logger
      // normalization; only the bounded shard ID is attached as context.
      captureException(error, {
        component: 'discord-shard',
        operation: 'shard-error',
        shardId,
      });
      observe('error', shardId, undefined, () =>
        logger.error({
          event: 'discord.shard.error',
          message: 'Discord shard emitted an error.',
          component: 'discord-shard',
          error,
          context: { shardId },
        }),
      );
    },
  };
}
