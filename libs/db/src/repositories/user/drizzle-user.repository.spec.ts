// libs/db/src/repositories/user/drizzle-user.repository.spec.ts

import {
  DefaultUserRole,
  DefaultUserTier,
  UserLifecycleStatus,
} from '@aerealith-ai/core'
import { describe, expect, it, vi } from 'vitest'

import type { DatabaseClient } from '../../client'
import { type UserRow, usersTable } from '../../schema'
import { DrizzleUserRepository } from './drizzle-user.repository'

type DeletedUserRow = {
  id: string
}

function createUserRow(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: 'user_123',
    username: 'sinless777',
    email: 'andy@example.com',
    passwordHash: 'hashed-password',

    status: UserLifecycleStatus.Active as UserRow['status'],

    emailVerified: false,
    emailVerifiedAt: null,

    role: DefaultUserRole as UserRow['role'],
    tier: DefaultUserTier as UserRow['tier'],

    metadata: {} as UserRow['metadata'],

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
  selectedRows?: UserRow[]
  insertedRows?: UserRow[]
  updatedRows?: UserRow[] | DeletedUserRow[]
} = {}) {
  const selectLimit = vi.fn().mockResolvedValue(selectedRows)

  const selectResult = {
    limit: selectLimit,
  }

  const selectWhere = vi.fn(() => selectResult)
  const selectFrom = vi.fn(() => ({
    where: selectWhere,
  }))
  const select = vi.fn(() => ({
    from: selectFrom,
  }))

  const insertReturning = vi.fn().mockResolvedValue(insertedRows)
  const insertValues = vi.fn(() => ({
    returning: insertReturning,
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
    insert,
    insertValues,
    insertReturning,
    update,
    updateSet,
    updateWhere,
    updateReturning,
  }
}

function toExpectedContract(row: UserRow) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    emailVerified: row.emailVerified,
    status: row.status,
    role: row.role,
    tier: row.tier,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

describe('DrizzleUserRepository', () => {
  it('finds an active user by ID', async () => {
    const row = createUserRow()
    const databaseMock = createDatabaseMock({
      selectedRows: [row],
    })

    const repository = new DrizzleUserRepository(databaseMock.database)

    const result = await repository.findById(row.id)

    expect(result).toEqual(toExpectedContract(row))

    expect(databaseMock.select).toHaveBeenCalledOnce()
    expect(databaseMock.selectFrom).toHaveBeenCalledWith(usersTable)
    expect(databaseMock.selectLimit).toHaveBeenCalledWith(1)
  })

  it('returns null when an active user does not exist by ID', async () => {
    const databaseMock = createDatabaseMock()

    const repository = new DrizzleUserRepository(databaseMock.database)

    const result = await repository.findById('missing_user')

    expect(result).toBeNull()
  })

  it('finds an active user by username', async () => {
    const row = createUserRow()
    const databaseMock = createDatabaseMock({
      selectedRows: [row],
    })

    const repository = new DrizzleUserRepository(databaseMock.database)

    const result = await repository.findByUsername('  SINLESS777  ')

    expect(result).toEqual(toExpectedContract(row))
    expect(databaseMock.selectLimit).toHaveBeenCalledWith(1)
  })

  it('returns null when an active user does not exist by username', async () => {
    const databaseMock = createDatabaseMock()

    const repository = new DrizzleUserRepository(databaseMock.database)

    const result = await repository.findByUsername('missing_user')

    expect(result).toBeNull()
  })

  it('finds an active user by email address', async () => {
    const row = createUserRow()
    const databaseMock = createDatabaseMock({
      selectedRows: [row],
    })

    const repository = new DrizzleUserRepository(databaseMock.database)

    const result = await repository.findByEmail('  ANDY@EXAMPLE.COM  ')

    expect(result).toEqual(toExpectedContract(row))
    expect(databaseMock.selectLimit).toHaveBeenCalledWith(1)
  })

  it('returns null when an active user does not exist by email address', async () => {
    const databaseMock = createDatabaseMock()

    const repository = new DrizzleUserRepository(databaseMock.database)

    const result = await repository.findByEmail('missing@example.com')

    expect(result).toBeNull()
  })

  it('creates and returns a user', async () => {
    const row = createUserRow()
    const databaseMock = createDatabaseMock({
      insertedRows: [row],
    })

    const repository = new DrizzleUserRepository(databaseMock.database)

    const result = await repository.create({
      username: '  Sinless777  ',
      email: '  ANDY@EXAMPLE.COM  ',
      passwordHash: row.passwordHash,
    })

    expect(result).toEqual(toExpectedContract(row))

    expect(databaseMock.insert).toHaveBeenCalledWith(usersTable)

    expect(databaseMock.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'sinless777',
        email: 'andy@example.com',
        passwordHash: row.passwordHash,
      }),
    )
  })

  it('throws when creating a user does not return a row', async () => {
    const databaseMock = createDatabaseMock()

    const repository = new DrizzleUserRepository(databaseMock.database)

    await expect(
      repository.create({
        username: 'sinless777',
        email: 'andy@example.com',
        passwordHash: 'hashed-password',
      }),
    ).rejects.toThrow()
  })

  it('updates and returns a user', async () => {
    const row = createUserRow({
      username: 'updated_user',
      email: 'updated@example.com',
      updatedAt: new Date('2026-06-21T00:00:00.000Z'),
    })

    const databaseMock = createDatabaseMock({
      updatedRows: [row],
    })

    const repository = new DrizzleUserRepository(databaseMock.database)

    const result = await repository.update(row.id, {
      username: '  Updated_User  ',
      email: '  UPDATED@EXAMPLE.COM  ',
    })

    expect(result).toEqual(toExpectedContract(row))

    expect(databaseMock.update).toHaveBeenCalledWith(usersTable)

    expect(databaseMock.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'updated_user',
        email: 'updated@example.com',
        updatedAt: expect.any(Date),
      }),
    )
  })

  it('returns null when updating a user that does not exist', async () => {
    const databaseMock = createDatabaseMock()

    const repository = new DrizzleUserRepository(databaseMock.database)

    const result = await repository.update('missing_user', {
      username: 'updated_user',
    })

    expect(result).toBeNull()
  })

  it('soft deletes an existing user', async () => {
    const databaseMock = createDatabaseMock({
      updatedRows: [
        {
          id: 'user_123',
        },
      ],
    })

    const repository = new DrizzleUserRepository(databaseMock.database)

    const result = await repository.softDelete('user_123')

    expect(result).toBe(true)
    expect(databaseMock.update).toHaveBeenCalledWith(usersTable)

    expect(databaseMock.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        deletedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    )
  })

  it('returns false when there is no user to soft delete', async () => {
    const databaseMock = createDatabaseMock()

    const repository = new DrizzleUserRepository(databaseMock.database)

    const result = await repository.softDelete('missing_user')

    expect(result).toBe(false)
  })
})
