import { HttpStatus } from '@aerealith-ai/core';
import { z } from 'zod';
import { describe, expect, it, vi } from 'vitest';

import { AuthApplicationError } from './auth-application.service';
import {
  normalizeAuthError,
  parseJsonBody,
  success,
  toGraphqlError,
  toTrpcError,
} from './auth-transport.helpers';

function createContext(json: () => Promise<unknown> = async () => ({})) {
  return {
    req: { json, url: 'https://api.example.com/api/V1/auth/login?source=test' },
    get: vi.fn(() => ({ requestId: 'request-1' })),
  } as never;
}

describe('authentication transport helpers', () => {
  it('parses validated JSON request bodies', async () => {
    const schema = z.object({ email: z.email() });
    await expect(
      parseJsonBody(
        createContext(async () => ({ email: 'person@example.com' })),
        schema,
      ),
    ).resolves.toEqual({ email: 'person@example.com' });
  });

  it('rejects malformed JSON and invalid payloads with public API errors', async () => {
    const schema = z.object({ email: z.email() });

    await expect(
      parseJsonBody(
        createContext(async () => {
          throw new SyntaxError('bad json');
        }),
        schema,
      ),
    ).rejects.toMatchObject({ status: HttpStatus.BadRequest });

    await expect(
      parseJsonBody(
        createContext(async () => ({ email: 'invalid' })),
        schema,
      ),
    ).rejects.toMatchObject({
      status: HttpStatus.UnprocessableEntity,
      metadata: { issues: expect.any(Array) },
    });
  });

  it('builds success envelopes from request context', () => {
    expect(success(createContext(), { authenticated: true })).toMatchObject({
      ok: true,
      data: { authenticated: true },
      meta: {
        requestId: 'request-1',
        path: '/api/V1/auth/login',
        timestamp: expect.any(String),
      },
    });
  });

  it('normalizes validation, application, and unknown failures', () => {
    expect(normalizeAuthError(z.email().safeParse('bad').error)).toMatchObject({
      status: HttpStatus.UnprocessableEntity,
    });
    expect(
      normalizeAuthError(
        new AuthApplicationError(
          'REGISTRATION_CONFLICT',
          'Already exists.',
          409,
        ),
      ),
    ).toMatchObject({ code: 'REGISTRATION_CONFLICT', status: 409 });
    expect(normalizeAuthError('unexpected')).toMatchObject({
      status: HttpStatus.InternalServerError,
    });
  });

  it.each([
    [HttpStatus.Unauthorized, 'UNAUTHORIZED'],
    [HttpStatus.Conflict, 'CONFLICT'],
    [HttpStatus.BadRequest, 'BAD_REQUEST'],
    [HttpStatus.InternalServerError, 'INTERNAL_SERVER_ERROR'],
  ])('maps HTTP status %s to tRPC code %s', (status, code) => {
    const error = toTrpcError(
      new AuthApplicationError('AUTH_ERROR', 'Failed.', status),
    );
    expect(error.code).toBe(code);
    expect(error.message).toBe('Failed.');
  });

  it('maps public failure details to GraphQL extensions', () => {
    const original = new AuthApplicationError('INVALID_TOKEN', 'Invalid.', 400);
    const error = toGraphqlError(original);

    expect(error.message).toBe('Invalid.');
    expect(error.extensions).toEqual({
      code: 'INVALID_TOKEN',
      http: { status: 400 },
    });
    expect(error.originalError).toBe(original);
  });
});
