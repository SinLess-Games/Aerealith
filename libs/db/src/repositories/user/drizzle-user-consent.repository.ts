// libs/db/src/repositories/user/drizzle-user-consent.repository.ts

import { UserConsentType, type UserConsentContract } from '@aerealith-ai/core'
import { desc } from 'drizzle-orm'

import type { DatabaseClient } from '../../client'
import { toUserConsentContract, toUserConsentEntity } from '../../mappers'
import {
  activeUserConsentById,
  activeUserConsentByUserIdAndType,
  activeUserConsentsByUserId,
} from '../../queries'
import { userConsentsTable, type UserConsentRow } from '../../schema'

export type RecordUserConsentInput = {
  userId: string
  type: UserConsentTypeValue
  granted: boolean
  version?: string | null
  occurredAt?: Date
}

type UserConsentTypeValue =
  (typeof UserConsentType)[keyof typeof UserConsentType]

type UserConsentDatabaseRow = Omit<UserConsentRow, 'type'> & {
  type: string
}

/**
 * Persists and retrieves user consent decisions.
 */
export class DrizzleUserConsentRepository {
  public constructor(private readonly database: DatabaseClient) {}

  /**
   * Finds an active consent record by its ID.
   */
  public async findById(id: string): Promise<UserConsentContract | null> {
    const [row] = await this.database
      .select()
      .from(userConsentsTable)
      .where(activeUserConsentById(id))
      .limit(1)

    return row ? toConsentContract(row) : null
  }

  /**
   * Finds an active consent record for a user and consent type.
   */
  public async findByUserIdAndType(
    userId: string,
    type: UserConsentTypeValue,
  ): Promise<UserConsentContract | null> {
    const [row] = await this.database
      .select()
      .from(userConsentsTable)
      .where(activeUserConsentByUserIdAndType(userId, type))
      .limit(1)

    return row ? toConsentContract(row) : null
  }

  /**
   * Returns all active consent records belonging to a user.
   */
  public async findAllByUserId(userId: string): Promise<UserConsentContract[]> {
    const rows = await this.database
      .select()
      .from(userConsentsTable)
      .where(activeUserConsentsByUserId(userId))
      .orderBy(desc(userConsentsTable.updatedAt))

    return rows.map(toConsentContract)
  }

  /**
   * Records a consent decision.
   *
   * A user has one row per consent type. Recording a new decision updates the
   * existing row and restores it when it was previously soft deleted.
   */
  public async record(
    input: RecordUserConsentInput,
  ): Promise<UserConsentContract> {
    const occurredAt = input.occurredAt ?? new Date()
    const version = normalizeOptionalString(input.version)

    const grantedAt = input.granted ? occurredAt : null
    const revokedAt = input.granted ? null : occurredAt

    const [row] = await this.database
      .insert(userConsentsTable)
      .values({
        userId: input.userId,
        type: input.type,
        version,
        grantedAt,
        revokedAt,
      })
      .onConflictDoUpdate({
        target: [userConsentsTable.userId, userConsentsTable.type],
        set: {
          version,
          grantedAt,
          revokedAt,
          deletedAt: null,
          updatedAt: occurredAt,
        },
      })
      .returning()

    if (!row) {
      throw new Error('Failed to record user consent.')
    }

    return toConsentContract(row)
  }

  /**
   * Soft deletes a consent record.
   */
  public async softDelete(id: string): Promise<boolean> {
    const now = new Date()

    const [row] = await this.database
      .update(userConsentsTable)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(activeUserConsentById(id))
      .returning({
        id: userConsentsTable.id,
      })

    return row !== undefined
  }
}

/**
 * Converts a database row into a validated core entity, then into an
 * API-safe contract.
 */
function toConsentContract(row: UserConsentDatabaseRow): UserConsentContract {
  const entity = toUserConsentEntity({
    ...row,
    type: toUserConsentType(row.type),
  })

  return toUserConsentContract(entity)
}

/**
 * Ensures database enum values are valid core consent types.
 */
function toUserConsentType(value: string): UserConsentTypeValue {
  const consentTypes: readonly string[] = Object.values(UserConsentType)

  if (!consentTypes.includes(value)) {
    throw new Error(`Invalid user consent type in database: ${value}`)
  }

  return value as UserConsentTypeValue
}

function normalizeOptionalString(
  value: string | null | undefined,
): string | null {
  const normalizedValue = value?.trim()

  return normalizedValue || null
}
