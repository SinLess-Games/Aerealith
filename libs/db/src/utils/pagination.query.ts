// libs/db/src/utils/pagination.query.ts

import type { PaginationMeta } from '@aerealith-ai/core';

export type PaginationQuery = Pick<PaginationMeta, 'page' | 'limit'>;

export type DatabasePagination = PaginationQuery & {
  offset: number;
};

export type CreatePaginationMetaInput = {
  page: number;
  limit: number;
  total: number;
};

/**
 * Converts validated pagination values into SQL offset values.
 *
 * Validate request input with the core pagination schema before calling this.
 */
export function createDatabasePagination(
  input: PaginationQuery,
): DatabasePagination {
  const page = Math.max(1, Math.floor(input.page));
  const limit = Math.max(1, Math.floor(input.limit));

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

/**
 * Builds the pagination metadata returned by paginated API responses.
 */
export function createPaginationMeta(
  input: CreatePaginationMetaInput,
): PaginationMeta {
  const page = Math.max(1, Math.floor(input.page));
  const limit = Math.max(1, Math.floor(input.limit));
  const total = Math.max(0, Math.floor(input.total));
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
