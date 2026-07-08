'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.UpdateUserSettingsContractSchema =
  exports.UserSettingsContractSchema =
  exports.UpdateUserSettingsEntitySchema =
  exports.CreateUserSettingsEntitySchema =
  exports.UserSettingsEntitySchema =
  exports.UserSecuritySettingsSchema =
  exports.UserPrivacySettingsSchema =
  exports.UserNotificationSettingsSchema =
  exports.UserCommunicationSettingsSchema =
  exports.UserAppearanceSettingsSchema =
  exports.UserAccessibilitySettingsSchema =
  exports.UserSettingsMetadataSchema =
  exports.UserSettingsThemeSchema =
  exports.UserSettingsTextScaleSchema =
  exports.UserSettingsSchemaVersionSchema =
  exports.UserSettingsIdSchema =
    void 0;
const zod_1 = require('zod');
/**
 * Internal user settings entity ID.
 */
exports.UserSettingsIdSchema = zod_1.z.uuid();
/**
 * User settings schema version.
 */
exports.UserSettingsSchemaVersionSchema = zod_1.z.number().int().min(1);
/**
 * Text scaling multiplier used by the user interface.
 */
exports.UserSettingsTextScaleSchema = zod_1.z.number().min(0.5).max(2);
/**
 * User interface theme preference.
 */
exports.UserSettingsThemeSchema = zod_1.z.enum(['system', 'light', 'dark']);
/**
 * Metadata used to evolve the settings structure safely.
 */
exports.UserSettingsMetadataSchema = zod_1.z.object({
  schemaVersion: exports.UserSettingsSchemaVersionSchema,
});
/**
 * Accessibility-related user settings.
 */
exports.UserAccessibilitySettingsSchema = zod_1.z.object({
  reduceMotion: zod_1.z.boolean(),
  highContrast: zod_1.z.boolean(),
  textScale: exports.UserSettingsTextScaleSchema,
});
/**
 * Appearance-related user settings.
 */
exports.UserAppearanceSettingsSchema = zod_1.z.object({
  theme: exports.UserSettingsThemeSchema,
  compactMode: zod_1.z.boolean(),
});
/**
 * Communication-related user settings.
 */
exports.UserCommunicationSettingsSchema = zod_1.z.object({
  progressUpdates: zod_1.z.boolean(),
  quietMode: zod_1.z.boolean(),
});
/**
 * Notification-related user settings.
 */
exports.UserNotificationSettingsSchema = zod_1.z.object({
  email: zod_1.z.boolean(),
  push: zod_1.z.boolean(),
  productUpdates: zod_1.z.boolean(),
  securityAlerts: zod_1.z.boolean(),
});
/**
 * Privacy-related user settings.
 */
exports.UserPrivacySettingsSchema = zod_1.z.object({
  analytics: zod_1.z.boolean(),
  personalization: zod_1.z.boolean(),
});
/**
 * Security-related user settings.
 */
exports.UserSecuritySettingsSchema = zod_1.z.object({
  mfaEnabled: zod_1.z.boolean(),
});
/**
 * Full internal user settings entity schema.
 */
exports.UserSettingsEntitySchema = zod_1.z.object({
  id: exports.UserSettingsIdSchema,
  userId: zod_1.z.uuid(),
  metadata: exports.UserSettingsMetadataSchema,
  accessibility: exports.UserAccessibilitySettingsSchema,
  appearance: exports.UserAppearanceSettingsSchema,
  communication: exports.UserCommunicationSettingsSchema,
  notifications: exports.UserNotificationSettingsSchema,
  privacy: exports.UserPrivacySettingsSchema,
  security: exports.UserSecuritySettingsSchema,
  createdAt: zod_1.z.coerce.date(),
  updatedAt: zod_1.z.coerce.date(),
  deletedAt: zod_1.z.coerce.date().nullable(),
});
/**
 * Data accepted when creating user settings.
 *
 * The entity supplies defaults for all setting groups.
 */
exports.CreateUserSettingsEntitySchema = zod_1.z.object({
  userId: zod_1.z.uuid(),
  metadata: exports.UserSettingsMetadataSchema.optional(),
  accessibility: exports.UserAccessibilitySettingsSchema.partial().optional(),
  appearance: exports.UserAppearanceSettingsSchema.partial().optional(),
  communication: exports.UserCommunicationSettingsSchema.partial().optional(),
  notifications: exports.UserNotificationSettingsSchema.partial().optional(),
  privacy: exports.UserPrivacySettingsSchema.partial().optional(),
  security: exports.UserSecuritySettingsSchema.partial().optional(),
});
/**
 * Data allowed when updating user settings.
 *
 * Each object is partial because the entity merges updates into the
 * existing setting group.
 */
exports.UpdateUserSettingsEntitySchema = zod_1.z.object({
  accessibility: exports.UserAccessibilitySettingsSchema.partial().optional(),
  appearance: exports.UserAppearanceSettingsSchema.partial().optional(),
  communication: exports.UserCommunicationSettingsSchema.partial().optional(),
  notifications: exports.UserNotificationSettingsSchema.partial().optional(),
  privacy: exports.UserPrivacySettingsSchema.partial().optional(),
  security: exports.UserSecuritySettingsSchema.partial().optional(),
});
/**
 * API-safe user settings response.
 */
exports.UserSettingsContractSchema = zod_1.z.object({
  id: exports.UserSettingsIdSchema,
  userId: zod_1.z.uuid(),
  metadata: exports.UserSettingsMetadataSchema,
  accessibility: exports.UserAccessibilitySettingsSchema,
  appearance: exports.UserAppearanceSettingsSchema,
  communication: exports.UserCommunicationSettingsSchema,
  notifications: exports.UserNotificationSettingsSchema,
  privacy: exports.UserPrivacySettingsSchema,
  security: exports.UserSecuritySettingsSchema,
  createdAt: zod_1.z.iso.datetime(),
  updatedAt: zod_1.z.iso.datetime(),
});
/**
 * API request payload for updating the current user's settings.
 */
exports.UpdateUserSettingsContractSchema =
  exports.UpdateUserSettingsEntitySchema;
//# sourceMappingURL=settings.schema.js.map
