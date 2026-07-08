'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.UserAccountContractSchema =
  exports.UpdateUserAccountEntitySchema =
  exports.CreateUserAccountEntitySchema =
  exports.UserAccountEntitySchema =
  exports.UserAccountManagementUrlSchema =
  exports.UserAccountDisplayNameSchema =
  exports.UserAccountProviderIdSchema =
  exports.UserAccountProviderSchema =
  exports.UserAccountIdSchema =
  exports.UserAccountStatusSchema =
  exports.UserAccountStatusValues =
    void 0;
const zod_1 = require('zod');
exports.UserAccountStatusValues = ['active', 'revoked', 'suspended', 'expired'];
exports.UserAccountStatusSchema = zod_1.z.enum(exports.UserAccountStatusValues);
/**
 * Internal user account entity ID.
 */
exports.UserAccountIdSchema = zod_1.z.uuid();
/**
 * External provider name.
 *
 * Examples: google, github, discord.
 */
exports.UserAccountProviderSchema = zod_1.z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(100);
/**
 * Provider-side account identifier.
 */
exports.UserAccountProviderIdSchema = zod_1.z.string().trim().min(1).max(255);
/**
 * Human-readable linked account display name.
 */
exports.UserAccountDisplayNameSchema = zod_1.z.string().trim().min(1).max(100);
/**
 * External account-management URL.
 */
exports.UserAccountManagementUrlSchema = zod_1.z
  .string()
  .trim()
  .pipe(zod_1.z.url());
/**
 * Full internal linked-account entity schema.
 */
exports.UserAccountEntitySchema = zod_1.z.object({
  id: exports.UserAccountIdSchema,
  userId: zod_1.z.uuid(),
  provider: exports.UserAccountProviderSchema,
  accountId: exports.UserAccountProviderIdSchema,
  displayName: exports.UserAccountDisplayNameSchema,
  managementUrl: exports.UserAccountManagementUrlSchema.nullable(),
  status: exports.UserAccountStatusSchema,
  connectedAt: zod_1.z.coerce.date(),
  createdAt: zod_1.z.coerce.date(),
  updatedAt: zod_1.z.coerce.date(),
  deletedAt: zod_1.z.coerce.date().nullable(),
});
/**
 * Data accepted when linking an external account to a user.
 */
exports.CreateUserAccountEntitySchema = zod_1.z.object({
  userId: zod_1.z.uuid(),
  provider: exports.UserAccountProviderSchema,
  accountId: exports.UserAccountProviderIdSchema,
  displayName: exports.UserAccountDisplayNameSchema,
  managementUrl: exports.UserAccountManagementUrlSchema.nullable().optional(),
  status: exports.UserAccountStatusSchema.optional(),
  connectedAt: zod_1.z.coerce.date().optional(),
});
/**
 * Data allowed when updating a linked external account.
 */
exports.UpdateUserAccountEntitySchema = zod_1.z.object({
  displayName: exports.UserAccountDisplayNameSchema.optional(),
  managementUrl: exports.UserAccountManagementUrlSchema.nullable().optional(),
  status: exports.UserAccountStatusSchema.optional(),
});
/**
 * Linked account data safe to return to the owning user.
 */
exports.UserAccountContractSchema = zod_1.z.object({
  id: exports.UserAccountIdSchema,
  provider: exports.UserAccountProviderSchema,
  displayName: exports.UserAccountDisplayNameSchema,
  managementUrl: exports.UserAccountManagementUrlSchema.nullable(),
  status: exports.UserAccountStatusSchema,
  connectedAt: zod_1.z.iso.datetime(),
  createdAt: zod_1.z.iso.datetime(),
  updatedAt: zod_1.z.iso.datetime(),
});
//# sourceMappingURL=account.schema.js.map
