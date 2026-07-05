// libs/db/src/repositories/user/drizzle-user-session.repository.ts

import {
  type UserSessionContract,
  type UserSessionGeoIp,
} from '@aerealith-ai/core'
import { and, desc, eq, isNull, ne } from 'drizzle-orm'

import type { DatabaseClient } from '../../client'
import { toUserSessionContract, toUserSessionEntity } from '../../mappers'
import {
  activeUserSessionById,
  activeUserSessionByTokenHash,
  activeUserSessionsByUserId,
  userSessionHistoryByUserId,
} from '../../queries'
import { type UserSessionRow, userSessionsTable } from '../../schema'

export type CreateUserSessionInput = {
  userId: string
  tokenHash: string
  expiresAt: Date
  deviceName?: string | null
  userAgent?: string | null
  ipAddress?: string | null
  geoIp?: UserSessionGeoIp | null
  lastSeenAt?: Date | null
}

export type UpdateUserSessionActivityInput = {
  lastSeenAt?: Date
}

/**
 * Persists and retrieves authenticated user sessions.
 */
export class DrizzleUserSessionRepository {
  public constructor(private readonly database: DatabaseClient) {}

  /**
   * Finds one active session by its ID.
   */
  public async findById(id: string): Promise<UserSessionContract | null> {
    const [row] = await this.database
      .select()
      .from(userSessionsTable)
      .where(activeUserSessionById(id))
      .limit(1)

    return row ? mapUserSessionRowToContract(row) : null
  }

  /**
   * Finds one active session by its token hash.
   */
  public async findByTokenHash(
    tokenHash: string,
  ): Promise<UserSessionContract | null> {
    const [row] = await this.database
      .select()
      .from(userSessionsTable)
      .where(activeUserSessionByTokenHash(tokenHash))
      .limit(1)

    return row ? mapUserSessionRowToContract(row) : null
  }

  /**
   * Returns all active sessions belonging to a user.
   */
  public async findAllByUserId(userId: string): Promise<UserSessionContract[]> {
    const rows = await this.database
      .select()
      .from(userSessionsTable)
      .where(activeUserSessionsByUserId(userId))
      .orderBy(desc(userSessionsTable.lastSeenAt))

    return rows.map(mapUserSessionRowToContract)
  }

  /**
   * Returns non-deleted session history for a user.
   *
   * Revoked and expired sessions are retained for account-security history.
   */
  public async findHistoryByUserId(
    userId: string,
  ): Promise<UserSessionContract[]> {
    const rows = await this.database
      .select()
      .from(userSessionsTable)
      .where(userSessionHistoryByUserId(userId))
      .orderBy(desc(userSessionsTable.createdAt))

    return rows.map(mapUserSessionRowToContract)
  }

  /**
   * Creates and returns a user session.
   */
  public async create(
    input: CreateUserSessionInput,
  ): Promise<UserSessionContract> {
    const [row] = await this.database
      .insert(userSessionsTable)
      .values({
        userId: input.userId,
        tokenHash: input.tokenHash,
        deviceName: input.deviceName ?? null,
        userAgent: input.userAgent ?? null,
        ipAddress: input.ipAddress ?? null,
        geoIp: input.geoIp ?? null,
        lastSeenAt: input.lastSeenAt ?? undefined,
        expiresAt: input.expiresAt,
      })
      .returning()

    if (!row) {
      throw new Error('Failed to create user session.')
    }

    return mapUserSessionRowToContract(row)
  }

  /**
   * Updates activity information for one active session.
   */
  public async updateActivity(
    id: string,
    input: UpdateUserSessionActivityInput = {},
  ): Promise<UserSessionContract | null> {
    const lastSeenAt = input.lastSeenAt ?? new Date()

    const [row] = await this.database
      .update(userSessionsTable)
      .set({
        lastSeenAt,
        updatedAt: lastSeenAt,
      })
      .where(activeUserSessionById(id, lastSeenAt))
      .returning()

    return row ? mapUserSessionRowToContract(row) : null
  }

  /**
   * Revokes one active session while retaining it for security history.
   */
  public async revoke(id: string): Promise<boolean> {
    const now = new Date()

    const [row] = await this.database
      .update(userSessionsTable)
      .set({
        revokedAt: now,
        updatedAt: now,
      })
      .where(activeUserSessionById(id, now))
      .returning({
        id: userSessionsTable.id,
      })

    return row !== undefined
  }

  /**
   * Revokes all active sessions for a user.
   *
   * A current session can be excluded during actions such as changing a
   * password or reviewing other signed-in devices.
   */
  public async revokeAllByUserId(
    userId: string,
    exceptSessionId?: string,
  ): Promise<number> {
    const now = new Date()

    const conditions = [
      eq(userSessionsTable.userId, userId),
      isNull(userSessionsTable.deletedAt),
      isNull(userSessionsTable.revokedAt),
    ]

    if (exceptSessionId) {
      conditions.push(ne(userSessionsTable.id, exceptSessionId))
    }

    const rows = await this.database
      .update(userSessionsTable)
      .set({
        revokedAt: now,
        updatedAt: now,
      })
      .where(and(...conditions))
      .returning({
        id: userSessionsTable.id,
      })

    return rows.length
  }
}

/**
 * Converts a database row into a core entity and then a safe API contract.
 *
 * The shared mapper removes token hashes and exact GeoIP coordinates.
 */
function mapUserSessionRowToContract(row: UserSessionRow): UserSessionContract {
  return toUserSessionContract(toUserSessionEntity(row))
}
