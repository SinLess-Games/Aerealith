// libs/db/src/repositories/user/drizzle-user-settings.repository.ts

import { and, eq, isNull } from 'drizzle-orm'

import {
  UserSettingsEntity,
  type UserSettingsContract,
  type UserSettingsInput,
  type UserSettingsUpdate,
} from '@aerealith-ai/core'

import type { DatabaseClient } from '../../client'
import {
  userSettingsTable,
  type NewUserSettingsRow,
  type UserSettingsRow,
} from '../../schema'

export type CreateUserSettingsInput = Omit<
  UserSettingsInput,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
>

export type UpdateUserSettingsInput = UserSettingsUpdate

/**
 * Drizzle persistence for user application settings.
 *
 * Core owns settings defaults and merge behavior through UserSettingsEntity.
 * This repository only persists the completed settings state.
 */
export class DrizzleUserSettingsRepository {
  constructor(private readonly database: DatabaseClient) {}

  async findByUserId(userId: string): Promise<UserSettingsContract | null> {
    const [row] = await this.database
      .select()
      .from(userSettingsTable)
      .where(
        and(
          eq(userSettingsTable.userId, userId),
          isNull(userSettingsTable.deletedAt),
        ),
      )
      .limit(1)

    return row ? toUserSettingsContract(row) : null
  }

  async create(input: CreateUserSettingsInput): Promise<UserSettingsContract> {
    const entity = new UserSettingsEntity(input)

    const [row] = await this.database
      .insert(userSettingsTable)
      .values(toNewUserSettingsRow(entity))
      .returning()

    if (!row) {
      throw new Error('Failed to create user settings.')
    }

    return toUserSettingsContract(row)
  }

  async update(
    userId: string,
    input: UpdateUserSettingsInput,
  ): Promise<UserSettingsContract | null> {
    const existingRow = await this.findRowByUserId(userId)

    if (!existingRow) {
      return null
    }

    const entity = toUserSettingsEntity(existingRow)
    entity.update(input)

    const [row] = await this.database
      .update(userSettingsTable)
      .set({
        accessibility: entity.accessibility,
        appearance: entity.appearance,
        communication: entity.communication,
        notifications: entity.notifications,
        privacy: entity.privacy,
        security: entity.security,
        updatedAt: entity.updatedAt,
      })
      .where(
        and(
          eq(userSettingsTable.userId, userId),
          isNull(userSettingsTable.deletedAt),
        ),
      )
      .returning()

    return row ? toUserSettingsContract(row) : null
  }

  async softDeleteByUserId(userId: string): Promise<boolean> {
    const now = new Date()

    const [row] = await this.database
      .update(userSettingsTable)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(userSettingsTable.userId, userId),
          isNull(userSettingsTable.deletedAt),
        ),
      )
      .returning({
        id: userSettingsTable.id,
      })

    return row !== undefined
  }

  private async findRowByUserId(
    userId: string,
  ): Promise<UserSettingsRow | null> {
    const [row] = await this.database
      .select()
      .from(userSettingsTable)
      .where(
        and(
          eq(userSettingsTable.userId, userId),
          isNull(userSettingsTable.deletedAt),
        ),
      )
      .limit(1)

    return row ?? null
  }
}

function toNewUserSettingsRow(entity: UserSettingsEntity): NewUserSettingsRow {
  return {
    userId: entity.userId,
    metadata: entity.metadata,
    accessibility: entity.accessibility,
    appearance: entity.appearance,
    communication: entity.communication,
    notifications: entity.notifications,
    privacy: entity.privacy,
    security: entity.security,
  }
}

function toUserSettingsEntity(row: UserSettingsRow): UserSettingsEntity {
  return new UserSettingsEntity({
    id: row.id,
    userId: row.userId,
    metadata: row.metadata,
    accessibility: row.accessibility,
    appearance: row.appearance,
    communication: row.communication,
    notifications: row.notifications,
    privacy: row.privacy,
    security: row.security,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  })
}

function toUserSettingsContract(row: UserSettingsRow): UserSettingsContract {
  return {
    id: row.id,
    userId: row.userId,
    metadata: row.metadata,
    accessibility: row.accessibility,
    appearance: row.appearance,
    communication: row.communication,
    notifications: row.notifications,
    privacy: row.privacy,
    security: row.security,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
