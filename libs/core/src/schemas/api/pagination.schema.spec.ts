// libs/core/src/schemas/api/pagination.schema.spec.ts

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  PaginatedResponseSchema,
  PaginationMetaSchema,
  PaginationQuerySchema,
  paginatedDataSchema,
  paginatedResponseSchema,
} from './pagination.schema';

describe('PaginationQuerySchema', () => {
  it('uses safe defaults when pagination values are omitted', () => {
    const result = PaginationQuerySchema.safeParse({});

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        page: 1,
        limit: 25,
      });
    }
  });

  it('coerces query-string values into numbers', () => {
    const result = PaginationQuerySchema.safeParse({
      page: '2',
      limit: '50',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        page: 2,
        limit: 50,
      });
    }
  });

  it('accepts valid numeric pagination values', () => {
    const result = PaginationQuerySchema.safeParse({
      page: 3,
      limit: 100,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        page: 3,
        limit: 100,
      });
    }
  });

  it('rejects a page lower than one', () => {
    const result = PaginationQuerySchema.safeParse({
      page: 0,
      limit: 25,
    });

    expect(result.success).toBe(false);
  });

  it('rejects a negative page', () => {
    const result = PaginationQuerySchema.safeParse({
      page: -1,
      limit: 25,
    });

    expect(result.success).toBe(false);
  });

  it('rejects a non-integer page', () => {
    const result = PaginationQuerySchema.safeParse({
      page: 1.5,
      limit: 25,
    });

    expect(result.success).toBe(false);
  });

  it('rejects a limit lower than one', () => {
    const result = PaginationQuerySchema.safeParse({
      page: 1,
      limit: 0,
    });

    expect(result.success).toBe(false);
  });

  it('rejects a limit greater than one hundred', () => {
    const result = PaginationQuerySchema.safeParse({
      page: 1,
      limit: 101,
    });

    expect(result.success).toBe(false);
  });

  it('rejects a non-integer limit', () => {
    const result = PaginationQuerySchema.safeParse({
      page: 1,
      limit: 10.5,
    });

    expect(result.success).toBe(false);
  });
});

describe('PaginationMetaSchema', () => {
  it('accepts valid pagination metadata', () => {
    const result = PaginationMetaSchema.safeParse({
      page: 2,
      limit: 25,
      total: 100,
      totalPages: 4,
      hasNextPage: true,
      hasPreviousPage: true,
    });

    expect(result.success).toBe(true);
  });

  it('accepts an empty result set', () => {
    const result = PaginationMetaSchema.safeParse({
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    expect(result.success).toBe(true);
  });

  it('rejects a page lower than one', () => {
    const result = PaginationMetaSchema.safeParse({
      page: 0,
      limit: 25,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    expect(result.success).toBe(false);
  });

  it('rejects a negative total', () => {
    const result = PaginationMetaSchema.safeParse({
      page: 1,
      limit: 25,
      total: -1,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    expect(result.success).toBe(false);
  });

  it('rejects a negative total page count', () => {
    const result = PaginationMetaSchema.safeParse({
      page: 1,
      limit: 25,
      total: 0,
      totalPages: -1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    expect(result.success).toBe(false);
  });

  it('rejects non-integer pagination metadata', () => {
    const result = PaginationMetaSchema.safeParse({
      page: 1.5,
      limit: 25,
      total: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    expect(result.success).toBe(false);
  });
});

describe('paginatedDataSchema', () => {
  const UserSchema = z.object({
    id: z.string().uuid(),
    username: z.string().min(1),
  });

  const PaginatedUserDataSchema = paginatedDataSchema(UserSchema);

  it('accepts valid paginated item data', () => {
    const result = PaginatedUserDataSchema.safeParse({
      items: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          username: 'andy',
        },
      ],
      pagination: {
        page: 1,
        limit: 25,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    expect(result.success).toBe(true);
  });

  it('accepts an empty item list', () => {
    const result = PaginatedUserDataSchema.safeParse({
      items: [],
      pagination: {
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects an item that does not match the item schema', () => {
    const result = PaginatedUserDataSchema.safeParse({
      items: [
        {
          id: 'not-a-uuid',
          username: '',
        },
      ],
      pagination: {
        page: 1,
        limit: 25,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid pagination metadata', () => {
    const result = PaginatedUserDataSchema.safeParse({
      items: [],
      pagination: {
        page: 0,
        limit: 25,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    expect(result.success).toBe(false);
  });
});

describe('paginatedResponseSchema', () => {
  const UserSchema = z.object({
    id: z.string().uuid(),
    username: z.string().min(1),
  });

  const UserErrorCodeSchema = z.enum([
    'USER_NOT_FOUND',
    'USER_LIST_FAILED',
  ]);

  const PaginatedUserResponseSchema = paginatedResponseSchema(
    UserSchema,
    UserErrorCodeSchema,
  );

  const pagination = {
    page: 1,
    limit: 25,
    total: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  it('accepts a successful paginated response', () => {
    const result = PaginatedUserResponseSchema.safeParse({
      ok: true,
      data: {
        items: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            username: 'andy',
          },
        ],
        pagination,
      },
    });

    expect(result.success).toBe(true);
  });

  it('accepts a paginated error response', () => {
    const result = PaginatedUserResponseSchema.safeParse({
      ok: false,
      error: {
        code: 'USER_LIST_FAILED',
        message: 'Unable to load users.',
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects a success response with invalid item data', () => {
    const result = PaginatedUserResponseSchema.safeParse({
      ok: true,
      data: {
        items: [
          {
            id: 'invalid-id',
            username: '',
          },
        ],
        pagination,
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects an error response with an unsupported error code', () => {
    const result = PaginatedUserResponseSchema.safeParse({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unable to load users.',
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects a response missing both paginated data and an error', () => {
    const result = PaginatedUserResponseSchema.safeParse({
      ok: true,
    });

    expect(result.success).toBe(false);
  });
});

describe('PaginatedResponseSchema', () => {
  it('accepts generic paginated success data', () => {
    const result = PaginatedResponseSchema.safeParse({
      ok: true,
      data: {
        items: [
          {
            id: 'item-id',
            value: 'anything',
          },
        ],
        pagination: {
          page: 1,
          limit: 25,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    });

    expect(result.success).toBe(true);
  });

  it('accepts a generic paginated error response', () => {
    const result = PaginatedResponseSchema.safeParse({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong.',
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects a generic paginated error response with an empty code', () => {
    const result = PaginatedResponseSchema.safeParse({
      ok: false,
      error: {
        code: '',
        message: 'Something went wrong.',
      },
    });

    expect(result.success).toBe(false);
  });
});
