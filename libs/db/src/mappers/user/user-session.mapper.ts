// libs/db/src/mappers/user/user-session.mapper.ts

import {
  UserSessionEntity,
  type UserSessionContract,
  type UserSessionGeoIp,
} from '@aerealith-ai/core'

import type { NewUserSessionRow, UserSessionRow } from '../../schema'

/**
 * Converts a database session row into a core user session entity.
 */
export function toUserSessionEntity(row: UserSessionRow): UserSessionEntity {
  return new UserSessionEntity({
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,

    deviceName: row.deviceName,
    userAgent: row.userAgent,
    ipAddress: row.ipAddress,
    geoIp: row.geoIp,

    lastSeenAt: row.lastSeenAt,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,

    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  })
}

/**
 * Converts a core user session entity into a database insert row.
 */
export function toNewUserSessionRow(
  entity: UserSessionEntity,
): NewUserSessionRow {
  return {
    id: entity.id,
    userId: entity.userId,
    tokenHash: entity.tokenHash,

    deviceName: entity.deviceName,
    userAgent: entity.userAgent,
    ipAddress: entity.ipAddress,
    geoIp: entity.geoIp,

    lastSeenAt: entity.lastSeenAt ?? undefined,
    expiresAt: entity.expiresAt,
    revokedAt: entity.revokedAt,

    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt,
  }
}

/**
 * Converts a session entity into the safe contract returned outside the
 * database layer.
 *
 * Token hashes, user IDs, deleted timestamps, and exact location coordinates
 * are intentionally excluded.
 */
export function toUserSessionContract(
  entity: UserSessionEntity,
): UserSessionContract {
  return {
    id: entity.id,

    deviceName: entity.deviceName,
    userAgent: entity.userAgent,
    ipAddress: entity.ipAddress,
    geoIp: toPublicUserSessionGeoIp(entity.geoIp),

    lastSeenAt: entity.lastSeenAt?.toISOString() ?? null,
    expiresAt: entity.expiresAt.toISOString(),
    revokedAt: entity.revokedAt?.toISOString() ?? null,

    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  }
}

/**
 * Removes precise location coordinates before session data leaves the
 * persistence layer.
 */
export function toPublicUserSessionGeoIp(
  geoIp: UserSessionGeoIp | null,
): Omit<UserSessionGeoIp, 'latitude' | 'longitude'> | null {
  if (!geoIp) {
    return null
  }

  const publicGeoIp = { ...geoIp }

  delete publicGeoIp.latitude
  delete publicGeoIp.longitude

  return publicGeoIp
}
