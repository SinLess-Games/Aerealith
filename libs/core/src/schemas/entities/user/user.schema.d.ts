import { z } from 'zod';
/**
 * Internal user entity ID.
 */
export declare const UserIdSchema: z.ZodUUID;
/**
 * Usernames are stored lowercase.
 */
export declare const UsernameSchema: z.ZodString;
/**
 * User email addresses are stored lowercase.
 */
export declare const UserEmailSchema: z.ZodPipe<z.ZodString, z.ZodEmail>;
/**
 * Internal password hash.
 *
 * Never use this schema for a raw password submitted by a user.
 */
export declare const PasswordHashSchema: z.ZodString;
export declare const UserMetadataSchema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
export declare const UserLifecycleStatusSchema: z.ZodEnum<{
  readonly Active: 'active';
  readonly Disabled: 'disabled';
  readonly Suspended: 'suspended';
}>;
export declare const UserRoleSchema: z.ZodEnum<{
  readonly Guest: 'guest';
  readonly User: 'user';
  readonly Support: 'support';
  readonly Moderator: 'moderator';
  readonly Developer: 'developer';
  readonly Admin: 'admin';
  readonly SuperAdmin: 'super_admin';
  readonly Service: 'service';
  readonly System: 'system';
}>;
export declare const UserTierSchema: z.ZodEnum<{
  readonly Basic: 'basic';
  readonly BasicPlus: 'basic_plus';
  readonly Premium: 'premium';
  readonly PremiumPlus: 'premium_plus';
  readonly Pro: 'pro';
  readonly ProPlus: 'pro_plus';
}>;
/**
 * Full internal user entity schema.
 *
 * This includes `passwordHash`, so do not use it for public API responses.
 */
export declare const UserEntitySchema: z.ZodObject<
  {
    id: z.ZodUUID;
    username: z.ZodString;
    email: z.ZodPipe<z.ZodString, z.ZodEmail>;
    passwordHash: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
      readonly Active: 'active';
      readonly Disabled: 'disabled';
      readonly Suspended: 'suspended';
    }>;
    emailVerified: z.ZodBoolean;
    emailVerifiedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
    role: z.ZodEnum<{
      readonly Guest: 'guest';
      readonly User: 'user';
      readonly Support: 'support';
      readonly Moderator: 'moderator';
      readonly Developer: 'developer';
      readonly Admin: 'admin';
      readonly SuperAdmin: 'super_admin';
      readonly Service: 'service';
      readonly System: 'system';
    }>;
    tier: z.ZodEnum<{
      readonly Basic: 'basic';
      readonly BasicPlus: 'basic_plus';
      readonly Premium: 'premium';
      readonly PremiumPlus: 'premium_plus';
      readonly Pro: 'pro';
      readonly ProPlus: 'pro_plus';
    }>;
    metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
    deletedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
  },
  z.core.$strip
>;
/**
 * Data accepted when an internal service creates a user entity.
 *
 * Public sign-up requests should continue using `SignUpRequestSchema`.
 */
export declare const CreateUserEntitySchema: z.ZodObject<
  {
    username: z.ZodString;
    email: z.ZodPipe<z.ZodString, z.ZodEmail>;
    passwordHash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodOptional<
      z.ZodEnum<{
        readonly Active: 'active';
        readonly Disabled: 'disabled';
        readonly Suspended: 'suspended';
      }>
    >;
    emailVerified: z.ZodOptional<z.ZodBoolean>;
    emailVerifiedAt: z.ZodOptional<z.ZodNullable<z.ZodCoercedDate<unknown>>>;
    role: z.ZodOptional<
      z.ZodEnum<{
        readonly Guest: 'guest';
        readonly User: 'user';
        readonly Support: 'support';
        readonly Moderator: 'moderator';
        readonly Developer: 'developer';
        readonly Admin: 'admin';
        readonly SuperAdmin: 'super_admin';
        readonly Service: 'service';
        readonly System: 'system';
      }>
    >;
    tier: z.ZodOptional<
      z.ZodEnum<{
        readonly Basic: 'basic';
        readonly BasicPlus: 'basic_plus';
        readonly Premium: 'premium';
        readonly PremiumPlus: 'premium_plus';
        readonly Pro: 'pro';
        readonly ProPlus: 'pro_plus';
      }>
    >;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  },
  z.core.$strip
>;
/**
 * Internal user entity updates.
 *
 * Password updates should use `setPasswordHash()` on `UserEntity`.
 * Email verification should use `verifyEmail()` or `markEmailUnverified()`.
 */
export declare const UpdateUserEntitySchema: z.ZodObject<
  {
    username: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodEmail>>;
    status: z.ZodOptional<
      z.ZodEnum<{
        readonly Active: 'active';
        readonly Disabled: 'disabled';
        readonly Suspended: 'suspended';
      }>
    >;
    role: z.ZodOptional<
      z.ZodEnum<{
        readonly Guest: 'guest';
        readonly User: 'user';
        readonly Support: 'support';
        readonly Moderator: 'moderator';
        readonly Developer: 'developer';
        readonly Admin: 'admin';
        readonly SuperAdmin: 'super_admin';
        readonly Service: 'service';
        readonly System: 'system';
      }>
    >;
    tier: z.ZodOptional<
      z.ZodEnum<{
        readonly Basic: 'basic';
        readonly BasicPlus: 'basic_plus';
        readonly Premium: 'premium';
        readonly PremiumPlus: 'premium_plus';
        readonly Pro: 'pro';
        readonly ProPlus: 'pro_plus';
      }>
    >;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  },
  z.core.$strip
>;
/**
 * Safe user data without internal password information.
 */
export declare const PublicUserEntitySchema: z.ZodObject<
  {
    id: z.ZodUUID;
    metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    email: z.ZodPipe<z.ZodString, z.ZodEmail>;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
    deletedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
    status: z.ZodEnum<{
      readonly Active: 'active';
      readonly Disabled: 'disabled';
      readonly Suspended: 'suspended';
    }>;
    emailVerified: z.ZodBoolean;
    emailVerifiedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
    username: z.ZodString;
    role: z.ZodEnum<{
      readonly Guest: 'guest';
      readonly User: 'user';
      readonly Support: 'support';
      readonly Moderator: 'moderator';
      readonly Developer: 'developer';
      readonly Admin: 'admin';
      readonly SuperAdmin: 'super_admin';
      readonly Service: 'service';
      readonly System: 'system';
    }>;
    tier: z.ZodEnum<{
      readonly Basic: 'basic';
      readonly BasicPlus: 'basic_plus';
      readonly Premium: 'premium';
      readonly PremiumPlus: 'premium_plus';
      readonly Pro: 'pro';
      readonly ProPlus: 'pro_plus';
    }>;
  },
  z.core.$strip
>;
export type UserEntitySchemaType = z.infer<typeof UserEntitySchema>;
export type CreateUserEntityInput = z.infer<typeof CreateUserEntitySchema>;
export type UpdateUserEntityInput = z.infer<typeof UpdateUserEntitySchema>;
export type PublicUserEntitySchemaType = z.infer<typeof PublicUserEntitySchema>;
