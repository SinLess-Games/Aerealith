'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ApiResponseSchema =
  exports.ApiErrorResponseSchema =
  exports.ApiErrorSchema =
  exports.ApiErrorCodeSchema =
  exports.ApiMetaSchema =
    void 0;
exports.apiSuccessResponseSchema = apiSuccessResponseSchema;
exports.apiErrorResponseSchema = apiErrorResponseSchema;
exports.apiResponseSchema = apiResponseSchema;
const zod_1 = require('zod');
/**
 * Shared metadata returned with API responses.
 */
exports.ApiMetaSchema = zod_1.z.object({
  requestId: zod_1.z.string().min(1).optional(),
  timestamp: zod_1.z.iso.datetime().optional(),
  path: zod_1.z.string().min(1).optional(),
});
/**
 * Generic API error-code schema.
 */
exports.ApiErrorCodeSchema = zod_1.z.string().min(1);
/**
 * Standard API error payload.
 */
exports.ApiErrorSchema = zod_1.z.object({
  code: exports.ApiErrorCodeSchema,
  message: zod_1.z.string().min(1),
  details: zod_1.z.unknown().optional(),
});
/**
 * Builds a successful API response schema.
 */
function apiSuccessResponseSchema(dataSchema) {
  return zod_1.z.object({
    ok: zod_1.z.literal(true),
    data: dataSchema,
    meta: exports.ApiMetaSchema.optional(),
  });
}
/**
 * Builds an error API response schema.
 */
function apiErrorResponseSchema(codeSchema) {
  return zod_1.z.object({
    ok: zod_1.z.literal(false),
    error: zod_1.z.object({
      code: codeSchema,
      message: zod_1.z.string().min(1),
      details: zod_1.z.unknown().optional(),
    }),
    meta: exports.ApiMetaSchema.optional(),
  });
}
/**
 * Builds a complete API response schema.
 */
function apiResponseSchema(dataSchema, codeSchema) {
  return zod_1.z.discriminatedUnion('ok', [
    apiSuccessResponseSchema(dataSchema),
    apiErrorResponseSchema(codeSchema),
  ]);
}
/**
 * Generic error response schema.
 */
exports.ApiErrorResponseSchema = apiErrorResponseSchema(
  exports.ApiErrorCodeSchema,
);
/**
 * Generic API response schema for unknown response data.
 */
exports.ApiResponseSchema = apiResponseSchema(
  zod_1.z.unknown(),
  exports.ApiErrorCodeSchema,
);
//# sourceMappingURL=api-response.schema.js.map
