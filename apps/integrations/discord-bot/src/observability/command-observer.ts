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

export interface CommandObservation {
  readonly name: string;
  readonly type?: string;
  readonly shardId?: number;
}

export interface CommandObserver {
  observe<T>(
    command: CommandObservation,
    execute: () => Promise<T> | T,
  ): Promise<T>;
}

export interface CommandObserverOptions {
  readonly logger?: ObservabilityLogger;
  readonly metrics?: DiscordMetricsAdapter;
  readonly now?: () => number;
}

/** Observes a command without retaining Discord interaction payloads or IDs. */
export function createCommandObserver(
  options: CommandObserverOptions = {},
): CommandObserver {
  const logger = options.logger ?? defaultLogger;
  const metrics = options.metrics ?? createDiscordMetricsAdapter();
  const now = options.now ?? performance.now.bind(performance);

  return {
    observe<T>(
      command: CommandObservation,
      execute: () => Promise<T> | T,
    ): Promise<T> {
      const type = command.type ?? 'unknown';
      return runWithObservabilityContext(
        {
          component: 'discord-command',
          operation: command.name,
          ...(command.shardId === undefined
            ? {}
            : { shardId: command.shardId }),
        },
        () =>
          withDiscordTrace(
            'command.execute',
            async () => {
              const startedAt = now();
              let outcome: ObservationOutcome = 'success';
              try {
                const result = await execute();
                logger.info({
                  event: 'discord.command.succeeded',
                  message: 'Discord command completed.',
                  component: 'discord-command',
                  operation: command.name,
                  durationMs: elapsed(now, startedAt),
                  context: { command: command.name, type },
                });
                return result;
              } catch (error) {
                outcome = 'failure';
                captureException(error, {
                  component: 'discord-command',
                  operation: command.name,
                  command: command.name,
                  type,
                  shardId: command.shardId,
                });
                logger.error({
                  event: 'discord.command.failed',
                  message: 'Discord command failed.',
                  component: 'discord-command',
                  operation: command.name,
                  error,
                  context: { command: command.name, type },
                });
                throw error;
              } finally {
                metrics.recordCommand(
                  command.name,
                  type,
                  outcome,
                  elapsed(now, startedAt),
                );
              }
            },
            {
              'command.name': command.name,
              'command.type': type,
              'shard.id': command.shardId,
            },
          ),
      );
    },
  };
}

function elapsed(now: () => number, startedAt: number): number {
  return Math.max(0, now() - startedAt);
}
