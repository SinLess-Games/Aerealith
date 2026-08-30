/** Observes Discord command execution without retaining interaction payloads. */
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

/** Low-cardinality facts that identify a command execution. */
export interface CommandObservation {
  readonly name: string;
  readonly type?: string;
  readonly shardId?: number;
}

/** Wrapper contract used by command pieces to add shared telemetry. */
export interface CommandObserver {
  observe<T>(
    command: CommandObservation,
    execute: () => Promise<T> | T,
  ): Promise<T>;
}

/** Injectable collaborators keep the adapter deterministic in unit tests. */
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
  // performance.now is monotonic, so clock adjustments cannot corrupt duration.
  const now = options.now ?? performance.now.bind(performance);

  return {
    observe<T>(
      command: CommandObservation,
      execute: () => Promise<T> | T,
    ): Promise<T> {
      const type = command.type ?? 'unknown';
      // AsyncLocalStorage makes these values available to nested logs and
      // Sentry scopes without passing metadata through every function call.
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
                // Report the original thrown value, then rethrow it so Sapphire
                // retains ownership of user-facing command error behavior.
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
                // finally guarantees one duration/count observation for both
                // successful and failed executions.
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
  // Clamp invalid clocks to zero instead of emitting an invalid histogram value.
  return Math.max(0, now() - startedAt);
}
