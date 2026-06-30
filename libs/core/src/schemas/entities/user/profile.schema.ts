// libs/core/src/schemas/entities/user/profile.schema.ts

import { z } from 'zod'

import {
  Country,
  Gender,
  LanguageProficiency,
  Languages,
  ProfileFieldVisibility,
  ProfileLinkPlatform,
  ProfileStatus,
  RomanticOrientation,
  Sex,
  SexAttitude,
  Sexuality,
} from '../../../enumns'

/**
 * Internal user profile entity ID.
 */
export const UserProfileIdSchema = z.uuid()

/**
 * Public profile handle.
 *
 * Handles are stored lowercase.
 */
export const UserProfileHandleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(32)
  .regex(/^[a-z0-9_]+$/)

export const UserProfileNameSchema = z.string().trim().min(1).max(100)

export const UserProfilePronounsSchema = z.string().trim().min(1).max(100)

export const UserProfileBioSchema = z.string().trim().max(2_000)

export const UserProfileLocationSchema = z.string().trim().min(1).max(200)

export const UserProfileUrlSchema = z.string().trim().pipe(z.url())

const UserProfileCountrySchema = z.enum(Country)

const UserProfileGenderSchema = z.enum(Gender)

const UserProfileLanguageProficiencySchema = z.enum(LanguageProficiency)

const UserProfileLanguageValueSchema = z.enum(Languages)

const UserProfileFieldVisibilityValueSchema = z.enum(ProfileFieldVisibility)

const UserProfileLinkPlatformSchema = z.enum(ProfileLinkPlatform)

const UserProfileStatusSchema = z.enum(ProfileStatus)

const UserProfileRomanticOrientationSchema = z.enum(RomanticOrientation)

const UserProfileSexSchema = z.enum(Sex)

const UserProfileSexAttitudeSchema = z.enum(SexAttitude)

const UserProfileSexualitySchema = z.enum(Sexuality)

const NullableUserProfileNameSchema = UserProfileNameSchema.nullable()

const NullableUserProfilePronounsSchema = UserProfilePronounsSchema.nullable()

const NullableUserProfileBioSchema = UserProfileBioSchema.nullable()

const NullableUserProfileLocationSchema = UserProfileLocationSchema.nullable()

const NullableUserProfileUrlSchema = UserProfileUrlSchema.nullable()

/**
 * A supported external profile link.
 */
export const UserProfileLinkSchema = z.object({
  platform: UserProfileLinkPlatformSchema,
  url: UserProfileUrlSchema,
  label: z.string().trim().min(1).max(100).nullable().optional(),
})

/**
 * A language known by the user.
 */
export const UserProfileLanguageSchema = z.object({
  language: UserProfileLanguageValueSchema,
  proficiency: UserProfileLanguageProficiencySchema.optional(),
  isPrimary: z.boolean().optional(),
})

/**
 * Individual profile fields that support visibility overrides.
 */
export const UserProfileFieldSchema = z.enum([
  'handle',
  'displayName',
  'givenName',
  'middleName',
  'familyName',
  'pronouns',
  'avatarUrl',
  'bannerUrl',
  'bio',
  'locationLabel',
  'country',
  'gender',
  'sex',
  'sexuality',
  'romanticOrientation',
  'sexAttitude',
  'languages',
  'websiteUrl',
  'links',
  'createdAt',
])

/**
 * Per-field profile visibility overrides.
 *
 * Every field is optional, but only supported profile field names are accepted.
 */
export const UserProfileFieldVisibilitySchema = z.partialRecord(
  UserProfileFieldSchema,
  UserProfileFieldVisibilityValueSchema,
)

/**
 * Reusable profile fields shared by entity, create, update, and API schemas.
 */
const UserProfileFieldsSchema = z.object({
  handle: UserProfileHandleSchema,

  displayName: NullableUserProfileNameSchema,
  givenName: NullableUserProfileNameSchema,
  middleName: NullableUserProfileNameSchema,
  familyName: NullableUserProfileNameSchema,
  pronouns: NullableUserProfilePronounsSchema,

  avatarUrl: NullableUserProfileUrlSchema,
  bannerUrl: NullableUserProfileUrlSchema,
  bio: NullableUserProfileBioSchema,

  status: UserProfileStatusSchema,
  fieldVisibility: UserProfileFieldVisibilitySchema,

  locationLabel: NullableUserProfileLocationSchema,
  country: UserProfileCountrySchema.nullable(),

  gender: UserProfileGenderSchema.nullable(),
  sex: UserProfileSexSchema.nullable(),
  sexuality: UserProfileSexualitySchema.nullable(),
  romanticOrientation: UserProfileRomanticOrientationSchema.nullable(),
  sexAttitude: UserProfileSexAttitudeSchema.nullable(),

  languages: z.array(UserProfileLanguageSchema),

  websiteUrl: NullableUserProfileUrlSchema,
  links: z.array(UserProfileLinkSchema),
})

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
})

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
})

/**
 * Full internal user profile entity schema.
 *
 * Includes private profile fields, so do not use this schema directly
 * for public profile responses.
 */
export const UserProfileEntitySchema = UserProfileFieldsSchema.extend({
  id: UserProfileIdSchema,
  userId: z.uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

/**
 * Data accepted when creating a user profile.
 *
 * Most profile data is optional because the entity provides defaults.
 */
export const CreateUserProfileEntitySchema =
  UserProfileFieldsSchema.partial().extend({
    userId: z.uuid(),
    handle: UserProfileHandleSchema,
  })

/**
 * Data allowed when updating an existing user profile.
 */
export const UpdateUserProfileEntitySchema = UserProfileFieldsSchema.partial()

/**
 * Profile data safe for public responses.
 *
 * Your service must still apply `fieldVisibility` before returning fields.
 */
export const PublicUserProfileContractSchema =
  PublicUserProfileFieldsSchema.extend({
    userId: z.uuid(),
    createdAt: z.iso.datetime(),
  })

/**
 * Full profile response for the owner or an authorized administrator.
 */
export const UserProfileContractSchema = PublicUserProfileContractSchema.extend(
  {
    id: UserProfileIdSchema,

    ...PrivateUserProfileFieldsSchema.shape,

    updatedAt: z.iso.datetime(),
  },
)

export type UserProfileEntitySchemaType = z.infer<
  typeof UserProfileEntitySchema
>

export type CreateUserProfileEntityInput = z.infer<
  typeof CreateUserProfileEntitySchema
>

export type UpdateUserProfileEntityInput = z.infer<
  typeof UpdateUserProfileEntitySchema
>

export type UserProfileLinkInput = z.infer<typeof UserProfileLinkSchema>

export type UserProfileLanguageInput = z.infer<typeof UserProfileLanguageSchema>

export type PublicUserProfileContractSchemaType = z.infer<
  typeof PublicUserProfileContractSchema
>

export type UserProfileContractSchemaType = z.infer<
  typeof UserProfileContractSchema
>
