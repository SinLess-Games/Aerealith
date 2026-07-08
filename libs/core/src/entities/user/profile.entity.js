'use strict';
// libs/core/src/entities/user/profile.entity.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.UserProfileEntity = exports.DefaultUserProfileFieldVisibility = void 0;
const enumns_1 = require('../../enumns');
const base_entity_1 = require('../base.entity');
const profile_utils_1 = require('./profile.utils');
/**
 * Default visibility for commonly public-facing profile fields.
 */
exports.DefaultUserProfileFieldVisibility = {
  handle: enumns_1.ProfileFieldVisibility.Public,
  displayName: enumns_1.ProfileFieldVisibility.Public,
  pronouns: enumns_1.ProfileFieldVisibility.Public,
  avatarUrl: enumns_1.ProfileFieldVisibility.Public,
  bannerUrl: enumns_1.ProfileFieldVisibility.Public,
  bio: enumns_1.ProfileFieldVisibility.Public,
  locationLabel: enumns_1.ProfileFieldVisibility.Public,
  country: enumns_1.ProfileFieldVisibility.Public,
  languages: enumns_1.ProfileFieldVisibility.Public,
  websiteUrl: enumns_1.ProfileFieldVisibility.Public,
  links: enumns_1.ProfileFieldVisibility.Public,
  createdAt: enumns_1.ProfileFieldVisibility.Public,
};
/**
 * Public-facing profile data for a user.
 *
 * This does not contain:
 * - Credentials, sessions, or account security details
 * - Consent records
 * - Locale, timezone, or display preferences
 * - Subscription or role information
 */
class UserProfileEntity extends base_entity_1.BaseEntity {
  userId;
  handle;
  displayName;
  givenName;
  middleName;
  familyName;
  pronouns;
  avatarUrl;
  bannerUrl;
  bio;
  status;
  /**
   * The default visibility for the complete profile.
   *
   * Field visibility can further restrict or allow specific fields.
   */
  fieldVisibility;
  locationLabel;
  country;
  gender;
  sex;
  sexuality;
  romanticOrientation;
  sexAttitude;
  languages;
  websiteUrl;
  links;
  constructor(input) {
    super(input);
    this.userId = input.userId.trim();
    this.handle = this.normalizeHandle(input.handle);
    this.displayName = this.normalizeOptionalString(input.displayName);
    this.givenName = this.normalizeOptionalString(input.givenName);
    this.middleName = this.normalizeOptionalString(input.middleName);
    this.familyName = this.normalizeOptionalString(input.familyName);
    this.pronouns = this.normalizeOptionalString(input.pronouns);
    this.avatarUrl = this.normalizeOptionalString(input.avatarUrl);
    this.bannerUrl = this.normalizeOptionalString(input.bannerUrl);
    this.bio = this.normalizeOptionalString(input.bio);
    this.status = input.status ?? enumns_1.ProfileStatus.PendingSetup;
    this.fieldVisibility = {
      ...exports.DefaultUserProfileFieldVisibility,
      ...input.fieldVisibility,
    };
    this.locationLabel = this.normalizeOptionalString(input.locationLabel);
    this.country = input.country ?? null;
    this.gender = input.gender ?? null;
    this.sex = input.sex ?? null;
    this.sexuality = input.sexuality ?? null;
    this.romanticOrientation = input.romanticOrientation ?? null;
    this.sexAttitude = input.sexAttitude ?? null;
    this.languages = this.normalizeLanguages(input.languages ?? []);
    this.websiteUrl = this.normalizeOptionalString(input.websiteUrl);
    this.links = this.normalizeLinks(input.links ?? []);
  }
  getFieldVisibility(field) {
    return (
      this.fieldVisibility[field] ?? enumns_1.ProfileFieldVisibility.Private
    );
  }
  update(input) {
    this.updateHandle(input.handle);
    this.updateTextFields(input);
    this.updateProfileState(input);
    this.updatePersonalDetails(input);
    this.updateCollections(input);
    this.touch();
  }
  setFieldVisibility(field, visibility) {
    this.fieldVisibility = {
      ...this.fieldVisibility,
      [field]: visibility,
    };
    this.touch();
  }
  setLanguages(languages) {
    this.languages = this.normalizeLanguages(languages);
    this.touch();
  }
  setLinks(links) {
    this.links = this.normalizeLinks(links);
    this.touch();
  }
  updateHandle(handle) {
    if (handle !== undefined) {
      this.handle = this.normalizeHandle(handle);
    }
  }
  updateTextFields(input) {
    for (const field of profile_utils_1.UserProfileTextFields) {
      const value = input[field];
      if (value !== undefined) {
        this[field] = this.normalizeOptionalString(value);
      }
    }
  }
  updateProfileState(input) {
    if (input.status !== undefined) {
      this.status = input.status;
    }
    if (input.fieldVisibility !== undefined) {
      this.fieldVisibility = {
        ...this.fieldVisibility,
        ...input.fieldVisibility,
      };
    }
  }
  updatePersonalDetails(input) {
    for (const field of profile_utils_1.UserProfilePersonalDetailFields) {
      this.setDefinedPersonalDetail(field, input[field]);
    }
  }
  updateCollections(input) {
    if (input.languages !== undefined) {
      this.languages = this.normalizeLanguages(input.languages);
    }
    if (input.links !== undefined) {
      this.links = this.normalizeLinks(input.links);
    }
  }
  setDefinedPersonalDetail(field, value) {
    if (value !== undefined) {
      this[field] = value;
    }
  }
  normalizeHandle(handle) {
    return (0, profile_utils_1.normalizeUserProfileHandle)(handle);
  }
  normalizeOptionalString(value) {
    return (0, profile_utils_1.normalizeUserProfileOptionalString)(value);
  }
  normalizeLanguages(languages) {
    return (0, profile_utils_1.normalizeUserProfileLanguages)(languages);
  }
  normalizeLinks(links) {
    return (0, profile_utils_1.normalizeUserProfileLinks)(links);
  }
}
exports.UserProfileEntity = UserProfileEntity;
//# sourceMappingURL=profile.entity.js.map
