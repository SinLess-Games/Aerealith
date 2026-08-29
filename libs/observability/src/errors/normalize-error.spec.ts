import { describe, expect, it } from 'vitest';

import { normalizeError, toError } from './normalize-error';

describe('normalizeError', () => {
  it('normalizes Error instances, codes, causes, and redacted metadata', () => {
    const error = new Error(
      'Database postgresql://admin:secret@db/test failed',
      {
        cause: new Error('offline'),
      },
    ) as Error & { code: string; token: string };
    error.code = 'DB_OFFLINE';
    error.token = 'do-not-report';

    expect(normalizeError(error)).toMatchObject({
      name: 'Error',
      message: 'Database postgresql://[REDACTED]:[REDACTED]@db/test failed',
      code: 'DB_OFFLINE',
      cause: { message: 'offline' },
      context: { token: '[REDACTED]' },
    });
  });

  it('normalizes arbitrary thrown values and undefined', () => {
    expect(normalizeError('failure')).toMatchObject({
      name: 'NonErrorThrown',
      message: 'failure',
    });
    expect(normalizeError({ reason: 'failure' })).toMatchObject({
      name: 'Object',
      context: { reason: 'failure' },
    });
    expect(normalizeError(undefined).message).toBe('undefined was thrown');
    expect(toError('failure')).toBeInstanceOf(Error);
  });
});
