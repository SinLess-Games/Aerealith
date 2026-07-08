'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.UserAccountEntity = void 0;
const base_entity_1 = require('../base.entity');
class UserAccountEntity extends base_entity_1.BaseEntity {
  userId;
  provider;
  accountId;
  displayName;
  managementUrl;
  status;
  connectedAt;
  constructor(input) {
    super(input);
    this.userId = input.userId;
    this.provider = this.normalizeProvider(input.provider);
    this.accountId = input.accountId.trim();
    this.displayName = input.displayName.trim();
    this.managementUrl = this.normalizeOptionalUrl(input.managementUrl);
    this.status = input.status ?? 'active';
    this.connectedAt = input.connectedAt ?? new Date();
  }
  activate() {
    this.status = 'active';
    this.touch();
  }
  revoke() {
    this.status = 'revoked';
    this.touch();
  }
  suspend() {
    this.status = 'suspended';
    this.touch();
  }
  expire() {
    this.status = 'expired';
    this.touch();
  }
  updateDisplayName(displayName) {
    this.displayName = displayName.trim();
    this.touch();
  }
  updateManagementUrl(managementUrl) {
    this.managementUrl = this.normalizeOptionalUrl(managementUrl);
    this.touch();
  }
  normalizeProvider(provider) {
    return provider.trim().toLowerCase();
  }
  normalizeOptionalUrl(value) {
    return value?.trim() || null;
  }
}
exports.UserAccountEntity = UserAccountEntity;
//# sourceMappingURL=account.entity.js.map
