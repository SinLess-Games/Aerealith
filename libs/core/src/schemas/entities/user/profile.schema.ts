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

/**
 * A supported external profile link.
 */
export const UserProfileLinkSchema = z.object({
  platform: z.enum(ProfileLinkPlatform),
  url: UserProfileUrlSchema,
  label: z.string().trim().min(1).max(100).nullable().optional(),
})

/**
 * A language known by the user.
 */
export const UserProfileLanguageSchema = z.object({
  language: z.enum(Languages),
  proficiency: z.enum(LanguageProficiency).optional(),
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
 */
export const UserProfileFieldVisibilitySchema = z
  .object({
    handle: z.enum(ProfileFieldVisibility).optional(),
    displayName: z.enum(ProfileFieldVisibility).optional(),
    givenName: z.enum(ProfileFieldVisibility).optional(),
    middleName: z.enum(ProfileFieldVisibility).optional(),
    familyName: z.enum(ProfileFieldVisibility).optional(),
    pronouns: z.enum(ProfileFieldVisibility).optional(),
    avatarUrl: z.enum(ProfileFieldVisibility).optional(),
    bannerUrl: z.enum(ProfileFieldVisibility).optional(),
    bio: z.enum(ProfileFieldVisibility).optional(),
    locationLabel: z.enum(ProfileFieldVisibility).optional(),
    country: z.enum(ProfileFieldVisibility).optional(),
    gender: z.enum(ProfileFieldVisibility).optional(),
    sex: z.enum(ProfileFieldVisibility).optional(),
    sexuality: z.enum(ProfileFieldVisibility).optional(),
    romanticOrientation: z.enum(ProfileFieldVisibility).optional(),
    sexAttitude: z.enum(ProfileFieldVisibility).optional(),
    languages: z.enum(ProfileFieldVisibility).optional(),
    websiteUrl: z.enum(ProfileFieldVisibility).optional(),
    links: z.enum(ProfileFieldVisibility).optional(),
    createdAt: z.enum(ProfileFieldVisibility).optional(),
  })
  .partial()

/**
 * Full internal user profile entity schema.
 *
 * Includes private profile fields, so do not use this schema directly
 * for public profile responses.
 */
export const UserProfileEntitySchema = z.object({
  id: UserProfileIdSchema,
  userId: z.uuid(),

  handle: UserProfileHandleSchema,

  displayName: UserProfileNameSchema.nullable(),
  givenName: UserProfileNameSchema.nullable(),
  middleName: UserProfileNameSchema.nullable(),
  familyName: UserProfileNameSchema.nullable(),
  pronouns: UserProfilePronounsSchema.nullable(),

  avatarUrl: UserProfileUrlSchema.nullable(),
  bannerUrl: UserProfileUrlSchema.nullable(),
  bio: UserProfileBioSchema.nullable(),

  status: z.enum(ProfileStatus),
  fieldVisibility: UserProfileFieldVisibilitySchema,

  locationLabel: UserProfileLocationSchema.nullable(),
  country: z.enum(Country).nullable(),

  gender: z.enum(Gender).nullable(),
  sex: z.enum(Sex).nullable(),
  sexuality: z.enum(Sexuality).nullable(),
  romanticOrientation: z.enum(RomanticOrientation).nullable(),
  sexAttitude: z.enum(SexAttitude).nullable(),

  languages: z.array(UserProfileLanguageSchema),

  websiteUrl: UserProfileUrlSchema.nullable(),
  links: z.array(UserProfileLinkSchema),

  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

/**
 * Data accepted when creating a user profile.
 *
 * Most profile data is optional because the entity provides defaults.
 */
export const CreateUserProfileEntitySchema = z.object({
  userId: z.uuid(),
  handle: UserProfileHandleSchema,

  displayName: UserProfileNameSchema.nullable().optional(),
  givenName: UserProfileNameSchema.nullable().optional(),
  middleName: UserProfileNameSchema.nullable().optional(),
  familyName: UserProfileNameSchema.nullable().optional(),
  pronouns: UserProfilePronounsSchema.nullable().optional(),

  avatarUrl: UserProfileUrlSchema.nullable().optional(),
  bannerUrl: UserProfileUrlSchema.nullable().optional(),
  bio: UserProfileBioSchema.nullable().optional(),

  status: z.enum(ProfileStatus).optional(),
  fieldVisibility: UserProfileFieldVisibilitySchema.optional(),

  locationLabel: UserProfileLocationSchema.nullable().optional(),
  country: z.enum(Country).nullable().optional(),

  gender: z.enum(Gender).nullable().optional(),
  sex: z.enum(Sex).nullable().optional(),
  sexuality: z.enum(Sexuality).nullable().optional(),
  romanticOrientation: z.enum(RomanticOrientation).nullable().optional(),
  sexAttitude: z.enum(SexAttitude).nullable().optional(),

  languages: z.array(UserProfileLanguageSchema).optional(),

  websiteUrl: UserProfileUrlSchema.nullable().optional(),
  links: z.array(UserProfileLinkSchema).optional(),
})

/**
 * Data allowed when updating an existing user profile.
 */
export const UpdateUserProfileEntitySchema = z.object({
  handle: UserProfileHandleSchema.optional(),

  displayName: UserProfileNameSchema.nullable().optional(),
  givenName: UserProfileNameSchema.nullable().optional(),
  middleName: UserProfileNameSchema.nullable().optional(),
  familyName: UserProfileNameSchema.nullable().optional(),
  pronouns: UserProfilePronounsSchema.nullable().optional(),

  avatarUrl: UserProfileUrlSchema.nullable().optional(),
  bannerUrl: UserProfileUrlSchema.nullable().optional(),
  bio: UserProfileBioSchema.nullable().optional(),

  status: z.enum(ProfileStatus).optional(),
  fieldVisibility: UserProfileFieldVisibilitySchema.optional(),

  locationLabel: UserProfileLocationSchema.nullable().optional(),
  country: z.enum(Country).nullable().optional(),

  gender: z.enum(Gender).nullable().optional(),
  sex: z.enum(Sex).nullable().optional(),
  sexuality: z.enum(Sexuality).nullable().optional(),
  romanticOrientation: z.enum(RomanticOrientation).nullable().optional(),
  sexAttitude: z.enum(SexAttitude).nullable().optional(),

  languages: z.array(UserProfileLanguageSchema).optional(),

  websiteUrl: UserProfileUrlSchema.nullable().optional(),
  links: z.array(UserProfileLinkSchema).optional(),
})

/**
 * Profile data safe for public responses.
 *
 * Your service must still apply `fieldVisibility` before returning fields.
 */
export const PublicUserProfileContractSchema = z.object({
  userId: z.uuid(),
  handle: UserProfileHandleSchema,

  displayName: UserProfileNameSchema.nullable(),
  pronouns: UserProfilePronounsSchema.nullable(),

  avatarUrl: UserProfileUrlSchema.nullable(),
  bannerUrl: UserProfileUrlSchema.nullable(),
  bio: UserProfileBioSchema.nullable(),

  locationLabel: UserProfileLocationSchema.nullable(),
  country: z.enum(Country).nullable(),

  languages: z.array(UserProfileLanguageSchema),

  websiteUrl: UserProfileUrlSchema.nullable(),
  links: z.array(UserProfileLinkSchema),

  createdAt: z.iso.datetime(),
})

/**
 * Full profile response for the owner or an authorized administrator.
 */
export const UserProfileContractSchema = PublicUserProfileContractSchema.extend(
  {
    id: UserProfileIdSchema,

    givenName: UserProfileNameSchema.nullable(),
    middleName: UserProfileNameSchema.nullable(),
    familyName: UserProfileNameSchema.nullable(),

    status: z.enum(ProfileStatus),
    fieldVisibility: UserProfileFieldVisibilitySchema,

    gender: z.enum(Gender).nullable(),
    sex: z.enum(Sex).nullable(),
    sexuality: z.enum(Sexuality).nullable(),
    romanticOrientation: z.enum(RomanticOrientation).nullable(),
    sexAttitude: z.enum(SexAttitude).nullable(),

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
