'use strict';
// libs/core/src/enumns/entities/profile/profile-module-status.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.ProfileModuleStatusValues =
  exports.DefaultProfileModuleStatus =
  exports.ProfileModuleStatus =
    void 0;
exports.isProfileModuleStatus = isProfileModuleStatus;
/**
 * Status values for profile modules and integrations.
 */
exports.ProfileModuleStatus = {
  Enabled: 'enabled',
  Disabled: 'disabled',
  Pending: 'pending',
  Failed: 'failed',
  Archived: 'archived',
  Revoked: 'revoked',
};
exports.DefaultProfileModuleStatus = exports.ProfileModuleStatus.Disabled;
exports.ProfileModuleStatusValues = Object.values(exports.ProfileModuleStatus);
function isProfileModuleStatus(value) {
  return (
    typeof value === 'string' &&
    exports.ProfileModuleStatusValues.includes(value)
  );
}
//# sourceMappingURL=profile-module-status.enum.js.map
