'use strict';
// libs/core/src/enumns/entities/profile/profile-field-visibility.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.ProfileFieldVisibilityValues =
  exports.DefaultProfileFieldVisibility =
  exports.ProfileFieldVisibility =
    void 0;
exports.isProfileFieldVisibility = isProfileFieldVisibility;
/**
 * Simple per-field profile visibility options.
 */
exports.ProfileFieldVisibility = {
  Private: 'private',
  Public: 'public',
  ConnectionsOnly: 'connections_only',
  OrganizationOnly: 'organization_only',
};
exports.DefaultProfileFieldVisibility = exports.ProfileFieldVisibility.Private;
exports.ProfileFieldVisibilityValues = Object.values(
  exports.ProfileFieldVisibility,
);
function isProfileFieldVisibility(value) {
  return (
    typeof value === 'string' &&
    exports.ProfileFieldVisibilityValues.includes(value)
  );
}
//# sourceMappingURL=profile-field-visibility.enum.js.map
