import type { ILogger, LogLevel } from '@sapphire/framework';
import {
  logger as observabilityLogger,
  type ObservabilityLogger,
} from '@aerealith-ai/observability';

type LoggerMethod = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

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

    const error = values.find(
      (value): value is Error => value instanceof Error,
    );
    logger[method]({
      event: `discord.framework.${method}`,
      message: formatMessage(values),
      component: 'discord-framework',
      ...(error === undefined ? {} : { error }),
      context: {
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
