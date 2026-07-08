'use strict';
// libs/core/src/schemas/api/pagination.schema.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.PaginatedResponseSchema =
  exports.PaginationMetaSchema =
  exports.PaginationQuerySchema =
    void 0;
exports.paginatedDataSchema = paginatedDataSchema;
exports.paginatedResponseSchema = paginatedResponseSchema;
const zod_1 = require('zod');
const api_response_schema_1 = require('./api-response.schema');
/**
 * Query parameters for page-based pagination.
 */
exports.PaginationQuerySchema = zod_1.z.object({
  page: zod_1.z.coerce.number().int().min(1).default(1),
  limit: zod_1.z.coerce.number().int().min(1).max(100).default(25),
});
/**
 * Pagination details returned with a paginated response.
 */
exports.PaginationMetaSchema = zod_1.z.object({
  page: zod_1.z.number().int().min(1),
  limit: zod_1.z.number().int().min(1),
  total: zod_1.z.number().int().min(0),
  totalPages: zod_1.z.number().int().min(0),
  hasNextPage: zod_1.z.boolean(),
  hasPreviousPage: zod_1.z.boolean(),
});
/**
 * Builds a paginated data schema for the provided item schema.
 */
function paginatedDataSchema(itemSchema) {
  return zod_1.z.object({
    items: zod_1.z.array(itemSchema),
    pagination: exports.PaginationMetaSchema,
  });
}
/**
 * Builds a paginated API response schema.
 */
function paginatedResponseSchema(itemSchema, codeSchema) {
  return (0, api_response_schema_1.apiResponseSchema)(
    paginatedDataSchema(itemSchema),
    codeSchema,
  );
}
/**
 * Generic paginated response schema for unknown item data.
 */
exports.PaginatedResponseSchema = paginatedResponseSchema(
  zod_1.z.unknown(),
  api_response_schema_1.ApiErrorCodeSchema,
);
//# sourceMappingURL=pagination.schema.js.map
