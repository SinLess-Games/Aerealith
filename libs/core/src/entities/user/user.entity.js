'use strict';
// libs/core/src/entities/user/user.entity.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.UserEntity = exports.UserLifecycleStatus = void 0;
const enumns_1 = require('../../enumns');
const base_entity_1 = require('../base.entity');
/**
 * Account lifecycle states.
 *
 * `deleted` is intentionally not included because `BaseEntity.deletedAt`
 * already represents a soft-deleted user.
 */
exports.UserLifecycleStatus = {
  Active: 'active',
  Disabled: 'disabled',
  Suspended: 'suspended',
};
/**
 * Core application user account.
 *
 * Profile information belongs in `UserProfileEntity`.
 * Settings belong in `UserSettingsEntity`.
 * Preferences belong in `UserPreferencesEntity`.
 * Sessions belong in `UserSessionEntity`.
 */
class UserEntity extends base_entity_1.BaseEntity {
  /**
   * Unique account username.
   *
   * Always stored in lowercase.
   */
  username;
  /**
   * Primary account email address.
   *
   * Always stored in lowercase.
   */
  email;
  /**
   * Hashed password.
   *
   * Never expose this in API responses.
   * This can be null for OAuth-only accounts.
   */
  passwordHash;
  status;
  emailVerified;
  emailVerifiedAt;
  /**
   * Broad system permission role.
   *
   * Examples: user, moderator, admin, super_admin.
   */
  role;
  /**
   * Subscription plan tier.
   *
   * Examples: basic, premium, pro_plus.
   */
  tier;
  /**
   * Non-sensitive application metadata.
   *
   * Do not store credentials, tokens, passwords, or personal profile data here.
   */
  metadata;
  constructor(input) {
    super(input);
    this.username = this.normalizeUsername(input.username);
    this.email = this.normalizeEmail(input.email);
    this.passwordHash = this.normalizeOptionalString(input.passwordHash);
    this.status = input.status ?? exports.UserLifecycleStatus.Active;
    this.emailVerified = input.emailVerified ?? false;
    this.emailVerifiedAt = input.emailVerifiedAt ?? null;
    this.role = input.role ?? enumns_1.DefaultUserRole;
    this.tier = input.tier ?? enumns_1.DefaultUserTier;
    this.metadata = {
      ...input.metadata,
    };
  }
  get isActive() {
    return (
      this.status === exports.UserLifecycleStatus.Active && !this.isDeleted
    );
  }
  get hasVerifiedEmail() {
    return this.emailVerified && this.emailVerifiedAt !== null;
  }
  update(input) {
    if (input.username !== undefined) {
      this.username = this.normalizeUsername(input.username);
    }
    if (input.email !== undefined) {
      this.email = this.normalizeEmail(input.email);
      this.markEmailUnverified();
    }
    if (input.status !== undefined) {
      this.status = input.status;
    }
    if (input.role !== undefined) {
      this.role = input.role;
    }
    if (input.tier !== undefined) {
      this.tier = input.tier;
    }
    if (input.metadata !== undefined) {
      this.metadata = {
        ...this.metadata,
        ...input.metadata,
      };
    }
    this.touch();
  }
  setPasswordHash(passwordHash) {
    this.passwordHash = this.normalizeOptionalString(passwordHash);
    this.touch();
  }
  verifyEmail() {
    const now = new Date();
    this.emailVerified = true;
    this.emailVerifiedAt = now;
    this.updatedAt = now;
  }
  markEmailUnverified() {
    this.emailVerified = false;
    this.emailVerifiedAt = null;
  }
  activate() {
    this.status = exports.UserLifecycleStatus.Active;
    this.touch();
  }
  disable() {
    this.status = exports.UserLifecycleStatus.Disabled;
    this.touch();
  }
  suspend() {
    this.status = exports.UserLifecycleStatus.Suspended;
    this.touch();
  }
  setRole(role) {
    this.role = role;
    this.touch();
  }
  setTier(tier) {
    this.tier = tier;
    this.touch();
  }
  normalizeUsername(username) {
    return username.trim().toLowerCase();
  }
  normalizeEmail(email) {
    return email.trim().toLowerCase();
  }
  normalizeOptionalString(value) {
    const normalized = value?.trim();
    return normalized || null;
  }
}
exports.UserEntity = UserEntity;
//# sourceMappingURL=user.entity.js.map
