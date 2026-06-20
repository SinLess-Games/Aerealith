// libs/core/src/schemas/entities/user/consent.schema.ts

import { z } from 'zod';

import { UserConsentType } from '../../../entities';

/**
 * Internal user consent record ID.
 */
export const UserConsentIdSchema = z.string().uuid();

/**
 * Policy, terms, or preference version.
 *
 * Example: 2026-06-19
 */
export const UserConsentVersionSchema = z.string().trim().min(1).max(100);

/**
 * Supported user consent categories.
 */
export const UserConsentTypeSchema = z.enum(UserConsentType);

/**
 * Full internal user consent entity schema.
 */
export const UserConsentEntitySchema = z.object({
  id: UserConsentIdSchema,
  userId: z.string().uuid(),

  type: UserConsentTypeSchema,
  version: UserConsentVersionSchema.nullable(),

  grantedAt: z.coerce.date().nullable(),
  revokedAt: z.coerce.date().nullable(),

  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

/**
 * Data accepted when creating a user consent record.
 *
 * A newly created consent record is normally granted immediately.
 */
export const CreateUserConsentEntitySchema = z.object({
  userId: z.string().uuid(),

  type: UserConsentTypeSchema,
  version: UserConsentVersionSchema.nullable().optional(),

  grantedAt: z.coerce.date().nullable().optional(),
  revokedAt: z.coerce.date().nullable().optional(),
});

/**
 * Data accepted when granting or revoking an existing consent record.
 */
export const UpdateUserConsentEntitySchema = z.object({
  version: UserConsentVersionSchema.nullable().optional(),
  granted: z.boolean(),
});

/**
 * API-safe user consent response.
 */
export const UserConsentContractSchema = z.object({
  id: UserConsentIdSchema,
  userId: z.string().uuid(),

  type: UserConsentTypeSchema,
  version: UserConsentVersionSchema.nullable(),

  grantedAt: z.string().datetime().nullable(),
  revokedAt: z.string().datetime().nullable(),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * API request for granting or revoking consent.
 */
export const UpdateUserConsentContractSchema = z.object({
  type: UserConsentTypeSchema,
  version: UserConsentVersionSchema.nullable().optional(),
  granted: z.boolean(),
});

export type UserConsentEntitySchemaType = z.infer<
  typeof UserConsentEntitySchema
>;

export type CreateUserConsentEntityInput = z.infer<
  typeof CreateUserConsentEntitySchema
>;

export type UpdateUserConsentEntityInput = z.infer<
  typeof UpdateUserConsentEntitySchema
>;

export type UserConsentContractSchemaType = z.infer<
  typeof UserConsentContractSchema
>;

export type UpdateUserConsentContractInput = z.infer<
  typeof UpdateUserConsentContractSchema
>;