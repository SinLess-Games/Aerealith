'use strict';
// libs/core/src/schemas/entities/user/profile.schema.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.UserProfileContractSchema =
  exports.PublicUserProfileContractSchema =
  exports.UpdateUserProfileEntitySchema =
  exports.CreateUserProfileEntitySchema =
  exports.UserProfileEntitySchema =
  exports.UserProfileFieldVisibilitySchema =
  exports.UserProfileFieldSchema =
  exports.UserProfileLanguageSchema =
  exports.UserProfileLinkSchema =
  exports.UserProfileUrlSchema =
  exports.UserProfileLocationSchema =
  exports.UserProfileBioSchema =
  exports.UserProfilePronounsSchema =
  exports.UserProfileNameSchema =
  exports.UserProfileHandleSchema =
  exports.UserProfileIdSchema =
    void 0;
const zod_1 = require('zod');
const profile_utils_1 = require('../../../entities/user/profile.utils');
const enumns_1 = require('../../../enumns');
/**
 * Internal user profile entity ID.
 */
exports.UserProfileIdSchema = zod_1.z.uuid();
/**
 * Public profile handle.
 *
 * Handles are stored lowercase.
 */
exports.UserProfileHandleSchema = zod_1.z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(32)
  .regex(/^[a-z0-9_]+$/);
exports.UserProfileNameSchema = zod_1.z.string().trim().min(1).max(100);
exports.UserProfilePronounsSchema = zod_1.z.string().trim().min(1).max(100);
exports.UserProfileBioSchema = zod_1.z.string().trim().max(2_000);
exports.UserProfileLocationSchema = zod_1.z.string().trim().min(1).max(200);
exports.UserProfileUrlSchema = zod_1.z.string().trim().pipe(zod_1.z.url());
const UserProfileCountrySchema = zod_1.z.enum(enumns_1.Country);
const UserProfileGenderSchema = zod_1.z.enum(enumns_1.Gender);
const UserProfileLanguageProficiencySchema = zod_1.z.enum(
  enumns_1.LanguageProficiency,
);
const UserProfileLanguageValueSchema = zod_1.z.enum(enumns_1.Languages);
const UserProfileFieldVisibilityValueSchema = zod_1.z.enum(
  enumns_1.ProfileFieldVisibility,
);
const UserProfileLinkPlatformSchema = zod_1.z.enum(
  enumns_1.ProfileLinkPlatform,
);
const UserProfileStatusSchema = zod_1.z.enum(enumns_1.ProfileStatus);
const UserProfileRomanticOrientationSchema = zod_1.z.enum(
  enumns_1.RomanticOrientation,
);
const UserProfileSexSchema = zod_1.z.enum(enumns_1.Sex);
const UserProfileSexAttitudeSchema = zod_1.z.enum(enumns_1.SexAttitude);
const UserProfileSexualitySchema = zod_1.z.enum(enumns_1.Sexuality);
const NullableUserProfileNameSchema = exports.UserProfileNameSchema.nullable();
const NullableUserProfilePronounsSchema =
  exports.UserProfilePronounsSchema.nullable();
const NullableUserProfileBioSchema = exports.UserProfileBioSchema.nullable();
const NullableUserProfileLocationSchema =
  exports.UserProfileLocationSchema.nullable();
const NullableUserProfileUrlSchema = exports.UserProfileUrlSchema.nullable();
/**
 * A supported external profile link.
 */
exports.UserProfileLinkSchema = zod_1.z.object({
  platform: UserProfileLinkPlatformSchema,
  url: exports.UserProfileUrlSchema,
  label: zod_1.z.string().trim().min(1).max(100).nullable().optional(),
});
/**
 * A language known by the user.
 */
exports.UserProfileLanguageSchema = zod_1.z.object({
  language: UserProfileLanguageValueSchema,
  proficiency: UserProfileLanguageProficiencySchema.optional(),
  isPrimary: zod_1.z.boolean().optional(),
});
/**
 * Individual profile fields that support visibility overrides.
 */
const UserProfileFieldValues = [...profile_utils_1.UserProfileFields];
exports.UserProfileFieldSchema = zod_1.z.enum(UserProfileFieldValues);
/**
 * Per-field profile visibility overrides.
 *
 * Every field is optional, but only supported profile field names are accepted.
 */
exports.UserProfileFieldVisibilitySchema = zod_1.z.partialRecord(
  exports.UserProfileFieldSchema,
  UserProfileFieldVisibilityValueSchema,
);
/**
 * Reusable profile fields shared by entity, create, update, and API schemas.
 */
const UserProfileFieldsSchema = zod_1.z.object({
  handle: exports.UserProfileHandleSchema,
  displayName: NullableUserProfileNameSchema,
  givenName: NullableUserProfileNameSchema,
  middleName: NullableUserProfileNameSchema,
  familyName: NullableUserProfileNameSchema,
  pronouns: NullableUserProfilePronounsSchema,
  avatarUrl: NullableUserProfileUrlSchema,
  bannerUrl: NullableUserProfileUrlSchema,
  bio: NullableUserProfileBioSchema,
  status: UserProfileStatusSchema,
  fieldVisibility: exports.UserProfileFieldVisibilitySchema,
  locationLabel: NullableUserProfileLocationSchema,
  country: UserProfileCountrySchema.nullable(),
  gender: UserProfileGenderSchema.nullable(),
  sex: UserProfileSexSchema.nullable(),
  sexuality: UserProfileSexualitySchema.nullable(),
  romanticOrientation: UserProfileRomanticOrientationSchema.nullable(),
  sexAttitude: UserProfileSexAttitudeSchema.nullable(),
  languages: zod_1.z.array(exports.UserProfileLanguageSchema),
  websiteUrl: NullableUserProfileUrlSchema,
  links: zod_1.z.array(exports.UserProfileLinkSchema),
});
const PublicUserProfileFieldsSchema = UserProfileFieldsSchema.pick({
  handle: true,
  displayName: true,
  pronouns: true,
  avatarUrl: true,
  bannerUrl: true,
  bio: true,
  locationLabel: true,
  country: true,
  languages: true,
  websiteUrl: true,
  links: true,
});
const PrivateUserProfileFieldsSchema = UserProfileFieldsSchema.pick({
  givenName: true,
  middleName: true,
  familyName: true,
  status: true,
  fieldVisibility: true,
  gender: true,
  sex: true,
  sexuality: true,
  romanticOrientation: true,
  sexAttitude: true,
});
/**
 * Full internal user profile entity schema.
 *
 * Includes private profile fields, so do not use this schema directly
 * for public profile responses.
 */
exports.UserProfileEntitySchema = UserProfileFieldsSchema.extend({
  id: exports.UserProfileIdSchema,
  userId: zod_1.z.uuid(),
  createdAt: zod_1.z.coerce.date(),
  updatedAt: zod_1.z.coerce.date(),
  deletedAt: zod_1.z.coerce.date().nullable(),
});
/**
 * Data accepted when creating a user profile.
 *
 * Most profile data is optional because the entity provides defaults.
 */
exports.CreateUserProfileEntitySchema =
  UserProfileFieldsSchema.partial().extend({
    userId: zod_1.z.uuid(),
    handle: exports.UserProfileHandleSchema,
  });
/**
 * Data allowed when updating an existing user profile.
 */
exports.UpdateUserProfileEntitySchema = UserProfileFieldsSchema.partial();
/**
 * Profile data safe for public responses.
 *
 * Your service must still apply `fieldVisibility` before returning fields.
 */
exports.PublicUserProfileContractSchema = PublicUserProfileFieldsSchema.extend({
  userId: zod_1.z.uuid(),
  createdAt: zod_1.z.iso.datetime(),
});
/**
 * Full profile response for the owner or an authorized administrator.
 */
exports.UserProfileContractSchema =
  exports.PublicUserProfileContractSchema.extend({
    id: exports.UserProfileIdSchema,
    ...PrivateUserProfileFieldsSchema.shape,
    updatedAt: zod_1.z.iso.datetime(),
  });
//# sourceMappingURL=profile.schema.js.map
