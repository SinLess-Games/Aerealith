import { z } from 'zod';
/**
 * Internal user settings entity ID.
 */
export declare const UserSettingsIdSchema: z.ZodUUID;
/**
 * User settings schema version.
 */
export declare const UserSettingsSchemaVersionSchema: z.ZodNumber;
/**
 * Text scaling multiplier used by the user interface.
 */
export declare const UserSettingsTextScaleSchema: z.ZodNumber;
/**
 * User interface theme preference.
 */
export declare const UserSettingsThemeSchema: z.ZodEnum<{
  light: 'light';
  dark: 'dark';
  system: 'system';
}>;
/**
 * Metadata used to evolve the settings structure safely.
 */
export declare const UserSettingsMetadataSchema: z.ZodObject<
  {
    schemaVersion: z.ZodNumber;
  },
  z.core.$strip
>;
/**
 * Accessibility-related user settings.
 */
export declare const UserAccessibilitySettingsSchema: z.ZodObject<
  {
    reduceMotion: z.ZodBoolean;
    highContrast: z.ZodBoolean;
    textScale: z.ZodNumber;
  },
  z.core.$strip
>;
/**
 * Appearance-related user settings.
 */
export declare const UserAppearanceSettingsSchema: z.ZodObject<
  {
    theme: z.ZodEnum<{
      light: 'light';
      dark: 'dark';
      system: 'system';
    }>;
    compactMode: z.ZodBoolean;
  },
  z.core.$strip
>;
/**
 * Communication-related user settings.
 */
export declare const UserCommunicationSettingsSchema: z.ZodObject<
  {
    progressUpdates: z.ZodBoolean;
    quietMode: z.ZodBoolean;
  },
  z.core.$strip
>;
/**
 * Notification-related user settings.
 */
export declare const UserNotificationSettingsSchema: z.ZodObject<
  {
    email: z.ZodBoolean;
    push: z.ZodBoolean;
    productUpdates: z.ZodBoolean;
    securityAlerts: z.ZodBoolean;
  },
  z.core.$strip
>;
/**
 * Privacy-related user settings.
 */
export declare const UserPrivacySettingsSchema: z.ZodObject<
  {
    analytics: z.ZodBoolean;
    personalization: z.ZodBoolean;
  },
  z.core.$strip
>;
/**
 * Security-related user settings.
 */
export declare const UserSecuritySettingsSchema: z.ZodObject<
  {
    mfaEnabled: z.ZodBoolean;
  },
  z.core.$strip
>;
/**
 * Full internal user settings entity schema.
 */
export declare const UserSettingsEntitySchema: z.ZodObject<
  {
    id: z.ZodUUID;
    userId: z.ZodUUID;
    metadata: z.ZodObject<
      {
        schemaVersion: z.ZodNumber;
      },
      z.core.$strip
    >;
    accessibility: z.ZodObject<
      {
        reduceMotion: z.ZodBoolean;
        highContrast: z.ZodBoolean;
        textScale: z.ZodNumber;
      },
      z.core.$strip
    >;
    appearance: z.ZodObject<
      {
        theme: z.ZodEnum<{
          light: 'light';
          dark: 'dark';
          system: 'system';
        }>;
        compactMode: z.ZodBoolean;
      },
      z.core.$strip
    >;
    communication: z.ZodObject<
      {
        progressUpdates: z.ZodBoolean;
        quietMode: z.ZodBoolean;
      },
      z.core.$strip
    >;
    notifications: z.ZodObject<
      {
        email: z.ZodBoolean;
        push: z.ZodBoolean;
        productUpdates: z.ZodBoolean;
        securityAlerts: z.ZodBoolean;
      },
      z.core.$strip
    >;
    privacy: z.ZodObject<
      {
        analytics: z.ZodBoolean;
        personalization: z.ZodBoolean;
      },
      z.core.$strip
    >;
    security: z.ZodObject<
      {
        mfaEnabled: z.ZodBoolean;
      },
      z.core.$strip
    >;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
    deletedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
  },
  z.core.$strip
>;
/**
 * Data accepted when creating user settings.
 *
 * The entity supplies defaults for all setting groups.
 */
export declare const CreateUserSettingsEntitySchema: z.ZodObject<
  {
    userId: z.ZodUUID;
    metadata: z.ZodOptional<
      z.ZodObject<
        {
          schemaVersion: z.ZodNumber;
        },
        z.core.$strip
      >
    >;
    accessibility: z.ZodOptional<
      z.ZodObject<
        {
          reduceMotion: z.ZodOptional<z.ZodBoolean>;
          highContrast: z.ZodOptional<z.ZodBoolean>;
          textScale: z.ZodOptional<z.ZodNumber>;
        },
        z.core.$strip
      >
    >;
    appearance: z.ZodOptional<
      z.ZodObject<
        {
          theme: z.ZodOptional<
            z.ZodEnum<{
              light: 'light';
              dark: 'dark';
              system: 'system';
            }>
          >;
          compactMode: z.ZodOptional<z.ZodBoolean>;
        },
        z.core.$strip
      >
    >;
    communication: z.ZodOptional<
      z.ZodObject<
        {
          progressUpdates: z.ZodOptional<z.ZodBoolean>;
          quietMode: z.ZodOptional<z.ZodBoolean>;
        },
        z.core.$strip
      >
    >;
    notifications: z.ZodOptional<
      z.ZodObject<
        {
          email: z.ZodOptional<z.ZodBoolean>;
          push: z.ZodOptional<z.ZodBoolean>;
          productUpdates: z.ZodOptional<z.ZodBoolean>;
          securityAlerts: z.ZodOptional<z.ZodBoolean>;
        },
        z.core.$strip
      >
    >;
    privacy: z.ZodOptional<
      z.ZodObject<
        {
          analytics: z.ZodOptional<z.ZodBoolean>;
          personalization: z.ZodOptional<z.ZodBoolean>;
        },
        z.core.$strip
      >
    >;
    security: z.ZodOptional<
      z.ZodObject<
        {
          mfaEnabled: z.ZodOptional<z.ZodBoolean>;
        },
        z.core.$strip
      >
    >;
  },
  z.core.$strip
>;
/**
 * Data allowed when updating user settings.
 *
 * Each object is partial because the entity merges updates into the
 * existing setting group.
 */
export declare const UpdateUserSettingsEntitySchema: z.ZodObject<
  {
    accessibility: z.ZodOptional<
      z.ZodObject<
        {
          reduceMotion: z.ZodOptional<z.ZodBoolean>;
          highContrast: z.ZodOptional<z.ZodBoolean>;
          textScale: z.ZodOptional<z.ZodNumber>;
        },
        z.core.$strip
      >
    >;
    appearance: z.ZodOptional<
      z.ZodObject<
        {
          theme: z.ZodOptional<
            z.ZodEnum<{
              light: 'light';
              dark: 'dark';
              system: 'system';
            }>
          >;
          compactMode: z.ZodOptional<z.ZodBoolean>;
        },
        z.core.$strip
      >
    >;
    communication: z.ZodOptional<
      z.ZodObject<
        {
          progressUpdates: z.ZodOptional<z.ZodBoolean>;
          quietMode: z.ZodOptional<z.ZodBoolean>;
        },
        z.core.$strip
      >
    >;
    notifications: z.ZodOptional<
      z.ZodObject<
        {
          email: z.ZodOptional<z.ZodBoolean>;
          push: z.ZodOptional<z.ZodBoolean>;
          productUpdates: z.ZodOptional<z.ZodBoolean>;
          securityAlerts: z.ZodOptional<z.ZodBoolean>;
        },
        z.core.$strip
      >
    >;
    privacy: z.ZodOptional<
      z.ZodObject<
        {
          analytics: z.ZodOptional<z.ZodBoolean>;
          personalization: z.ZodOptional<z.ZodBoolean>;
        },
        z.core.$strip
      >
    >;
    security: z.ZodOptional<
      z.ZodObject<
        {
          mfaEnabled: z.ZodOptional<z.ZodBoolean>;
        },
        z.core.$strip
      >
    >;
  },
  z.core.$strip
>;
/**
 * API-safe user settings response.
 */
export declare const UserSettingsContractSchema: z.ZodObject<
  {
    id: z.ZodUUID;
    userId: z.ZodUUID;
    metadata: z.ZodObject<
      {
        schemaVersion: z.ZodNumber;
      },
      z.core.$strip
    >;
    accessibility: z.ZodObject<
      {
        reduceMotion: z.ZodBoolean;
        highContrast: z.ZodBoolean;
        textScale: z.ZodNumber;
      },
      z.core.$strip
    >;
    appearance: z.ZodObject<
      {
        theme: z.ZodEnum<{
          light: 'light';
          dark: 'dark';
          system: 'system';
        }>;
        compactMode: z.ZodBoolean;
      },
      z.core.$strip
    >;
    communication: z.ZodObject<
      {
        progressUpdates: z.ZodBoolean;
        quietMode: z.ZodBoolean;
      },
      z.core.$strip
    >;
    notifications: z.ZodObject<
      {
        email: z.ZodBoolean;
        push: z.ZodBoolean;
        productUpdates: z.ZodBoolean;
        securityAlerts: z.ZodBoolean;
      },
      z.core.$strip
    >;
    privacy: z.ZodObject<
      {
        analytics: z.ZodBoolean;
        personalization: z.ZodBoolean;
      },
      z.core.$strip
    >;
    security: z.ZodObject<
      {
        mfaEnabled: z.ZodBoolean;
      },
      z.core.$strip
    >;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
  },
  z.core.$strip
>;
/**
 * API request payload for updating the current user's settings.
 */
export declare const UpdateUserSettingsContractSchema: z.ZodObject<
  {
    accessibility: z.ZodOptional<
      z.ZodObject<
        {
          reduceMotion: z.ZodOptional<z.ZodBoolean>;
          highContrast: z.ZodOptional<z.ZodBoolean>;
          textScale: z.ZodOptional<z.ZodNumber>;
        },
        z.core.$strip
      >
    >;
    appearance: z.ZodOptional<
      z.ZodObject<
        {
          theme: z.ZodOptional<
            z.ZodEnum<{
              light: 'light';
              dark: 'dark';
              system: 'system';
            }>
          >;
          compactMode: z.ZodOptional<z.ZodBoolean>;
        },
        z.core.$strip
      >
    >;
    communication: z.ZodOptional<
      z.ZodObject<
        {
          progressUpdates: z.ZodOptional<z.ZodBoolean>;
          quietMode: z.ZodOptional<z.ZodBoolean>;
        },
        z.core.$strip
      >
    >;
    notifications: z.ZodOptional<
      z.ZodObject<
        {
          email: z.ZodOptional<z.ZodBoolean>;
          push: z.ZodOptional<z.ZodBoolean>;
          productUpdates: z.ZodOptional<z.ZodBoolean>;
          securityAlerts: z.ZodOptional<z.ZodBoolean>;
        },
        z.core.$strip
      >
    >;
    privacy: z.ZodOptional<
      z.ZodObject<
        {
          analytics: z.ZodOptional<z.ZodBoolean>;
          personalization: z.ZodOptional<z.ZodBoolean>;
        },
        z.core.$strip
      >
    >;
    security: z.ZodOptional<
      z.ZodObject<
        {
          mfaEnabled: z.ZodOptional<z.ZodBoolean>;
        },
        z.core.$strip
      >
    >;
  },
  z.core.$strip
>;
export type UserSettingsMetadataInput = z.infer<
  typeof UserSettingsMetadataSchema
>;
export type UserAccessibilitySettingsInput = z.infer<
  typeof UserAccessibilitySettingsSchema
>;
export type UserAppearanceSettingsInput = z.infer<
  typeof UserAppearanceSettingsSchema
>;
export type UserCommunicationSettingsInput = z.infer<
  typeof UserCommunicationSettingsSchema
>;
export type UserNotificationSettingsInput = z.infer<
  typeof UserNotificationSettingsSchema
>;
export type UserPrivacySettingsInput = z.infer<
  typeof UserPrivacySettingsSchema
>;
export type UserSecuritySettingsInput = z.infer<
  typeof UserSecuritySettingsSchema
>;
export type UserSettingsEntitySchemaType = z.infer<
  typeof UserSettingsEntitySchema
>;
export type CreateUserSettingsEntityInput = z.infer<
  typeof CreateUserSettingsEntitySchema
>;
export type UpdateUserSettingsEntityInput = z.infer<
  typeof UpdateUserSettingsEntitySchema
>;
export type UserSettingsContractSchemaType = z.infer<
  typeof UserSettingsContractSchema
>;
export type UpdateUserSettingsContractInput = z.infer<
  typeof UpdateUserSettingsContractSchema
>;
