// libs/db/src/mappers/user/user-consent.mapper.ts

import {
  UserConsentEntity,
  UserConsentType,
  type UserConsentContract,
} from '@aerealith-ai/core'

import type { NewUserConsentRow, UserConsentRow } from '../../schema'

/**
 * Converts a database user-consent row into the core entity.
 */
export function toUserConsentEntity(row: UserConsentRow): UserConsentEntity {
  return new UserConsentEntity({
    id: row.id,
    userId: row.userId,
    type: toUserConsentType(row.type),
    version: row.version,
    grantedAt: row.grantedAt,
    revokedAt: row.revokedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  })
}

/**
 * Converts a core user-consent entity into an API-safe contract.
 */
export function toUserConsentContract(
  entity: UserConsentEntity,
): UserConsentContract {
  return {
    id: entity.id,
    userId: entity.userId,
    type: entity.type,
    version: entity.version,
    grantedAt: entity.grantedAt?.toISOString() ?? null,
    revokedAt: entity.revokedAt?.toISOString() ?? null,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  }
}

/**
 * Converts a core user-consent entity into a database insert row.
 *
 * The database generates the record ID and timestamps.
 */
export function toNewUserConsentRow(
  entity: UserConsentEntity,
): NewUserConsentRow {
  return {
    userId: entity.userId,
    type: entity.type,
    version: entity.version,
    grantedAt: entity.grantedAt,
    revokedAt: entity.revokedAt,
  }
}

function toUserConsentType(
  value: string,
): (typeof UserConsentType)[keyof typeof UserConsentType] {
  const consentTypes = Object.values(UserConsentType)

  if (consentTypes.includes(value as never)) {
    return value as (typeof UserConsentType)[keyof typeof UserConsentType]
  }

  throw new Error(`Invalid user consent type in database: ${value}`)
}
