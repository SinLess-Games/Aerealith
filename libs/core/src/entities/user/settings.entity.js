'use strict';
// libs/core/src/entities/user/settings.entity.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.UserSettingsEntity = void 0;
const base_entity_1 = require('../base.entity');
const DefaultUserSettingsMetadata = {
  schemaVersion: 1,
};
const DefaultUserAccessibilitySettings = {
  reduceMotion: false,
  highContrast: false,
  textScale: 1,
};
const DefaultUserAppearanceSettings = {
  theme: 'system',
  compactMode: false,
};
const DefaultUserCommunicationSettings = {
  progressUpdates: true,
  quietMode: false,
};
const DefaultUserNotificationSettings = {
  email: true,
  push: false,
  productUpdates: true,
  securityAlerts: true,
};
const DefaultUserPrivacySettings = {
  analytics: false,
  personalization: true,
};
const DefaultUserSecuritySettings = {
  mfaEnabled: false,
};
/**
 * Stores user-specific application settings.
 *
 * Keep locale and display preferences in UserPreferencesEntity.
 * Keep consent records in UserConsentEntity.
 * Keep linked accounts in UserAccountEntity.
 */
class UserSettingsEntity extends base_entity_1.BaseEntity {
  userId;
  metadata;
  accessibility;
  appearance;
  communication;
  notifications;
  privacy;
  security;
  constructor(input) {
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
  update(input) {
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
exports.UserSettingsEntity = UserSettingsEntity;
//# sourceMappingURL=settings.entity.js.map
