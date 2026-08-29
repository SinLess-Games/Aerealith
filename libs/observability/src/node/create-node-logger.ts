import type { LogContext, LogLevel } from '@aerealith-ai/core';

import type { ConsoleLoggerOptions } from '../logger/config/console-logger-options.interface';
import { createLogger } from '../logger/create-logger';
import type { ObservabilityLogger } from '../logger/logger.types';
import type { ObservabilityEnvironment } from './node-observability.config';

export interface CreateNodeLoggerOptions {
  readonly service: string;
  readonly environment?: ObservabilityEnvironment;
  readonly level?: LogLevel;
  readonly version?: string;
  readonly instanceId?: string;
  readonly context?: LogContext;
  readonly console?: ConsoleLoggerOptions;
  readonly onSinkError?: (error: unknown) => void;
}

export function createNodeLogger(
  options: CreateNodeLoggerOptions,
): ObservabilityLogger {
  const environment = options.environment ?? process.env;
  const endpoint = environment['LOKI_LOGGING_URL']?.trim();
  const user = environment['LOKI_USER_ID']?.trim();
  const token = environment['LOKI_TOKEN']?.trim();
  const deploymentEnvironment =
    environment['NODE_ENV']?.trim() || 'development';
  const authorization =
    user && token
      ? `Basic ${Buffer.from([user, token].join(':')).toString('base64')}`
      : undefined;

  return createLogger({
    service: options.service,
    environment: deploymentEnvironment,
    ...(options.level ? { level: options.level } : {}),
    ...(options.version ? { version: options.version } : {}),
    ...(options.instanceId ? { instanceId: options.instanceId } : {}),
    ...(options.context ? { context: options.context } : {}),
    ...(options.console ? { console: options.console } : {}),
    ...(endpoint && authorization
      ? {
          loki: {
            enabled: true,
            endpoint,
            headers: {
              Authorization: authorization,
            },
            labels: {
              service: options.service,
              environment: deploymentEnvironment,
            },
          },
        }
      : {}),
    ...(options.onSinkError
      ? {
          onSinkError: (failure) => options.onSinkError?.(failure.error),
        }
      : {}),
  });
}
