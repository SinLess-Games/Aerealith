'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.PublicUserEntitySchema =
  exports.UpdateUserEntitySchema =
  exports.CreateUserEntitySchema =
  exports.UserEntitySchema =
  exports.UserTierSchema =
  exports.UserRoleSchema =
  exports.UserLifecycleStatusSchema =
  exports.UserMetadataSchema =
  exports.PasswordHashSchema =
  exports.UserEmailSchema =
  exports.UsernameSchema =
  exports.UserIdSchema =
    void 0;
const zod_1 = require('zod');
const user_entity_1 = require('../../../entities/user/user.entity');
const enumns_1 = require('../../../enumns');
/**
 * Internal user entity ID.
 */
exports.UserIdSchema = zod_1.z.uuid();
/**
 * Usernames are stored lowercase.
 */
exports.UsernameSchema = zod_1.z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(32)
  .regex(/^[a-z0-9_]+$/);
/**
 * User email addresses are stored lowercase.
 */
exports.UserEmailSchema = zod_1.z
  .string()
  .trim()
  .toLowerCase()
  .pipe(zod_1.z.email());
/**
 * Internal password hash.
 *
 * Never use this schema for a raw password submitted by a user.
 */
exports.PasswordHashSchema = zod_1.z.string().trim().min(1).max(1024);
exports.UserMetadataSchema = zod_1.z.record(
  zod_1.z.string(),
  zod_1.z.unknown(),
);
exports.UserLifecycleStatusSchema = zod_1.z.enum(
  user_entity_1.UserLifecycleStatus,
);
exports.UserRoleSchema = zod_1.z.enum(enumns_1.UserRole);
exports.UserTierSchema = zod_1.z.enum(enumns_1.UserTier);
/**
 * Full internal user entity schema.
 *
 * This includes `passwordHash`, so do not use it for public API responses.
 */
exports.UserEntitySchema = zod_1.z.object({
  id: exports.UserIdSchema,
  username: exports.UsernameSchema,
  email: exports.UserEmailSchema,
  passwordHash: exports.PasswordHashSchema.nullable(),
  status: exports.UserLifecycleStatusSchema,
  emailVerified: zod_1.z.boolean(),
  emailVerifiedAt: zod_1.z.coerce.date().nullable(),
  role: exports.UserRoleSchema,
  tier: exports.UserTierSchema,
  metadata: exports.UserMetadataSchema,
  createdAt: zod_1.z.coerce.date(),
  updatedAt: zod_1.z.coerce.date(),
  deletedAt: zod_1.z.coerce.date().nullable(),
});
/**
 * Data accepted when an internal service creates a user entity.
 *
 * Public sign-up requests should continue using `SignUpRequestSchema`.
 */
exports.CreateUserEntitySchema = zod_1.z.object({
  username: exports.UsernameSchema,
  email: exports.UserEmailSchema,
  passwordHash: exports.PasswordHashSchema.nullable().optional(),
  status: exports.UserLifecycleStatusSchema.optional(),
  emailVerified: zod_1.z.boolean().optional(),
  emailVerifiedAt: zod_1.z.coerce.date().nullable().optional(),
  role: exports.UserRoleSchema.optional(),
  tier: exports.UserTierSchema.optional(),
  metadata: exports.UserMetadataSchema.optional(),
});
/**
 * Internal user entity updates.
 *
 * Password updates should use `setPasswordHash()` on `UserEntity`.
 * Email verification should use `verifyEmail()` or `markEmailUnverified()`.
 */
exports.UpdateUserEntitySchema = zod_1.z.object({
  username: exports.UsernameSchema.optional(),
  email: exports.UserEmailSchema.optional(),
  status: exports.UserLifecycleStatusSchema.optional(),
  role: exports.UserRoleSchema.optional(),
  tier: exports.UserTierSchema.optional(),
  metadata: exports.UserMetadataSchema.optional(),
});
/**
 * Safe user data without internal password information.
 */
exports.PublicUserEntitySchema = exports.UserEntitySchema.omit({
  passwordHash: true,
});
//# sourceMappingURL=user.schema.js.map
