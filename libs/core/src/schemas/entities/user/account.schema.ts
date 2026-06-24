import { z } from 'zod'

export const UserAccountStatusValues = [
  'active',
  'revoked',
  'suspended',
  'expired',
] as const

export const UserAccountStatusSchema = z.enum(UserAccountStatusValues)

/**
 * Internal user account entity ID.
 */
export const UserAccountIdSchema = z.uuid()

/**
 * External provider name.
 *
 * Examples: google, github, discord.
 */
export const UserAccountProviderSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(100)

/**
 * Provider-side account identifier.
 */
export const UserAccountProviderIdSchema = z.string().trim().min(1).max(255)

/**
 * Human-readable linked account display name.
 */
export const UserAccountDisplayNameSchema = z.string().trim().min(1).max(100)

/**
 * External account-management URL.
 */
export const UserAccountManagementUrlSchema = z.string().trim().pipe(z.url())

/**
 * Full internal linked-account entity schema.
 */
export const UserAccountEntitySchema = z.object({
  id: UserAccountIdSchema,
  userId: z.uuid(),

  provider: UserAccountProviderSchema,
  accountId: UserAccountProviderIdSchema,
  displayName: UserAccountDisplayNameSchema,
  managementUrl: UserAccountManagementUrlSchema.nullable(),

  status: UserAccountStatusSchema,
  connectedAt: z.coerce.date(),

  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

/**
 * Data accepted when linking an external account to a user.
 */
export const CreateUserAccountEntitySchema = z.object({
  userId: z.uuid(),

  provider: UserAccountProviderSchema,
  accountId: UserAccountProviderIdSchema,
  displayName: UserAccountDisplayNameSchema,
  managementUrl: UserAccountManagementUrlSchema.nullable().optional(),

  status: UserAccountStatusSchema.optional(),
  connectedAt: z.coerce.date().optional(),
})

/**
 * Data allowed when updating a linked external account.
 */
export const UpdateUserAccountEntitySchema = z.object({
  displayName: UserAccountDisplayNameSchema.optional(),
  managementUrl: UserAccountManagementUrlSchema.nullable().optional(),
  status: UserAccountStatusSchema.optional(),
})

/**
 * Linked account data safe to return to the owning user.
 */
export const UserAccountContractSchema = z.object({
  id: UserAccountIdSchema,
  provider: UserAccountProviderSchema,
  displayName: UserAccountDisplayNameSchema,
  managementUrl: UserAccountManagementUrlSchema.nullable(),
  status: UserAccountStatusSchema,
  connectedAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export type UserAccountStatusInput = z.infer<typeof UserAccountStatusSchema>

export type UserAccountEntitySchemaType = z.infer<
  typeof UserAccountEntitySchema
>

export type CreateUserAccountEntityInput = z.infer<
  typeof CreateUserAccountEntitySchema
>

export type UpdateUserAccountEntityInput = z.infer<
  typeof UpdateUserAccountEntitySchema
>

export type UserAccountContractSchemaType = z.infer<
  typeof UserAccountContractSchema
>
