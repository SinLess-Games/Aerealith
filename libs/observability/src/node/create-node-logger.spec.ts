import { LogLevel } from '@aerealith-ai/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const createLoggerMock = vi.hoisted(() => vi.fn(() => ({ logger: true })));

vi.mock('../logger/create-logger', () => ({
  createLogger: createLoggerMock,
}));

import { createNodeLogger } from './create-node-logger';

describe('createNodeLogger', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps complete Loki credentials and optional logger settings', () => {
    const onSinkError = vi.fn();
    createNodeLogger({
      service: 'auth',
      level: LogLevel.Debug,
      version: '1.0.0',
      onSinkError,
      environment: {
        NODE_ENV: 'production',
        LOKI_LOGGING_URL: ' https://logs.example.com ',
        LOKI_USER_ID: ' user ',
        LOKI_TOKEN: ' token ',
      },
    });

    const options = createLoggerMock.mock.calls[0]?.[0];
    expect(options).toMatchObject({
      service: 'auth',
      environment: 'production',
      level: LogLevel.Debug,
      version: '1.0.0',
      loki: {
        enabled: true,
        endpoint: 'https://logs.example.com',
        labels: { service: 'auth', environment: 'production' },
      },
    });
    expect(options?.loki?.headers?.['Authorization']).toBe(
      `Basic ${Buffer.from('user:token').toString('base64')}`,
    );

    const failure = new Error('sink failed');
    options?.onSinkError?.({
      sink: 'loki',
      operation: 'write',
      error: failure,
    });
    expect(onSinkError).toHaveBeenCalledWith(failure);
  });

  it('defaults to development and omits partial Loki credentials', () => {
    createNodeLogger({
      service: 'api',
      environment: { LOKI_LOGGING_URL: 'https://logs.example.com' },
    });

    expect(createLoggerMock).toHaveBeenCalledWith({
      service: 'api',
      environment: 'development',
    });
  });
});
