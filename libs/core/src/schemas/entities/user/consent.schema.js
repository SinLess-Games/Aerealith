'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.UpdateUserConsentContractSchema =
  exports.UserConsentContractSchema =
  exports.UpdateUserConsentEntitySchema =
  exports.CreateUserConsentEntitySchema =
  exports.UserConsentEntitySchema =
  exports.UserConsentTypeSchema =
  exports.UserConsentVersionSchema =
  exports.UserConsentIdSchema =
    void 0;
const zod_1 = require('zod');
const entities_1 = require('../../../entities');
/**
 * Internal user consent record ID.
 */
exports.UserConsentIdSchema = zod_1.z.uuid();
/**
 * Policy, terms, or preference version.
 *
 * Example: 2026-06-19
 */
exports.UserConsentVersionSchema = zod_1.z.string().trim().min(1).max(100);
/**
 * Supported user consent categories.
 */
exports.UserConsentTypeSchema = zod_1.z.enum(entities_1.UserConsentType);
/**
 * Full internal user consent entity schema.
 */
exports.UserConsentEntitySchema = zod_1.z.object({
  id: exports.UserConsentIdSchema,
  userId: zod_1.z.uuid(),
  type: exports.UserConsentTypeSchema,
  version: exports.UserConsentVersionSchema.nullable(),
  grantedAt: zod_1.z.coerce.date().nullable(),
  revokedAt: zod_1.z.coerce.date().nullable(),
  createdAt: zod_1.z.coerce.date(),
  updatedAt: zod_1.z.coerce.date(),
  deletedAt: zod_1.z.coerce.date().nullable(),
});
/**
 * Data accepted when creating a user consent record.
 *
 * A newly created consent record is normally granted immediately.
 */
exports.CreateUserConsentEntitySchema = zod_1.z.object({
  userId: zod_1.z.uuid(),
  type: exports.UserConsentTypeSchema,
  version: exports.UserConsentVersionSchema.nullable().optional(),
  grantedAt: zod_1.z.coerce.date().nullable().optional(),
  revokedAt: zod_1.z.coerce.date().nullable().optional(),
});
/**
 * Data accepted when granting or revoking an existing consent record.
 */
exports.UpdateUserConsentEntitySchema = zod_1.z.object({
  version: exports.UserConsentVersionSchema.nullable().optional(),
  granted: zod_1.z.boolean(),
});
/**
 * API-safe user consent response.
 */
exports.UserConsentContractSchema = zod_1.z.object({
  id: exports.UserConsentIdSchema,
  userId: zod_1.z.uuid(),
  type: exports.UserConsentTypeSchema,
  version: exports.UserConsentVersionSchema.nullable(),
  grantedAt: zod_1.z.iso.datetime().nullable(),
  revokedAt: zod_1.z.iso.datetime().nullable(),
  createdAt: zod_1.z.iso.datetime(),
  updatedAt: zod_1.z.iso.datetime(),
});
/**
 * API request for granting or revoking consent.
 */
exports.UpdateUserConsentContractSchema = zod_1.z.object({
  type: exports.UserConsentTypeSchema,
  version: exports.UserConsentVersionSchema.nullable().optional(),
  granted: zod_1.z.boolean(),
});
//# sourceMappingURL=consent.schema.js.map
