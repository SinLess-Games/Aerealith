// libs/core/src/schemas/api/api-response.schema.spec.ts

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  ApiErrorCodeSchema,
  ApiErrorResponseSchema,
  ApiErrorSchema,
  ApiMetaSchema,
  ApiResponseSchema,
  apiErrorResponseSchema,
  apiResponseSchema,
  apiSuccessResponseSchema,
} from './api-response.schema';

describe('ApiMetaSchema', () => {
  it('accepts valid API metadata', () => {
    const result = ApiMetaSchema.safeParse({
      requestId: 'request-id',
      timestamp: '2026-06-20T12:00:00.000Z',
      path: '/api/V1/users/me',
    });

    expect(result.success).toBe(true);
  });

  it('accepts empty metadata', () => {
    const result = ApiMetaSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('rejects an empty request ID', () => {
    const result = ApiMetaSchema.safeParse({
      requestId: '',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid timestamp', () => {
    const result = ApiMetaSchema.safeParse({
      timestamp: 'not-a-date',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an empty request path', () => {
    const result = ApiMetaSchema.safeParse({
      path: '',
    });

    expect(result.success).toBe(false);
  });
});

describe('ApiErrorSchema', () => {
  it('accepts a valid API error', () => {
    const result = ApiErrorSchema.safeParse({
      code: 'USER_NOT_FOUND',
      message: 'The requested user was not found.',
      details: {
        userId: 'user-id',
      },
    });

    expect(result.success).toBe(true);
  });

  it('accepts an API error without details', () => {
    const result = ApiErrorSchema.safeParse({
      code: 'USER_NOT_FOUND',
      message: 'The requested user was not found.',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an empty error code', () => {
    const result = ApiErrorSchema.safeParse({
      code: '',
      message: 'The requested user was not found.',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an empty error message', () => {
    const result = ApiErrorSchema.safeParse({
      code: 'USER_NOT_FOUND',
      message: '',
    });

    expect(result.success).toBe(false);
  });
});

describe('apiSuccessResponseSchema', () => {
  const UserSchema = z.object({
    id: z.string().min(1),
    username: z.string().min(1),
  });

  const UserSuccessResponseSchema = apiSuccessResponseSchema(UserSchema);

  it('accepts a successful response with valid data', () => {
    const result = UserSuccessResponseSchema.safeParse({
      ok: true,
      data: {
        id: 'user-id',
        username: 'andy',
      },
      meta: {
        requestId: 'request-id',
        timestamp: '2026-06-20T12:00:00.000Z',
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects successful response data that does not match the data schema', () => {
    const result = UserSuccessResponseSchema.safeParse({
      ok: true,
      data: {
        id: '',
        username: '',
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects a success response with ok set to false', () => {
    const result = UserSuccessResponseSchema.safeParse({
      ok: false,
      data: {
        id: 'user-id',
        username: 'andy',
      },
    });

    expect(result.success).toBe(false);
  });
});

describe('apiErrorResponseSchema', () => {
  const UserErrorCodeSchema = z.enum([
    'USER_NOT_FOUND',
    'USER_ALREADY_EXISTS',
  ]);

  const UserErrorResponseSchema = apiErrorResponseSchema(
    UserErrorCodeSchema,
  );

  it('accepts a valid API error response', () => {
    const result = UserErrorResponseSchema.safeParse({
      ok: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'The requested user was not found.',
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects error codes outside the provided code schema', () => {
    const result = UserErrorResponseSchema.safeParse({
      ok: false,
      error: {
        code: 'INVALID_ERROR_CODE',
        message: 'The requested user was not found.',
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects an error response with ok set to true', () => {
    const result = UserErrorResponseSchema.safeParse({
      ok: true,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'The requested user was not found.',
      },
    });

    expect(result.success).toBe(false);
  });
});

describe('apiResponseSchema', () => {
  const UserSchema = z.object({
    id: z.string().min(1),
    username: z.string().min(1),
  });

  const UserErrorCodeSchema = z.enum([
    'USER_NOT_FOUND',
    'USER_ALREADY_EXISTS',
  ]);

  const UserResponseSchema = apiResponseSchema(
    UserSchema,
    UserErrorCodeSchema,
  );

  it('accepts a valid success response', () => {
    const result = UserResponseSchema.safeParse({
      ok: true,
      data: {
        id: 'user-id',
        username: 'andy',
      },
    });

    expect(result.success).toBe(true);
  });

  it('accepts a valid error response', () => {
    const result = UserResponseSchema.safeParse({
      ok: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'The requested user was not found.',
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects a response without success data or error data', () => {
    const result = UserResponseSchema.safeParse({
      ok: true,
    });

    expect(result.success).toBe(false);
  });

  it('rejects an error response with an invalid error code', () => {
    const result = UserResponseSchema.safeParse({
      ok: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Something went wrong.',
      },
    });

    expect(result.success).toBe(false);
  });
});

describe('generic API response schemas', () => {
  it('accepts a generic error response', () => {
    const result = ApiErrorResponseSchema.safeParse({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong.',
      },
    });

    expect(result.success).toBe(true);
  });

  it('accepts a generic success response', () => {
    const result = ApiResponseSchema.safeParse({
      ok: true,
      data: {
        message: 'Success.',
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects a generic error response with an empty code', () => {
    const result = ApiErrorResponseSchema.safeParse({
      ok: false,
      error: {
        code: '',
        message: 'Something went wrong.',
      },
    });

    expect(result.success).toBe(false);
  });

  it('uses the shared generic API error-code schema', () => {
    const result = ApiErrorCodeSchema.safeParse('INTERNAL_ERROR');

    expect(result.success).toBe(true);
  });
});
