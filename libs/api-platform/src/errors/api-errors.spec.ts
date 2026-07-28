import { AerealithError, AuthErrorCode, HttpStatus } from '@aerealith-ai/core';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { describe, expect, it } from 'vitest';

import { ApiError } from './api-error';
import { ApiErrorCode } from './api-error-code.enum';
import { createHonoErrorHandler } from './hono-error-handler';
import { normalizeApiError } from './normalize-api-error';
import type { ApiEnv } from '../app/api-env.type';

describe('API errors', () => {
  it('constructs default and customized transport-neutral errors', () => {
    const cause = new Error('internal');
    const defaults = new ApiError('Safe message.');
    expect(defaults).toMatchObject({
      name: 'ApiError',
      message: 'Safe message.',
      code: ApiErrorCode.InternalError,
      status: HttpStatus.InternalServerError,
    });

    const customized = new ApiError('Invalid request.', {
      code: 'CUSTOM_CODE',
      status: HttpStatus.BadRequest,
      cause,
      metadata: { field: 'email' },
    });
    expect(customized).toMatchObject({
      code: 'CUSTOM_CODE',
      status: HttpStatus.BadRequest,
      originalCause: cause,
      metadata: { field: 'email' },
    });
  });

  it('returns existing ApiError instances unchanged', () => {
    const error = new ApiError('Safe.');
    expect(normalizeApiError(error)).toBe(error);
  });

  it('maps core application errors', () => {
    const source = new AerealithError('Invalid credentials.', {
      code: AuthErrorCode.INVALID_CREDENTIALS,
      statusCode: HttpStatus.Unauthorized,
    });
    expect(normalizeApiError(source)).toMatchObject({
      message: 'Invalid credentials.',
      code: AuthErrorCode.INVALID_CREDENTIALS,
      status: HttpStatus.Unauthorized,
      originalCause: source,
    });
  });

  it.each([
    [HttpStatus.NotFound, ApiErrorCode.NotFound, 'Resource not found.'],
    [
      HttpStatus.Unauthorized,
      ApiErrorCode.Unauthorized,
      'Authentication required.',
    ],
    [HttpStatus.Forbidden, ApiErrorCode.Forbidden, 'Access denied.'],
    [
      HttpStatus.UnprocessableEntity,
      ApiErrorCode.BadRequest,
      'Request could not be processed.',
    ],
    [
      HttpStatus.ServiceUnavailable,
      ApiErrorCode.InternalError,
      'An unexpected error occurred.',
    ],
  ])('maps HTTP exception status %s safely', (status, code, message) => {
    const source = new HTTPException(status, {
      message: 'private transport detail',
    });
    expect(normalizeApiError(source)).toMatchObject({
      code,
      message,
      status,
      originalCause: source,
    });
  });

  it('masks arbitrary thrown values', () => {
    const source = { database: 'private' };
    expect(normalizeApiError(source)).toMatchObject({
      code: ApiErrorCode.InternalError,
      message: 'An unexpected error occurred.',
      status: HttpStatus.InternalServerError,
      originalCause: source,
    });
  });

  it('handles failures even when request context was not installed', async () => {
    const app = new Hono<ApiEnv>();
    app.onError(createHonoErrorHandler<ApiEnv>());
    app.get('/failure', () => {
      throw new ApiError('Safe failure.', {
        code: ApiErrorCode.BadRequest,
        status: HttpStatus.BadRequest,
      });
    });
    const response = await app.request('/failure');
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: ApiErrorCode.BadRequest,
        message: 'Safe failure.',
        requestId: 'unknown',
      },
    });
  });
});
