// libs/db/src/repositories/user/drizzle-user-consent.repository.spec.ts

import { UserConsentType } from '@aerealith-ai/core'
import { describe, expect, it, vi } from 'vitest'

import type { DatabaseClient } from '../../client'
import { type UserConsentRow, userConsentsTable } from '../../schema'
import { DrizzleUserConsentRepository } from './drizzle-user-consent.repository'

type DeletedUserConsentRow = {
  id: string
}

type UserConsentTypeValue =
  (typeof UserConsentType)[keyof typeof UserConsentType]

type UserConsentTestRow = Omit<UserConsentRow, 'type'> & {
  type: UserConsentTypeValue
}

const consentType = Object.values(UserConsentType)[0] as UserConsentTypeValue

function createUserConsentRow(
  overrides: Partial<UserConsentTestRow> = {},
): UserConsentTestRow {
  return {
    id: 'consent_123',
    userId: 'user_123',
    type: consentType,
    version: '2026.06',
    grantedAt: new Date('2026-06-20T00:00:00.000Z'),
    revokedAt: null,
    createdAt: new Date('2026-06-20T00:00:00.000Z'),
    updatedAt: new Date('2026-06-20T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  }
}

function createDatabaseMock({
  selectedRows = [],
  insertedRows = [],
  updatedRows = [],
}: {
  selectedRows?: UserConsentRow[]
  insertedRows?: UserConsentRow[]
  updatedRows?: UserConsentRow[] | DeletedUserConsentRow[]
} = {}) {
  const selectLimit = vi.fn().mockResolvedValue(selectedRows)
  const selectOrderBy = vi.fn()

  const selectResult = {
    limit: selectLimit,
    orderBy: selectOrderBy,
    then<TResult1 = UserConsentRow[], TResult2 = never>(
      onfulfilled?:
        ((value: UserConsentRow[]) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?:
        ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): Promise<TResult1 | TResult2> {
      return Promise.resolve(selectedRows).then(onfulfilled, onrejected)
    },
  }

  selectOrderBy.mockReturnValue(selectResult)

  const selectWhere = vi.fn(() => selectResult)
  const selectFrom = vi.fn(() => ({
    where: selectWhere,
  }))
  const select = vi.fn(() => ({
    from: selectFrom,
  }))

  const insertReturning = vi.fn().mockResolvedValue(insertedRows)
  const insertOnConflictDoUpdate = vi.fn(() => ({
    returning: insertReturning,
  }))
  const insertValues = vi.fn(() => ({
    onConflictDoUpdate: insertOnConflictDoUpdate,
  }))
  const insert = vi.fn(() => ({
    values: insertValues,
  }))

  const updateReturning = vi.fn().mockResolvedValue(updatedRows)
  const updateWhere = vi.fn(() => ({
    returning: updateReturning,
  }))
  const updateSet = vi.fn(() => ({
    where: updateWhere,
  }))
  const update = vi.fn(() => ({
    set: updateSet,
  }))

  const database = {
    select,
    insert,
    update,
  } as unknown as DatabaseClient

  return {
    database,
    select,
    selectFrom,
    selectWhere,
    selectLimit,
    selectOrderBy,
    insert,
    insertValues,
    insertOnConflictDoUpdate,
    insertReturning,
    update,
    updateSet,
    updateWhere,
    updateReturning,
  }
}

describe('DrizzleUserConsentRepository', () => {
  it('finds an active consent record by ID', async () => {
    const row = createUserConsentRow()
    const databaseMock = createDatabaseMock({
      selectedRows: [row],
    })

    const repository = new DrizzleUserConsentRepository(databaseMock.database)

    const result = await repository.findById(row.id)

    expect(result).toEqual({
      id: row.id,
      userId: row.userId,
      type: row.type,
      version: row.version,
      grantedAt: row.grantedAt?.toISOString() ?? null,
      revokedAt: row.revokedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })

    expect(databaseMock.select).toHaveBeenCalledOnce()
    expect(databaseMock.selectFrom).toHaveBeenCalledWith(userConsentsTable)
    expect(databaseMock.selectLimit).toHaveBeenCalledWith(1)
  })

  it('returns null when the consent record does not exist', async () => {
    const databaseMock = createDatabaseMock()

    const repository = new DrizzleUserConsentRepository(databaseMock.database)

    const result = await repository.findById('missing_consent')

    expect(result).toBeNull()
  })

  it('finds an active consent record by user and type', async () => {
    const row = createUserConsentRow()
    const databaseMock = createDatabaseMock({
      selectedRows: [row],
    })

    const repository = new DrizzleUserConsentRepository(databaseMock.database)

    const result = await repository.findByUserIdAndType(row.userId, row.type)

    expect(result).toEqual({
      id: row.id,
      userId: row.userId,
      type: row.type,
      version: row.version,
      grantedAt: row.grantedAt?.toISOString() ?? null,
      revokedAt: row.revokedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })

    expect(databaseMock.selectLimit).toHaveBeenCalledWith(1)
  })

  it('returns every active consent record for a user', async () => {
    const firstRow = createUserConsentRow()
    const secondRow = createUserConsentRow({
      id: 'consent_456',
      grantedAt: null,
      revokedAt: new Date('2026-06-21T00:00:00.000Z'),
    })

    const databaseMock = createDatabaseMock({
      selectedRows: [firstRow, secondRow],
    })

    const repository = new DrizzleUserConsentRepository(databaseMock.database)

    const result = await repository.findAllByUserId('user_123')

    expect(result).toEqual([
      {
        id: firstRow.id,
        userId: firstRow.userId,
        type: firstRow.type,
        version: firstRow.version,
        grantedAt: firstRow.grantedAt?.toISOString() ?? null,
        revokedAt: firstRow.revokedAt?.toISOString() ?? null,
        createdAt: firstRow.createdAt.toISOString(),
        updatedAt: firstRow.updatedAt.toISOString(),
      },
      {
        id: secondRow.id,
        userId: secondRow.userId,
        type: secondRow.type,
        version: secondRow.version,
        grantedAt: secondRow.grantedAt?.toISOString() ?? null,
        revokedAt: secondRow.revokedAt?.toISOString() ?? null,
        createdAt: secondRow.createdAt.toISOString(),
        updatedAt: secondRow.updatedAt.toISOString(),
      },
    ])
  })

  it('records and returns a granted consent decision', async () => {
    const occurredAt = new Date('2026-06-20T12:00:00.000Z')
    const row = createUserConsentRow({
      grantedAt: occurredAt,
    })

    const databaseMock = createDatabaseMock({
      insertedRows: [row],
    })

    const repository = new DrizzleUserConsentRepository(databaseMock.database)

    const result = await repository.record({
      userId: 'user_123',
      type: consentType,
      version: ' 2026.06 ',
      granted: true,
      occurredAt,
    })

    expect(result).toEqual({
      id: row.id,
      userId: row.userId,
      type: row.type,
      version: row.version,
      grantedAt: occurredAt.toISOString(),
      revokedAt: null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })

    expect(databaseMock.insert).toHaveBeenCalledWith(userConsentsTable)

    expect(databaseMock.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_123',
        type: consentType,
        version: '2026.06',
        grantedAt: occurredAt,
        revokedAt: null,
      }),
    )

    expect(databaseMock.insertOnConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        target: [userConsentsTable.userId, userConsentsTable.type],
        set: expect.objectContaining({
          version: '2026.06',
          grantedAt: occurredAt,
          revokedAt: null,
          deletedAt: null,
          updatedAt: occurredAt,
        }),
      }),
    )
  })

  it('records a revoked consent decision', async () => {
    const occurredAt = new Date('2026-06-21T12:00:00.000Z')
    const row = createUserConsentRow({
      grantedAt: null,
      revokedAt: occurredAt,
    })

    const databaseMock = createDatabaseMock({
      insertedRows: [row],
    })

    const repository = new DrizzleUserConsentRepository(databaseMock.database)

    const result = await repository.record({
      userId: 'user_123',
      type: consentType,
      granted: false,
      occurredAt,
    })

    expect(result.grantedAt).toBeNull()
    expect(result.revokedAt).toBe(occurredAt.toISOString())

    expect(databaseMock.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        grantedAt: null,
        revokedAt: occurredAt,
      }),
    )
  })

  it('throws when recording a consent decision does not return a row', async () => {
    const databaseMock = createDatabaseMock()

    const repository = new DrizzleUserConsentRepository(databaseMock.database)

    await expect(
      repository.record({
        userId: 'user_123',
        type: consentType,
        granted: true,
      }),
    ).rejects.toThrow()
  })

  it('soft deletes an existing consent record', async () => {
    const databaseMock = createDatabaseMock({
      updatedRows: [
        {
          id: 'consent_123',
        },
      ],
    })

    const repository = new DrizzleUserConsentRepository(databaseMock.database)

    const result = await repository.softDelete('consent_123')

    expect(result).toBe(true)
    expect(databaseMock.update).toHaveBeenCalledWith(userConsentsTable)

    expect(databaseMock.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        deletedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    )
  })

  it('returns false when there is no consent record to soft delete', async () => {
    const databaseMock = createDatabaseMock()

    const repository = new DrizzleUserConsentRepository(databaseMock.database)

    const result = await repository.softDelete('missing_consent')

    expect(result).toBe(false)
  })
})
