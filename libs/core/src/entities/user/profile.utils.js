'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.UserProfileFields =
  exports.UserProfilePersonalDetailFields =
  exports.UserProfileTextFields =
    void 0;
exports.normalizeUserProfileHandle = normalizeUserProfileHandle;
exports.normalizeUserProfileOptionalString = normalizeUserProfileOptionalString;
exports.normalizeUserProfileLanguages = normalizeUserProfileLanguages;
exports.normalizeUserProfileLinks = normalizeUserProfileLinks;
exports.UserProfileTextFields = [
  'displayName',
  'givenName',
  'middleName',
  'familyName',
  'pronouns',
  'avatarUrl',
  'bannerUrl',
  'bio',
  'locationLabel',
  'websiteUrl',
];
exports.UserProfilePersonalDetailFields = [
  'country',
  'gender',
  'sex',
  'sexuality',
  'romanticOrientation',
  'sexAttitude',
];
exports.UserProfileFields = [
  'handle',
  ...exports.UserProfileTextFields,
  ...exports.UserProfilePersonalDetailFields,
  'languages',
  'links',
  'createdAt',
];
function normalizeUserProfileHandle(handle) {
  return handle.trim().toLowerCase();
}
function normalizeUserProfileOptionalString(value) {
  const normalized = value?.trim();
  return normalized || null;
}
function normalizeUserProfileLanguages(languages) {
  return languages.map((language) => ({ ...language }));
}
function normalizeUserProfileLinks(links) {
  return links
    .map((link) => ({
      ...link,
      url: link.url.trim(),
      label: normalizeUserProfileOptionalString(link.label),
    }))
    .filter((link) => link.url.length > 0);
}
//# sourceMappingURL=profile.utils.js.map
