import { z } from 'zod'

/**
 * Internal user settings entity ID.
 */
export const UserSettingsIdSchema = z.uuid()

/**
 * User settings schema version.
 */
export const UserSettingsSchemaVersionSchema = z.number().int().min(1)

/**
 * Text scaling multiplier used by the user interface.
 */
export const UserSettingsTextScaleSchema = z.number().min(0.5).max(2)

/**
 * User interface theme preference.
 */
export const UserSettingsThemeSchema = z.enum(['system', 'light', 'dark'])

/**
 * Metadata used to evolve the settings structure safely.
 */
export const UserSettingsMetadataSchema = z.object({
  schemaVersion: UserSettingsSchemaVersionSchema,
})

/**
 * Accessibility-related user settings.
 */
export const UserAccessibilitySettingsSchema = z.object({
  reduceMotion: z.boolean(),
  highContrast: z.boolean(),
  textScale: UserSettingsTextScaleSchema,
})

/**
 * Appearance-related user settings.
 */
export const UserAppearanceSettingsSchema = z.object({
  theme: UserSettingsThemeSchema,
  compactMode: z.boolean(),
})

/**
 * Communication-related user settings.
 */
export const UserCommunicationSettingsSchema = z.object({
  progressUpdates: z.boolean(),
  quietMode: z.boolean(),
})

/**
 * Notification-related user settings.
 */
export const UserNotificationSettingsSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  productUpdates: z.boolean(),
  securityAlerts: z.boolean(),
})

/**
 * Privacy-related user settings.
 */
export const UserPrivacySettingsSchema = z.object({
  analytics: z.boolean(),
  personalization: z.boolean(),
})

/**
 * Security-related user settings.
 */
export const UserSecuritySettingsSchema = z.object({
  mfaEnabled: z.boolean(),
})

/**
 * Full internal user settings entity schema.
 */
export const UserSettingsEntitySchema = z.object({
  id: UserSettingsIdSchema,
  userId: z.uuid(),

  metadata: UserSettingsMetadataSchema,

  accessibility: UserAccessibilitySettingsSchema,
  appearance: UserAppearanceSettingsSchema,
  communication: UserCommunicationSettingsSchema,
  notifications: UserNotificationSettingsSchema,
  privacy: UserPrivacySettingsSchema,
  security: UserSecuritySettingsSchema,

  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

/**
 * Data accepted when creating user settings.
 *
 * The entity supplies defaults for all setting groups.
 */
export const CreateUserSettingsEntitySchema = z.object({
  userId: z.uuid(),

  metadata: UserSettingsMetadataSchema.optional(),

  accessibility: UserAccessibilitySettingsSchema.partial().optional(),
  appearance: UserAppearanceSettingsSchema.partial().optional(),
  communication: UserCommunicationSettingsSchema.partial().optional(),
  notifications: UserNotificationSettingsSchema.partial().optional(),
  privacy: UserPrivacySettingsSchema.partial().optional(),
  security: UserSecuritySettingsSchema.partial().optional(),
})

/**
 * Data allowed when updating user settings.
 *
 * Each object is partial because the entity merges updates into the
 * existing setting group.
 */
export const UpdateUserSettingsEntitySchema = z.object({
  accessibility: UserAccessibilitySettingsSchema.partial().optional(),
  appearance: UserAppearanceSettingsSchema.partial().optional(),
  communication: UserCommunicationSettingsSchema.partial().optional(),
  notifications: UserNotificationSettingsSchema.partial().optional(),
  privacy: UserPrivacySettingsSchema.partial().optional(),
  security: UserSecuritySettingsSchema.partial().optional(),
})

/**
 * API-safe user settings response.
 */
export const UserSettingsContractSchema = z.object({
  id: UserSettingsIdSchema,
  userId: z.uuid(),

  metadata: UserSettingsMetadataSchema,

  accessibility: UserAccessibilitySettingsSchema,
  appearance: UserAppearanceSettingsSchema,
  communication: UserCommunicationSettingsSchema,
  notifications: UserNotificationSettingsSchema,
  privacy: UserPrivacySettingsSchema,
  security: UserSecuritySettingsSchema,

  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

/**
 * API request payload for updating the current user's settings.
 */
export const UpdateUserSettingsContractSchema = UpdateUserSettingsEntitySchema

export type UserSettingsMetadataInput = z.infer<
  typeof UserSettingsMetadataSchema
>

export type UserAccessibilitySettingsInput = z.infer<
  typeof UserAccessibilitySettingsSchema
>

export type UserAppearanceSettingsInput = z.infer<
  typeof UserAppearanceSettingsSchema
>

export type UserCommunicationSettingsInput = z.infer<
  typeof UserCommunicationSettingsSchema
>

export type UserNotificationSettingsInput = z.infer<
  typeof UserNotificationSettingsSchema
>

export type UserPrivacySettingsInput = z.infer<typeof UserPrivacySettingsSchema>

export type UserSecuritySettingsInput = z.infer<
  typeof UserSecuritySettingsSchema
>

export type UserSettingsEntitySchemaType = z.infer<
  typeof UserSettingsEntitySchema
>

export type CreateUserSettingsEntityInput = z.infer<
  typeof CreateUserSettingsEntitySchema
>

export type UpdateUserSettingsEntityInput = z.infer<
  typeof UpdateUserSettingsEntitySchema
>

export type UserSettingsContractSchemaType = z.infer<
  typeof UserSettingsContractSchema
>

export type UpdateUserSettingsContractInput = z.infer<
  typeof UpdateUserSettingsContractSchema
>
