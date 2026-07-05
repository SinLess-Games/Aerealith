// libs/db/src/mappers/user/user-account.mapper.ts

import { UserAccountEntity, type UserAccountContract } from '@aerealith-ai/core'

import type { NewUserAccountRow, UserAccountRow } from '../../schema'

/**
 * Converts a database user-account row into the core entity.
 */
export function toUserAccountEntity(row: UserAccountRow): UserAccountEntity {
  return new UserAccountEntity({
    id: row.id,
    userId: row.userId,
    provider: row.provider,
    accountId: row.accountId,
    displayName: row.displayName,
    managementUrl: row.managementUrl,
    status: row.status,
    connectedAt: row.connectedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  })
}

/**
 * Converts a core user-account entity into an API-safe contract.
 *
 * Provider account IDs and internal user IDs are intentionally omitted.
 */
export function toUserAccountContract(
  entity: UserAccountEntity,
): UserAccountContract {
  return {
    id: entity.id,
    provider: entity.provider,
    displayName: entity.displayName,
    managementUrl: entity.managementUrl,
    status: entity.status,
    connectedAt: entity.connectedAt.toISOString(),
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  }
}

/**
 * Converts a core user-account entity into a database insert row.
 *
 * The database generates the record ID and timestamps.
 */
export function toNewUserAccountRow(
  entity: UserAccountEntity,
): NewUserAccountRow {
  return {
    userId: entity.userId,
    provider: entity.provider,
    accountId: entity.accountId,
    displayName: entity.displayName,
    managementUrl: entity.managementUrl,
    status: entity.status,
    connectedAt: entity.connectedAt,
  }
}
