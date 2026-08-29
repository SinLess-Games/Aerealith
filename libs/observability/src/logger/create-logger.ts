// libs/observability/src/logger/create-logger.ts

import { LogLevel, noopLogger, type LogSink } from '@aerealith-ai/core';

import type { LoggerOptions } from './config/logger-options.interface';
import { getObservabilityContext } from '../context';
import { DefaultLogger } from './default-logger';
import { LogRecordFactory } from './factories/log-record.factory';
import { CompositeLogSink } from './sinks/composite-log.sink';
import { ConsoleLogSink } from './sinks/console-log.sink';
import { LokiLogSink } from './sinks/loki-log.sink';
import { PinoLogSink } from './sinks/pino-log.sink';
import type { ObservabilityLogger } from './logger.types';

/**
 * Creates a configured Aerealith structured logger.
 *
 * Console logging is enabled by default. Loki logging is enabled when Loki
 * configuration is supplied and its `enabled` option is not set to `false`.
 *
 * Additional custom sinks are appended to the configured built-in sinks.
 */
export function createLogger(options: LoggerOptions): ObservabilityLogger {
  const sinks = createLogSinks(options);

  if (sinks.length === 0) {
    return noopLogger as ObservabilityLogger;
  }

  const compositeSink = new CompositeLogSink(sinks, options.onSinkError);

  const recordFactory = new LogRecordFactory({
    service: options.service,
    environment: options.environment,
    version: options.version,
    instanceId: options.instanceId,
    context: options.context,
    contextProvider: options.contextProvider ?? getObservabilityContext,
    createId: options.createId,
    now: options.now,
  });

  return new DefaultLogger(
    options.level ?? LogLevel.Info,
    compositeSink,
    recordFactory,
  );
}

function createLogSinks(options: LoggerOptions): readonly LogSink[] {
  const sinks: LogSink[] = [];

  if (options.console?.enabled !== false) {
    const pretty =
      options.console?.pretty ?? options.environment !== 'production';
    sinks.push(
      pretty
        ? new ConsoleLogSink({ ...options.console, pretty: true })
        : new PinoLogSink(),
    );
  }

  if (options.loki !== undefined && options.loki.enabled !== false) {
    sinks.push(new LokiLogSink(options.loki));
  }

  if (options.sinks !== undefined) {
    sinks.push(...options.sinks);
  }

  return sinks;
}
