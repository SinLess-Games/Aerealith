import { z } from 'zod';
/**
 * Query parameters for page-based pagination.
 */
export declare const PaginationQuerySchema: z.ZodObject<
  {
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
  },
  z.core.$strip
>;
/**
 * Pagination details returned with a paginated response.
 */
export declare const PaginationMetaSchema: z.ZodObject<
  {
    page: z.ZodNumber;
    limit: z.ZodNumber;
    total: z.ZodNumber;
    totalPages: z.ZodNumber;
    hasNextPage: z.ZodBoolean;
    hasPreviousPage: z.ZodBoolean;
  },
  z.core.$strip
>;
/**
 * Builds a paginated data schema for the provided item schema.
 */
export declare function paginatedDataSchema<TItem extends z.ZodType>(
  itemSchema: TItem,
): z.ZodObject<
  {
    items: z.ZodArray<TItem>;
    pagination: z.ZodObject<
      {
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
        hasNextPage: z.ZodBoolean;
        hasPreviousPage: z.ZodBoolean;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
>;
/**
 * Builds a paginated API response schema.
 */
export declare function paginatedResponseSchema<
  TItem extends z.ZodType,
  TCode extends z.ZodType,
>(
  itemSchema: TItem,
  codeSchema: TCode,
): z.ZodDiscriminatedUnion<
  [
    z.ZodObject<
      {
        ok: z.ZodLiteral<true>;
        data: z.ZodObject<
          {
            items: z.ZodArray<TItem>;
            pagination: z.ZodObject<
              {
                page: z.ZodNumber;
                limit: z.ZodNumber;
                total: z.ZodNumber;
                totalPages: z.ZodNumber;
                hasNextPage: z.ZodBoolean;
                hasPreviousPage: z.ZodBoolean;
              },
              z.core.$strip
            >;
          },
          z.core.$strip
        >;
        meta: z.ZodOptional<
          z.ZodObject<
            {
              requestId: z.ZodOptional<z.ZodString>;
              timestamp: z.ZodOptional<z.ZodISODateTime>;
              path: z.ZodOptional<z.ZodString>;
            },
            z.core.$strip
          >
        >;
      },
      z.core.$strip
    >,
    z.ZodObject<
      {
        ok: z.ZodLiteral<false>;
        error: z.ZodObject<
          {
            code: TCode;
            message: z.ZodString;
            details: z.ZodOptional<z.ZodUnknown>;
          },
          z.core.$strip
        >;
        meta: z.ZodOptional<
          z.ZodObject<
            {
              requestId: z.ZodOptional<z.ZodString>;
              timestamp: z.ZodOptional<z.ZodISODateTime>;
              path: z.ZodOptional<z.ZodString>;
            },
            z.core.$strip
          >
        >;
      },
      z.core.$strip
    >,
  ],
  'ok'
>;
/**
 * Generic paginated response schema for unknown item data.
 */
export declare const PaginatedResponseSchema: z.ZodDiscriminatedUnion<
  [
    z.ZodObject<
      {
        ok: z.ZodLiteral<true>;
        data: z.ZodObject<
          {
            items: z.ZodArray<z.ZodUnknown>;
            pagination: z.ZodObject<
              {
                page: z.ZodNumber;
                limit: z.ZodNumber;
                total: z.ZodNumber;
                totalPages: z.ZodNumber;
                hasNextPage: z.ZodBoolean;
                hasPreviousPage: z.ZodBoolean;
              },
              z.core.$strip
            >;
          },
          z.core.$strip
        >;
        meta: z.ZodOptional<
          z.ZodObject<
            {
              requestId: z.ZodOptional<z.ZodString>;
              timestamp: z.ZodOptional<z.ZodISODateTime>;
              path: z.ZodOptional<z.ZodString>;
            },
            z.core.$strip
          >
        >;
      },
      z.core.$strip
    >,
    z.ZodObject<
      {
        ok: z.ZodLiteral<false>;
        error: z.ZodObject<
          {
            code: z.ZodString;
            message: z.ZodString;
            details: z.ZodOptional<z.ZodUnknown>;
          },
          z.core.$strip
        >;
        meta: z.ZodOptional<
          z.ZodObject<
            {
              requestId: z.ZodOptional<z.ZodString>;
              timestamp: z.ZodOptional<z.ZodISODateTime>;
              path: z.ZodOptional<z.ZodString>;
            },
            z.core.$strip
          >
        >;
      },
      z.core.$strip
    >,
  ],
  'ok'
>;
export type PaginationQueryInput = z.input<typeof PaginationQuerySchema>;
export type PaginationQuerySchemaType = z.output<typeof PaginationQuerySchema>;
export type PaginationMetaSchemaType = z.infer<typeof PaginationMetaSchema>;
export type PaginatedResponseSchemaType = z.infer<
  typeof PaginatedResponseSchema
>;
