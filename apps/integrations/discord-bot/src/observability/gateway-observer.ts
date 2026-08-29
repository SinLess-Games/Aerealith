import {
  captureException,
  logger as defaultLogger,
  runWithObservabilityContext,
  type ObservabilityLogger,
} from '@aerealith-ai/observability';

import {
  createDiscordMetricsAdapter,
  type DiscordMetricsAdapter,
  type ObservationOutcome,
} from './metrics.adapter';
import { withDiscordTrace } from './traces.adapter';

export interface GatewayObservation {
  readonly event: string;
  readonly shardId?: number;
}

export interface GatewayObserver {
  observe<T>(
    observation: GatewayObservation,
    execute: () => Promise<T> | T,
  ): Promise<T>;
}

export interface GatewayObserverOptions {
  readonly logger?: ObservabilityLogger;
  readonly metrics?: DiscordMetricsAdapter;
  readonly now?: () => number;
}

/** Measures gateway handlers while keeping raw Discord payloads out of telemetry. */
export function createGatewayObserver(
  options: GatewayObserverOptions = {},
): GatewayObserver {
  const logger = options.logger ?? defaultLogger;
  const metrics = options.metrics ?? createDiscordMetricsAdapter();
  const now = options.now ?? performance.now.bind(performance);

  return {
    observe<T>(
      observation: GatewayObservation,
      execute: () => Promise<T> | T,
    ): Promise<T> {
      return runWithObservabilityContext(
        {
          component: 'discord-gateway',
          operation: observation.event,
          ...(observation.shardId === undefined
            ? {}
            : { shardId: observation.shardId }),
        },
        () =>
          withDiscordTrace(
            'gateway.handle',
            async () => {
              const startedAt = now();
              let outcome: ObservationOutcome = 'success';
              try {
                const result = await execute();
                logger.debug({
                  event: 'discord.gateway.event.handled',
                  message: 'Discord gateway event handled.',
                  component: 'discord-gateway',
                  operation: observation.event,
                  durationMs: elapsed(now, startedAt),
                  context: { event: observation.event },
                });
                return result;
              } catch (error) {
                outcome = 'failure';
                captureException(error, {
                  component: 'discord-gateway',
                  operation: observation.event,
                  event: observation.event,
                  shardId: observation.shardId,
                });
                logger.error({
                  event: 'discord.gateway.event.failed',
                  message: 'Discord gateway event handler failed.',
                  component: 'discord-gateway',
                  operation: observation.event,
                  error,
                  context: { event: observation.event },
                });
                throw error;
              } finally {
                metrics.recordGatewayEvent(
                  observation.event,
                  outcome,
                  elapsed(now, startedAt),
                );
              }
            },
            {
              'gateway.event': observation.event,
              'shard.id': observation.shardId,
            },
          ),
      );
    },
  };
}

function elapsed(now: () => number, startedAt: number): number {
  return Math.max(0, now() - startedAt);
}
