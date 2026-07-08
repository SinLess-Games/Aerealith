'use strict';
// libs/core/src/entities/user/session.entity.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.UserSessionEntity = void 0;
const base_entity_1 = require('../base.entity');
/**
 * Represents an authenticated browser, device, or API session for a user.
 */
class UserSessionEntity extends base_entity_1.BaseEntity {
  userId;
  /**
   * Hashed session token.
   *
   * Never store the raw token in the database.
   */
  tokenHash;
  deviceName;
  userAgent;
  ipAddress;
  geoIp;
  lastSeenAt;
  expiresAt;
  revokedAt;
  constructor(input) {
    super(input);
    this.userId = input.userId.trim();
    this.tokenHash = input.tokenHash.trim();
    this.deviceName = this.normalizeOptionalString(input.deviceName);
    this.userAgent = this.normalizeOptionalString(input.userAgent);
    this.ipAddress = this.normalizeOptionalString(input.ipAddress);
    this.geoIp = input.geoIp ?? null;
    this.lastSeenAt = input.lastSeenAt ?? this.createdAt;
    this.expiresAt = input.expiresAt;
    this.revokedAt = input.revokedAt ?? null;
  }
  get isRevoked() {
    return this.revokedAt !== null;
  }
  get isActive() {
    return !this.isRevoked && !this.isExpired();
  }
  isExpired(now = new Date()) {
    return this.expiresAt.getTime() <= now.getTime();
  }
  recordActivity(input = {}) {
    const now = new Date();
    if (input.ipAddress !== undefined) {
      this.ipAddress = this.normalizeOptionalString(input.ipAddress);
    }
    if (input.geoIp !== undefined) {
      this.geoIp = input.geoIp;
    }
    if (input.userAgent !== undefined) {
      this.userAgent = this.normalizeOptionalString(input.userAgent);
    }
    this.lastSeenAt = now;
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
exports.UserSessionEntity = UserSessionEntity;
//# sourceMappingURL=session.entity.js.map
