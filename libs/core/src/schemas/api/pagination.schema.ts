// libs/core/src/schemas/api/pagination.schema.ts

import { z } from 'zod'

import { ApiErrorCodeSchema, apiResponseSchema } from './api-response.schema'

/**
 * Query parameters for page-based pagination.
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
})

/**
 * Pagination details returned with a paginated response.
 */
export const PaginationMetaSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
})

/**
 * Builds a paginated data schema for the provided item schema.
 */
export function paginatedDataSchema<TItem extends z.ZodType>(
  itemSchema: TItem,
) {
  return z.object({
    items: z.array(itemSchema),
    pagination: PaginationMetaSchema,
  })
}

/**
 * Builds a paginated API response schema.
 */
export function paginatedResponseSchema<
  TItem extends z.ZodType,
  TCode extends z.ZodType,
>(itemSchema: TItem, codeSchema: TCode) {
  return apiResponseSchema(paginatedDataSchema(itemSchema), codeSchema)
}

/**
 * Generic paginated response schema for unknown item data.
 */
export const PaginatedResponseSchema = paginatedResponseSchema(
  z.unknown(),
  ApiErrorCodeSchema,
)

export type PaginationQueryInput = z.input<typeof PaginationQuerySchema>

export type PaginationQuerySchemaType = z.output<typeof PaginationQuerySchema>

export type PaginationMetaSchemaType = z.infer<typeof PaginationMetaSchema>

export type PaginatedResponseSchemaType = z.infer<
  typeof PaginatedResponseSchema
>
