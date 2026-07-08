import { z } from 'zod';
export declare const UserAccountStatusValues: readonly [
  'active',
  'revoked',
  'suspended',
  'expired',
];
export declare const UserAccountStatusSchema: z.ZodEnum<{
  active: 'active';
  revoked: 'revoked';
  suspended: 'suspended';
  expired: 'expired';
}>;
/**
 * Internal user account entity ID.
 */
export declare const UserAccountIdSchema: z.ZodUUID;
/**
 * External provider name.
 *
 * Examples: google, github, discord.
 */
export declare const UserAccountProviderSchema: z.ZodString;
/**
 * Provider-side account identifier.
 */
export declare const UserAccountProviderIdSchema: z.ZodString;
/**
 * Human-readable linked account display name.
 */
export declare const UserAccountDisplayNameSchema: z.ZodString;
/**
 * External account-management URL.
 */
export declare const UserAccountManagementUrlSchema: z.ZodPipe<
  z.ZodString,
  z.ZodURL
>;
/**
 * Full internal linked-account entity schema.
 */
export declare const UserAccountEntitySchema: z.ZodObject<
  {
    id: z.ZodUUID;
    userId: z.ZodUUID;
    provider: z.ZodString;
    accountId: z.ZodString;
    displayName: z.ZodString;
    managementUrl: z.ZodNullable<z.ZodPipe<z.ZodString, z.ZodURL>>;
    status: z.ZodEnum<{
      active: 'active';
      revoked: 'revoked';
      suspended: 'suspended';
      expired: 'expired';
    }>;
    connectedAt: z.ZodCoercedDate<unknown>;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
    deletedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
  },
  z.core.$strip
>;
/**
 * Data accepted when linking an external account to a user.
 */
export declare const CreateUserAccountEntitySchema: z.ZodObject<
  {
    userId: z.ZodUUID;
    provider: z.ZodString;
    accountId: z.ZodString;
    displayName: z.ZodString;
    managementUrl: z.ZodOptional<
      z.ZodNullable<z.ZodPipe<z.ZodString, z.ZodURL>>
    >;
    status: z.ZodOptional<
      z.ZodEnum<{
        active: 'active';
        revoked: 'revoked';
        suspended: 'suspended';
        expired: 'expired';
      }>
    >;
    connectedAt: z.ZodOptional<z.ZodCoercedDate<unknown>>;
  },
  z.core.$strip
>;
/**
 * Data allowed when updating a linked external account.
 */
export declare const UpdateUserAccountEntitySchema: z.ZodObject<
  {
    displayName: z.ZodOptional<z.ZodString>;
    managementUrl: z.ZodOptional<
      z.ZodNullable<z.ZodPipe<z.ZodString, z.ZodURL>>
    >;
    status: z.ZodOptional<
      z.ZodEnum<{
        active: 'active';
        revoked: 'revoked';
        suspended: 'suspended';
        expired: 'expired';
      }>
    >;
  },
  z.core.$strip
>;
/**
 * Linked account data safe to return to the owning user.
 */
export declare const UserAccountContractSchema: z.ZodObject<
  {
    id: z.ZodUUID;
    provider: z.ZodString;
    displayName: z.ZodString;
    managementUrl: z.ZodNullable<z.ZodPipe<z.ZodString, z.ZodURL>>;
    status: z.ZodEnum<{
      active: 'active';
      revoked: 'revoked';
      suspended: 'suspended';
      expired: 'expired';
    }>;
    connectedAt: z.ZodISODateTime;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
  },
  z.core.$strip
>;
export type UserAccountStatusInput = z.infer<typeof UserAccountStatusSchema>;
export type UserAccountEntitySchemaType = z.infer<
  typeof UserAccountEntitySchema
>;
export type CreateUserAccountEntityInput = z.infer<
  typeof CreateUserAccountEntitySchema
>;
export type UpdateUserAccountEntityInput = z.infer<
  typeof UpdateUserAccountEntitySchema
>;
export type UserAccountContractSchemaType = z.infer<
  typeof UserAccountContractSchema
>;
