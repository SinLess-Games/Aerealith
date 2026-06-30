import { and, eq, isNull } from 'drizzle-orm'

import type {
  Country,
  Gender,
  ProfileStatus,
  RomanticOrientation,
  Sex,
  SexAttitude,
  Sexuality,
  UserProfileContract,
  UserProfileFieldVisibility,
  UserProfileLanguage,
  UserProfileLink,
} from '@aerealith-ai/core'

import type { DatabaseClient } from '../../client'
import {
  type NewUserProfileRow,
  type UserProfileRow,
  userProfilesTable,
} from '../../schema'

export type CreateUserProfileInput = {
  userId: string
  handle: string

  displayName?: string | null
  givenName?: string | null
  middleName?: string | null
  familyName?: string | null
  pronouns?: string | null

  avatarUrl?: string | null
  bannerUrl?: string | null
  bio?: string | null

  status?: ProfileStatus
  fieldVisibility?: UserProfileFieldVisibility

  locationLabel?: string | null
  country?: Country | null

  gender?: Gender | null
  sex?: Sex | null
  sexuality?: Sexuality | null
  romanticOrientation?: RomanticOrientation | null
  sexAttitude?: SexAttitude | null

  languages?: UserProfileLanguage[]
  websiteUrl?: string | null
  links?: UserProfileLink[]
}

export type UpdateUserProfileInput = Omit<
  Partial<CreateUserProfileInput>,
  'userId'
>

const optionalStringFields = [
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
] as const

const directUpdateFields = [
  'status',
  'fieldVisibility',
  'country',
  'gender',
  'sex',
  'sexuality',
  'romanticOrientation',
  'sexAttitude',
  'languages',
  'links',
] as const

type OptionalStringField = (typeof optionalStringFields)[number]

type DirectUpdateField = (typeof directUpdateFields)[number]

/**
 * Drizzle persistence for user profiles.
 *
 * This repository returns complete owner-facing profile data.
 * Services are responsible for applying field visibility before returning
 * public profile responses.
 */
export class DrizzleUserProfileRepository {
  constructor(private readonly database: DatabaseClient) {}

  async findByUserId(userId: string): Promise<UserProfileContract | null> {
    const [row] = await this.database
      .select()
      .from(userProfilesTable)
      .where(
        and(
          eq(userProfilesTable.userId, userId),
          isNull(userProfilesTable.deletedAt),
        ),
      )
      .limit(1)

    return row ? toUserProfileContract(row) : null
  }

  async findByHandle(handle: string): Promise<UserProfileContract | null> {
    const [row] = await this.database
      .select()
      .from(userProfilesTable)
      .where(
        and(
          eq(userProfilesTable.handle, normalizeHandle(handle)),
          isNull(userProfilesTable.deletedAt),
        ),
      )
      .limit(1)

    return row ? toUserProfileContract(row) : null
  }

  async create(input: CreateUserProfileInput): Promise<UserProfileContract> {
    const [row] = await this.database
      .insert(userProfilesTable)
      .values(toNewUserProfileRow(input))
      .returning()

    if (!row) {
      throw new Error('Failed to create user profile.')
    }

    return toUserProfileContract(row)
  }

  async update(
    userId: string,
    input: UpdateUserProfileInput,
  ): Promise<UserProfileContract | null> {
    const values = createUpdateValues(input)

    if (Object.keys(values).length === 0) {
      return this.findByUserId(userId)
    }

    const [row] = await this.database
      .update(userProfilesTable)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userProfilesTable.userId, userId),
          isNull(userProfilesTable.deletedAt),
        ),
      )
      .returning()

    return row ? toUserProfileContract(row) : null
  }

  async softDeleteByUserId(userId: string): Promise<boolean> {
    const now = new Date()

    const [row] = await this.database
      .update(userProfilesTable)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(userProfilesTable.userId, userId),
          isNull(userProfilesTable.deletedAt),
        ),
      )
      .returning({
        id: userProfilesTable.id,
      })

    return row !== undefined
  }
}

function toNewUserProfileRow(input: CreateUserProfileInput): NewUserProfileRow {
  return {
    userId: input.userId.trim(),
    handle: normalizeHandle(input.handle),

    displayName: normalizeOptionalString(input.displayName),
    givenName: normalizeOptionalString(input.givenName),
    middleName: normalizeOptionalString(input.middleName),
    familyName: normalizeOptionalString(input.familyName),
    pronouns: normalizeOptionalString(input.pronouns),

    avatarUrl: normalizeOptionalString(input.avatarUrl),
    bannerUrl: normalizeOptionalString(input.bannerUrl),
    bio: normalizeOptionalString(input.bio),

    status: input.status,
    fieldVisibility: input.fieldVisibility,

    locationLabel: normalizeOptionalString(input.locationLabel),
    country: input.country,

    gender: input.gender,
    sex: input.sex,
    sexuality: input.sexuality,
    romanticOrientation: input.romanticOrientation,
    sexAttitude: input.sexAttitude,

    languages: input.languages,
    websiteUrl: normalizeOptionalString(input.websiteUrl),
    links: input.links,
  }
}

function createUpdateValues(
  input: UpdateUserProfileInput,
): Partial<NewUserProfileRow> {
  const values: Partial<NewUserProfileRow> = {}

  setDefinedValue(values, 'handle', normalizeUpdatedHandle(input.handle))
  setOptionalStringUpdateValues(values, input)
  setDirectUpdateValues(values, input)

  return values
}

function setOptionalStringUpdateValues(
  values: Partial<NewUserProfileRow>,
  input: UpdateUserProfileInput,
): void {
  for (const field of optionalStringFields) {
    const value = input[field]

    setDefinedValue(
      values,
      field,
      value === undefined ? undefined : normalizeOptionalString(value),
    )
  }
}

function setDirectUpdateValues(
  values: Partial<NewUserProfileRow>,
  input: UpdateUserProfileInput,
): void {
  for (const field of directUpdateFields) {
    setDefinedValue(values, field, input[field])
  }
}

function setDefinedValue<TKey extends keyof NewUserProfileRow>(
  values: Partial<NewUserProfileRow>,
  key: TKey,
  value: NewUserProfileRow[TKey] | undefined,
): void {
  if (value !== undefined) {
    values[key] = value
  }
}

function toUserProfileContract(row: UserProfileRow): UserProfileContract {
  return {
    id: row.id,
    userId: row.userId,

    handle: row.handle,

    displayName: row.displayName,
    givenName: row.givenName,
    middleName: row.middleName,
    familyName: row.familyName,
    pronouns: row.pronouns,

    avatarUrl: row.avatarUrl,
    bannerUrl: row.bannerUrl,
    bio: row.bio,

    status: row.status as ProfileStatus,
    fieldVisibility: row.fieldVisibility,

    locationLabel: row.locationLabel,
    country: row.country,

    gender: row.gender,
    sex: row.sex,
    sexuality: row.sexuality,
    romanticOrientation: row.romanticOrientation,
    sexAttitude: row.sexAttitude,

    languages: row.languages,
    websiteUrl: row.websiteUrl,
    links: row.links,

    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function normalizeHandle(handle: string): string {
  return handle.trim().toLowerCase()
}

function normalizeUpdatedHandle(value: string | undefined): string | undefined {
  return value === undefined ? undefined : normalizeHandle(value)
}

function normalizeOptionalString(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim()

  return normalized || null
}
