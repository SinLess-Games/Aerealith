'use strict';
// libs/core/src/entities/user/consent.entity.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.UserConsentEntity = exports.UserConsentType = void 0;
const base_entity_1 = require('../base.entity');
exports.UserConsentType = {
  TermsOfService: 'terms_of_service',
  PrivacyPolicy: 'privacy_policy',
  MarketingEmails: 'marketing_emails',
  ProductUpdates: 'product_updates',
  Analytics: 'analytics',
  Cookies: 'cookies',
};
/**
 * Records a user's consent decision for a specific policy or preference.
 *
 * A consent record is active when it has been granted and not revoked.
 */
class UserConsentEntity extends base_entity_1.BaseEntity {
  userId;
  type;
  version;
  grantedAt;
  revokedAt;
  constructor(input) {
    super(input);
    this.userId = input.userId.trim();
    this.type = input.type;
    this.version = this.normalizeOptionalString(input.version);
    this.grantedAt = input.grantedAt ?? null;
    this.revokedAt = input.revokedAt ?? null;
  }
  get isGranted() {
    return this.grantedAt !== null && this.revokedAt === null;
  }
  grant(version) {
    const now = new Date();
    this.version = this.normalizeOptionalString(version) ?? this.version;
    this.grantedAt = now;
    this.revokedAt = null;
    this.updatedAt = now;
  }
  revoke() {
    const now = new Date();
    this.revokedAt = now;
    this.updatedAt = now;
  }
  normalizeOptionalString(value) {
    const normalized = value?.trim();
    return normalized || null;
  }
}
exports.UserConsentEntity = UserConsentEntity;
//# sourceMappingURL=consent.entity.js.map
