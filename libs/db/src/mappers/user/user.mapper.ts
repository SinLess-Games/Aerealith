// libs/db/src/mappers/user/user.mapper.ts

import {
  UserEntity,
  UserLifecycleStatus,
  UserRole,
  UserTier,
  type UserContract,
} from '@aerealith-ai/core'

import type { NewUserRow, UserRow } from '../../schema'

/**
 * Converts a database user row into the core user entity.
 *
 * Database enum values are validated before becoming core values.
 */
export function toUserEntity(row: UserRow): UserEntity {
  return new UserEntity({
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.passwordHash,

    status: toEnumValue(
      'user lifecycle status',
      UserLifecycleStatus,
      row.status,
    ),

    emailVerified: row.emailVerified,
    emailVerifiedAt: row.emailVerifiedAt,

    role: toEnumValue('user role', UserRole, row.role),
    tier: toEnumValue('user tier', UserTier, row.tier),

    metadata: row.metadata,

    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  })
}

/**
 * Converts a core user entity into an API-safe user contract.
 *
 * Password hashes and internal metadata are intentionally omitted.
 */
export function toUserContract(entity: UserEntity): UserContract {
  return {
    id: entity.id,
    username: entity.username,
    email: entity.email,
    emailVerified: entity.emailVerified,
    status: entity.status,
    role: entity.role,
    tier: entity.tier,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  }
}

/**
 * Converts a core user entity into a database insert row.
 *
 * The database generates the record ID and timestamps.
 */
export function toNewUserRow(entity: UserEntity): NewUserRow {
  return {
    username: entity.username,
    email: entity.email,
    passwordHash: entity.passwordHash,

    status: entity.status,

    emailVerified: entity.emailVerified,
    emailVerifiedAt: entity.emailVerifiedAt,

    role: entity.role,
    tier: entity.tier,

    metadata: entity.metadata,
  }
}

function toEnumValue<TEnum extends Record<string, string>>(
  label: string,
  enumObject: TEnum,
  value: string,
): TEnum[keyof TEnum] {
  const values = Object.values(enumObject) as string[]

  if (!values.includes(value)) {
    throw new Error(`Invalid ${label} in database: ${value}`)
  }

  return value as TEnum[keyof TEnum]
}
