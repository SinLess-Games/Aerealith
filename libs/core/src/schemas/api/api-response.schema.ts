// libs/core/src/schemas/api/api-response.schema.ts

import { z } from 'zod';

/**
 * Shared metadata returned with API responses.
 */
export const ApiMetaSchema = z.object({
  requestId: z.string().min(1).optional(),
  timestamp: z.string().datetime().optional(),
  path: z.string().min(1).optional(),
});

/**
 * Generic API error-code schema.
 */
export const ApiErrorCodeSchema = z.string().min(1);

/**
 * Standard API error payload.
 */
export const ApiErrorSchema = z.object({
  code: ApiErrorCodeSchema,
  message: z.string().min(1),
  details: z.unknown().optional(),
});

/**
 * Builds a successful API response schema.
 */
export function apiSuccessResponseSchema<TData extends z.ZodType>(
  dataSchema: TData,
) {
  return z.object({
    ok: z.literal(true),
    data: dataSchema,
    meta: ApiMetaSchema.optional(),
  });
}

/**
 * Builds an error API response schema.
 */
export function apiErrorResponseSchema<TCode extends z.ZodType>(
  codeSchema: TCode,
) {
  return z.object({
    ok: z.literal(false),
    error: z.object({
      code: codeSchema,
      message: z.string().min(1),
      details: z.unknown().optional(),
    }),
    meta: ApiMetaSchema.optional(),
  });
}

/**
 * Builds a complete API response schema.
 */
export function apiResponseSchema<
  TData extends z.ZodType,
  TCode extends z.ZodType,
>(dataSchema: TData, codeSchema: TCode) {
  return z.discriminatedUnion('ok', [
    apiSuccessResponseSchema(dataSchema),
    apiErrorResponseSchema(codeSchema),
  ]);
}

/**
 * Generic error response schema.
 */
export const ApiErrorResponseSchema = apiErrorResponseSchema(
  ApiErrorCodeSchema,
);

/**
 * Generic API response schema for unknown response data.
 */
export const ApiResponseSchema = apiResponseSchema(
  z.unknown(),
  ApiErrorCodeSchema,
);

export type ApiMetaSchemaType = z.infer<typeof ApiMetaSchema>;

export type ApiErrorSchemaType = z.infer<typeof ApiErrorSchema>;

export type ApiErrorResponseSchemaType = z.infer<
  typeof ApiErrorResponseSchema
>;

export type ApiResponseSchemaType = z.infer<typeof ApiResponseSchema>;