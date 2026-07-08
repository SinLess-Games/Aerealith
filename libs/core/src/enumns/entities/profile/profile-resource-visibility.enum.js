'use strict';
// libs/core/src/enumns/entities/profile/profile-resource-visibility.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.ProfileResourceVisibilityValues =
  exports.DefaultProfileResourceVisibility =
  exports.ProfileResourceVisibility =
    void 0;
exports.isProfileResourceVisibility = isProfileResourceVisibility;
/**
 * Visibility options for profile resources such as links, files, media, or modules.
 */
exports.ProfileResourceVisibility = {
  Private: 'private',
  Public: 'public',
  Unlisted: 'unlisted',
};
exports.DefaultProfileResourceVisibility =
  exports.ProfileResourceVisibility.Private;
exports.ProfileResourceVisibilityValues = Object.values(
  exports.ProfileResourceVisibility,
);
function isProfileResourceVisibility(value) {
  return (
    typeof value === 'string' &&
    exports.ProfileResourceVisibilityValues.includes(value)
  );
}
//# sourceMappingURL=profile-resource-visibility.enum.js.map
