import { and, eq, isNull } from 'drizzle-orm'

import type {
  ProfileStatus,
  UserProfileContract,
  UserProfileInput,
  UserProfileUpdate,
} from '@aerealith-ai/core'

import {
  normalizeUserProfileHandle,
  normalizeUserProfileOptionalString,
  UserProfilePersonalDetailFields,
  UserProfileTextFields,
} from '@aerealith-ai/core'

import type { DatabaseClient } from '../../client'
import {
  type NewUserProfileRow,
  type UserProfileRow,
  userProfilesTable,
} from '../../schema'

export type CreateUserProfileInput = UserProfileInput

export type UpdateUserProfileInput = UserProfileUpdate

const directUpdateFields = [
  'status',
  'fieldVisibility',
  ...UserProfilePersonalDetailFields,
  'languages',
  'links',
] as const

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
      .where(activeProfilePredicate({ userId }))
      .limit(1)

    return row ? toUserProfileContract(row) : null
  }

  async findByHandle(handle: string): Promise<UserProfileContract | null> {
    const [row] = await this.database
      .select()
      .from(userProfilesTable)
      .where(activeProfilePredicate({ handle }))
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
      .where(activeProfilePredicate({ userId }))
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
      .where(activeProfilePredicate({ userId }))
      .returning({
        id: userProfilesTable.id,
      })

    return row !== undefined
  }
}

function activeProfilePredicate({
  userId,
  handle,
}: {
  userId?: string
  handle?: string
}) {
  const conditions = [isNull(userProfilesTable.deletedAt)]

  if (userId !== undefined) {
    conditions.push(eq(userProfilesTable.userId, userId))
  }

  if (handle !== undefined) {
    conditions.push(eq(userProfilesTable.handle, normalizeHandle(handle)))
  }

  return conditions.length === 1 ? conditions[0] : and(...conditions)
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
  for (const field of UserProfileTextFields) {
    const value = input[field as keyof UpdateUserProfileInput]

    setDefinedValue(
      values,
      field as keyof NewUserProfileRow,
      value === undefined ? undefined : normalizeOptionalString(value),
    )
  }
}

function setDirectUpdateValues(
  values: Partial<NewUserProfileRow>,
  input: UpdateUserProfileInput,
): void {
  for (const field of directUpdateFields) {
    setDefinedValue(
      values,
      field as keyof NewUserProfileRow,
      input[field as keyof UpdateUserProfileInput],
    )
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
  return normalizeUserProfileHandle(handle)
}

function normalizeUpdatedHandle(value: string | undefined): string | undefined {
  return value === undefined ? undefined : normalizeHandle(value)
}

function normalizeOptionalString(
  value: string | null | undefined,
): string | null {
  return normalizeUserProfileOptionalString(value)
}
