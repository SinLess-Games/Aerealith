import { BaseEntity, type BaseEntityInput } from '../base.entity';
export type UserSettingsTheme = 'system' | 'light' | 'dark';
export type UserSettingsMetadata = {
  schemaVersion: number;
};
export type UserAccessibilitySettings = {
  reduceMotion: boolean;
  highContrast: boolean;
  textScale: number;
};
export type UserAppearanceSettings = {
  theme: UserSettingsTheme;
  compactMode: boolean;
};
export type UserCommunicationSettings = {
  progressUpdates: boolean;
  quietMode: boolean;
};
export type UserNotificationSettings = {
  email: boolean;
  push: boolean;
  productUpdates: boolean;
  securityAlerts: boolean;
};
export type UserPrivacySettings = {
  analytics: boolean;
  personalization: boolean;
};
export type UserSecuritySettings = {
  mfaEnabled: boolean;
};
export type UserSettingsInput = BaseEntityInput & {
  userId: string;
  metadata?: Partial<UserSettingsMetadata>;
  accessibility?: Partial<UserAccessibilitySettings>;
  appearance?: Partial<UserAppearanceSettings>;
  communication?: Partial<UserCommunicationSettings>;
  notifications?: Partial<UserNotificationSettings>;
  privacy?: Partial<UserPrivacySettings>;
  security?: Partial<UserSecuritySettings>;
};
export type UserSettingsUpdate = Omit<
  Partial<UserSettingsInput>,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'metadata'
>;
/**
 * Stores user-specific application settings.
 *
 * Keep locale and display preferences in UserPreferencesEntity.
 * Keep consent records in UserConsentEntity.
 * Keep linked accounts in UserAccountEntity.
 */
export declare class UserSettingsEntity extends BaseEntity {
  userId: string;
  metadata: UserSettingsMetadata;
  accessibility: UserAccessibilitySettings;
  appearance: UserAppearanceSettings;
  communication: UserCommunicationSettings;
  notifications: UserNotificationSettings;
  privacy: UserPrivacySettings;
  security: UserSecuritySettings;
  constructor(input: UserSettingsInput);
  update(input: UserSettingsUpdate): void;
}
