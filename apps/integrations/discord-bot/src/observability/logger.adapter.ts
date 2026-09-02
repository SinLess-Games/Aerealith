/** Bridges Sapphire's logger contract to the shared structured logger. */
import type { ILogger, LogLevel } from '@sapphire/framework';
import {
  logger as observabilityLogger,
  type ObservabilityLogger,
} from '@aerealith-ai/observability';

type LoggerMethod = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// Sapphire uses numeric levels; this table maps them to the shared logger's
// named methods without coupling the adapter to a concrete sink such as Pino.
const loggerMethods = new Map<number, LoggerMethod>([
  [10, 'trace'],
  [20, 'debug'],
  [30, 'info'],
  [40, 'warn'],
  [50, 'error'],
  [60, 'fatal'],
]);

/** Adapts the Aerealith logger to Sapphire's small ILogger contract. */
export function createDiscordLoggerAdapter(
  logger: ObservabilityLogger,
): ILogger {
  const write = (level: LogLevel, values: readonly unknown[]): void => {
    const method = loggerMethods.get(Number(level));
    if (method === undefined) return;

    // Preserve an Error object separately so the shared logger can normalize,
    // redact, and serialize its stack instead of flattening it into a string.
    const error = values.find(
      (value): value is Error => value instanceof Error,
    );
    logger[method]({
      event: `discord.framework.${method}`,
      message: formatMessage(values),
      component: 'discord-framework',
      ...(error === undefined ? {} : { error }),
      context: {
        // Bound arbitrary framework metadata to prevent runaway log payloads.
        values: values
          .filter((value) => value !== error && typeof value !== 'string')
          .slice(0, 20),
      },
    });
  };

  return {
    has: (level) => loggerMethods.has(Number(level)),
    trace: (...values) => write(10 as LogLevel, values),
    debug: (...values) => write(20 as LogLevel, values),
    info: (...values) => write(30 as LogLevel, values),
    warn: (...values) => write(40 as LogLevel, values),
    error: (...values) => write(50 as LogLevel, values),
    fatal: (...values) => write(60 as LogLevel, values),
    write: (level, ...values) => write(level, values),
  };
}

function formatMessage(values: readonly unknown[]): string {
  // Only primitive values contribute to the message. Objects stay structured
  // in context and the final length cap protects downstream log backends.
  const parts = values.filter(
    (value): value is string | number | bigint | boolean =>
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'bigint' ||
      typeof value === 'boolean',
  );
  return parts.length === 0
    ? 'Discord framework event.'
    : parts.map(String).join(' ').slice(0, 2_000);
}

/** Stable application logger backed by the shared observability logger proxy. */
export const discordLogger = createDiscordLoggerAdapter(observabilityLogger);
