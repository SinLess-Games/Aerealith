import type { LogLevel, Logger } from '@aerealith-ai/core';

import { createLogger } from '../logger/create-logger';
import type { ObservabilityEnvironment } from './node-observability.config';

export interface CreateNodeLoggerOptions {
  readonly service: string;
  readonly environment?: ObservabilityEnvironment;
  readonly level?: LogLevel;
  readonly version?: string;
  readonly onSinkError?: (error: unknown) => void;
}

export function createNodeLogger(options: CreateNodeLoggerOptions): Logger {
  const environment = options.environment ?? process.env;
  const endpoint = environment['LOKI_LOGGING_URL']?.trim();
  const user = environment['LOKI_USER_ID']?.trim();
  const token = environment['LOKI_TOKEN']?.trim();
  const deploymentEnvironment =
    environment['NODE_ENV']?.trim() || 'development';

  return createLogger({
    service: options.service,
    environment: deploymentEnvironment,
    ...(options.level ? { level: options.level } : {}),
    ...(options.version ? { version: options.version } : {}),
    ...(endpoint && user && token
      ? {
          loki: {
            enabled: true,
            endpoint,
            headers: {
              Authorization: `Basic ${Buffer.from(`${user}:${token}`).toString('base64')}`,
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
