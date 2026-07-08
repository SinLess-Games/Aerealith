'use strict';
// libs/core/src/enumns/entities/profile/profile-status.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.ProfileStatusValues =
  exports.DefaultProfileStatus =
  exports.ProfileStatus =
    void 0;
exports.isProfileStatus = isProfileStatus;
/**
 * User profile lifecycle status values.
 */
exports.ProfileStatus = {
  PendingSetup: 'pending_setup',
  Active: 'active',
  Hidden: 'hidden',
  Disabled: 'disabled',
  Suspended: 'suspended',
  UnderReview: 'under_review',
  Archived: 'archived',
  Deleted: 'deleted',
};
exports.DefaultProfileStatus = exports.ProfileStatus.PendingSetup;
exports.ProfileStatusValues = Object.values(exports.ProfileStatus);
function isProfileStatus(value) {
  return (
    typeof value === 'string' && exports.ProfileStatusValues.includes(value)
  );
}
//# sourceMappingURL=profile-status.enum.js.map
