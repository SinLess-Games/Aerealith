// libs/core/src/entities/user/settings.entity.ts

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

const DefaultUserSettingsMetadata: UserSettingsMetadata = {
  schemaVersion: 1,
};

const DefaultUserAccessibilitySettings: UserAccessibilitySettings = {
  reduceMotion: false,
  highContrast: false,
  textScale: 1,
};

const DefaultUserAppearanceSettings: UserAppearanceSettings = {
  theme: 'system',
  compactMode: false,
};

const DefaultUserCommunicationSettings: UserCommunicationSettings = {
  progressUpdates: true,
  quietMode: false,
};

const DefaultUserNotificationSettings: UserNotificationSettings = {
  email: true,
  push: false,
  productUpdates: true,
  securityAlerts: true,
};

const DefaultUserPrivacySettings: UserPrivacySettings = {
  analytics: false,
  personalization: true,
};

const DefaultUserSecuritySettings: UserSecuritySettings = {
  mfaEnabled: false,
};

/**
 * Stores user-specific application settings.
 *
 * Keep locale and display preferences in UserPreferencesEntity.
 * Keep consent records in UserConsentEntity.
 * Keep linked accounts in UserAccountEntity.
 */
export class UserSettingsEntity extends BaseEntity {
  userId: string;

  metadata: UserSettingsMetadata;

  accessibility: UserAccessibilitySettings;

  appearance: UserAppearanceSettings;

  communication: UserCommunicationSettings;

  notifications: UserNotificationSettings;

  privacy: UserPrivacySettings;

  security: UserSecuritySettings;

  constructor(input: UserSettingsInput) {
    super(input);

    this.userId = input.userId.trim();

    this.metadata = {
      ...DefaultUserSettingsMetadata,
      ...input.metadata,
    };

    this.accessibility = {
      ...DefaultUserAccessibilitySettings,
      ...input.accessibility,
    };

    this.appearance = {
      ...DefaultUserAppearanceSettings,
      ...input.appearance,
    };

    this.communication = {
      ...DefaultUserCommunicationSettings,
      ...input.communication,
    };

    this.notifications = {
      ...DefaultUserNotificationSettings,
      ...input.notifications,
    };

    this.privacy = {
      ...DefaultUserPrivacySettings,
      ...input.privacy,
    };

    this.security = {
      ...DefaultUserSecuritySettings,
      ...input.security,
    };
  }

  update(input: UserSettingsUpdate): void {
    if (input.accessibility !== undefined) {
      this.accessibility = {
        ...this.accessibility,
        ...input.accessibility,
      };
    }

    if (input.appearance !== undefined) {
      this.appearance = {
        ...this.appearance,
        ...input.appearance,
      };
    }

    if (input.communication !== undefined) {
      this.communication = {
        ...this.communication,
        ...input.communication,
      };
    }

    if (input.notifications !== undefined) {
      this.notifications = {
        ...this.notifications,
        ...input.notifications,
      };
    }

    if (input.privacy !== undefined) {
      this.privacy = {
        ...this.privacy,
        ...input.privacy,
      };
    }

    if (input.security !== undefined) {
      this.security = {
        ...this.security,
        ...input.security,
      };
    }

    this.touch();
  }
}
