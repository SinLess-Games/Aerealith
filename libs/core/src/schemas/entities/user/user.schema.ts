// libs/core/src/schemas/entitites/user/user.schema.ts

import { z } from 'zod';

import {
  UserRole,
  UserTier,
} from '../../../enumns';
import { UserLifecycleStatus } from '../../../entities/user/user.entity';

/**
 * Internal user entity ID.
 */
export const UserIdSchema = z.string().uuid();

/**
 * Usernames are stored lowercase.
 */
export const UsernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(32)
  .regex(/^[a-z0-9_]+$/);

/**
 * User email addresses are stored lowercase.
 */
export const UserEmailSchema = z.string().trim().toLowerCase().email();

/**
 * Internal password hash.
 *
 * Never use this schema for a raw password submitted by a user.
 */
export const PasswordHashSchema = z.string().trim().min(1).max(1024);

export const UserMetadataSchema = z.record(z.string(), z.unknown());

export const UserLifecycleStatusSchema = z.enum(UserLifecycleStatus);

export const UserRoleSchema = z.enum(UserRole);

export const UserTierSchema = z.enum(UserTier);

/**
 * Full internal user entity schema.
 *
 * This includes `passwordHash`, so do not use it for public API responses.
 */
export const UserEntitySchema = z.object({
  id: UserIdSchema,
  username: UsernameSchema,
  email: UserEmailSchema,
  passwordHash: PasswordHashSchema.nullable(),

  status: UserLifecycleStatusSchema,
  emailVerified: z.boolean(),
  emailVerifiedAt: z.coerce.date().nullable(),

  role: UserRoleSchema,
  tier: UserTierSchema,

  metadata: UserMetadataSchema,

  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

/**
 * Data accepted when an internal service creates a user entity.
 *
 * Public sign-up requests should continue using `SignUpRequestSchema`.
 */
export const CreateUserEntitySchema = z.object({
  username: UsernameSchema,
  email: UserEmailSchema,
  passwordHash: PasswordHashSchema.nullable().optional(),

  status: UserLifecycleStatusSchema.optional(),
  emailVerified: z.boolean().optional(),
  emailVerifiedAt: z.coerce.date().nullable().optional(),

  role: UserRoleSchema.optional(),
  tier: UserTierSchema.optional(),

  metadata: UserMetadataSchema.optional(),
});

/**
 * Internal user entity updates.
 *
 * Password updates should use `setPasswordHash()` on `UserEntity`.
 * Email verification should use `verifyEmail()` or `markEmailUnverified()`.
 */
export const UpdateUserEntitySchema = z.object({
  username: UsernameSchema.optional(),
  email: UserEmailSchema.optional(),

  status: UserLifecycleStatusSchema.optional(),
  role: UserRoleSchema.optional(),
  tier: UserTierSchema.optional(),

  metadata: UserMetadataSchema.optional(),
});

/**
 * Safe user data without internal password information.
 */
export const PublicUserEntitySchema = UserEntitySchema.omit({
  passwordHash: true,
});

export type UserEntitySchemaType = z.infer<typeof UserEntitySchema>;

export type CreateUserEntityInput = z.infer<
  typeof CreateUserEntitySchema
>;

export type UpdateUserEntityInput = z.infer<
  typeof UpdateUserEntitySchema
>;

export type PublicUserEntitySchemaType = z.infer<
  typeof PublicUserEntitySchema
>;