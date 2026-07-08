import { z } from 'zod';
/**
 * Shared metadata returned with API responses.
 */
export declare const ApiMetaSchema: z.ZodObject<
  {
    requestId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodISODateTime>;
    path: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
>;
/**
 * Generic API error-code schema.
 */
export declare const ApiErrorCodeSchema: z.ZodString;
/**
 * Standard API error payload.
 */
export declare const ApiErrorSchema: z.ZodObject<
  {
    code: z.ZodString;
    message: z.ZodString;
    details: z.ZodOptional<z.ZodUnknown>;
  },
  z.core.$strip
>;
/**
 * Builds a successful API response schema.
 */
export declare function apiSuccessResponseSchema<TData extends z.ZodType>(
  dataSchema: TData,
): z.ZodObject<
  {
    ok: z.ZodLiteral<true>;
    data: TData;
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
>;
/**
 * Builds an error API response schema.
 */
export declare function apiErrorResponseSchema<TCode extends z.ZodType>(
  codeSchema: TCode,
): z.ZodObject<
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
>;
/**
 * Builds a complete API response schema.
 */
export declare function apiResponseSchema<
  TData extends z.ZodType,
  TCode extends z.ZodType,
>(
  dataSchema: TData,
  codeSchema: TCode,
): z.ZodDiscriminatedUnion<
  [
    z.ZodObject<
      {
        ok: z.ZodLiteral<true>;
        data: TData;
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
 * Generic error response schema.
 */
export declare const ApiErrorResponseSchema: z.ZodObject<
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
>;
/**
 * Generic API response schema for unknown response data.
 */
export declare const ApiResponseSchema: z.ZodDiscriminatedUnion<
  [
    z.ZodObject<
      {
        ok: z.ZodLiteral<true>;
        data: z.ZodUnknown;
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
export type ApiMetaSchemaType = z.infer<typeof ApiMetaSchema>;
export type ApiErrorSchemaType = z.infer<typeof ApiErrorSchema>;
export type ApiErrorResponseSchemaType = z.infer<typeof ApiErrorResponseSchema>;
export type ApiResponseSchemaType = z.infer<typeof ApiResponseSchema>;
