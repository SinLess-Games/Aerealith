// libs/db/src/repositories/user/drizzle-user-account.repository.spec.ts

import type { UserAccountStatus } from '@aerealith-ai/core'
import { describe, expect, it, vi } from 'vitest'

import type { DatabaseClient } from '../../client'
import { type UserAccountRow, userAccountsTable } from '../../schema'
import { DrizzleUserAccountRepository } from './drizzle-user-account.repository'

type DeletedUserAccountRow = {
  id: string
}

function createUserAccountRow(
  overrides: Partial<UserAccountRow> = {},
): UserAccountRow {
  return {
    id: 'account_123',
    userId: 'user_123',
    provider: 'github',
    accountId: 'github_123',
    displayName: 'Octocat',
    managementUrl: 'https://github.com/settings/apps',
    status: 'active' as UserAccountStatus,
    connectedAt: new Date('2026-06-20T00:00:00.000Z'),
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
  selectedRows?: UserAccountRow[]
  insertedRows?: UserAccountRow[]
  updatedRows?: UserAccountRow[] | DeletedUserAccountRow[]
} = {}) {
  const selectLimit = vi.fn().mockResolvedValue(selectedRows)
  const selectOrderBy = vi.fn()

  const selectResult = {
    limit: selectLimit,
    orderBy: selectOrderBy,
    then<TResult1 = UserAccountRow[], TResult2 = never>(
      onfulfilled?:
        | ((value: UserAccountRow[]) => TResult1 | PromiseLike<TResult1>)
        | null,
      onrejected?:
        | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
        | null,
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
    selectOrderBy,
    insert,
    insertValues,
    insertReturning,
    update,
    updateSet,
    updateWhere,
    updateReturning,
  }
}

describe('DrizzleUserAccountRepository', () => {
  it('finds an active account by ID', async () => {
    const row = createUserAccountRow()
    const databaseMock = createDatabaseMock({
      selectedRows: [row],
    })

    const repository = new DrizzleUserAccountRepository(databaseMock.database)

    const result = await repository.findById(row.id)

    expect(result).toEqual({
      id: row.id,
      provider: row.provider,
      displayName: row.displayName,
      managementUrl: row.managementUrl,
      status: row.status,
      connectedAt: row.connectedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })

    expect(databaseMock.select).toHaveBeenCalledOnce()
    expect(databaseMock.selectFrom).toHaveBeenCalledWith(userAccountsTable)
    expect(databaseMock.selectLimit).toHaveBeenCalledWith(1)
  })

  it('returns null when an account does not exist', async () => {
    const databaseMock = createDatabaseMock()

    const repository = new DrizzleUserAccountRepository(databaseMock.database)

    const result = await repository.findById('missing_account')

    expect(result).toBeNull()
  })

  it('finds an active account by provider and provider account ID', async () => {
    const row = createUserAccountRow()
    const databaseMock = createDatabaseMock({
      selectedRows: [row],
    })

    const repository = new DrizzleUserAccountRepository(databaseMock.database)

    const result = await repository.findByProviderAccount(
      '  GITHUB  ',
      '  github_123  ',
    )

    expect(result).toEqual({
      id: row.id,
      provider: row.provider,
      displayName: row.displayName,
      managementUrl: row.managementUrl,
      status: row.status,
      connectedAt: row.connectedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })

    expect(databaseMock.selectLimit).toHaveBeenCalledWith(1)
  })

  it('returns every active account for a user', async () => {
    const firstRow = createUserAccountRow()
    const secondRow = createUserAccountRow({
      id: 'account_456',
      provider: 'discord',
      accountId: 'discord_456',
      displayName: 'Discord User',
      managementUrl: null,
    })

    const databaseMock = createDatabaseMock({
      selectedRows: [firstRow, secondRow],
    })

    const repository = new DrizzleUserAccountRepository(databaseMock.database)

    const result = await repository.findAllByUserId('user_123')

    expect(result).toEqual([
      {
        id: firstRow.id,
        provider: firstRow.provider,
        displayName: firstRow.displayName,
        managementUrl: firstRow.managementUrl,
        status: firstRow.status,
        connectedAt: firstRow.connectedAt.toISOString(),
        createdAt: firstRow.createdAt.toISOString(),
        updatedAt: firstRow.updatedAt.toISOString(),
      },
      {
        id: secondRow.id,
        provider: secondRow.provider,
        displayName: secondRow.displayName,
        managementUrl: secondRow.managementUrl,
        status: secondRow.status,
        connectedAt: secondRow.connectedAt.toISOString(),
        createdAt: secondRow.createdAt.toISOString(),
        updatedAt: secondRow.updatedAt.toISOString(),
      },
    ])
  })

  it('creates and returns a user account', async () => {
    const row = createUserAccountRow()
    const databaseMock = createDatabaseMock({
      insertedRows: [row],
    })

    const repository = new DrizzleUserAccountRepository(databaseMock.database)

    const result = await repository.create({
      userId: 'user_123',
      provider: '  GITHUB  ',
      accountId: '  github_123  ',
      displayName: '  Octocat  ',
      managementUrl: '  https://github.com/settings/apps  ',
      status: 'active',
    })

    expect(result).toEqual({
      id: row.id,
      provider: row.provider,
      displayName: row.displayName,
      managementUrl: row.managementUrl,
      status: row.status,
      connectedAt: row.connectedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })

    expect(databaseMock.insert).toHaveBeenCalledWith(userAccountsTable)
    expect(databaseMock.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_123',
        provider: 'github',
        accountId: 'github_123',
        displayName: 'Octocat',
        managementUrl: 'https://github.com/settings/apps',
        status: 'active',
      }),
    )
  })

  it('throws when creating an account does not return a row', async () => {
    const databaseMock = createDatabaseMock()

    const repository = new DrizzleUserAccountRepository(databaseMock.database)

    await expect(
      repository.create({
        userId: 'user_123',
        provider: 'github',
        accountId: 'github_123',
        displayName: 'Octocat',
      }),
    ).rejects.toThrow()
  })

  it('updates and returns a user account', async () => {
    const row = createUserAccountRow({
      displayName: 'Updated Octocat',
      managementUrl: null,
      status: 'suspended' as UserAccountStatus,
      updatedAt: new Date('2026-06-21T00:00:00.000Z'),
    })

    const databaseMock = createDatabaseMock({
      updatedRows: [row],
    })

    const repository = new DrizzleUserAccountRepository(databaseMock.database)

    const result = await repository.update(row.id, {
      displayName: '  Updated Octocat  ',
      managementUrl: null,
      status: 'suspended',
    })

    expect(result).toEqual({
      id: row.id,
      provider: row.provider,
      displayName: row.displayName,
      managementUrl: row.managementUrl,
      status: row.status,
      connectedAt: row.connectedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })

    expect(databaseMock.update).toHaveBeenCalledWith(userAccountsTable)
    expect(databaseMock.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Updated Octocat',
        managementUrl: null,
        status: 'suspended',
        updatedAt: expect.any(Date),
      }),
    )
  })

  it('returns null when updating an account that does not exist', async () => {
    const databaseMock = createDatabaseMock()

    const repository = new DrizzleUserAccountRepository(databaseMock.database)

    const result = await repository.update('missing_account', {
      displayName: 'Updated Octocat',
    })

    expect(result).toBeNull()
  })

  it('soft deletes an existing user account', async () => {
    const databaseMock = createDatabaseMock({
      updatedRows: [
        {
          id: 'account_123',
        },
      ],
    })

    const repository = new DrizzleUserAccountRepository(databaseMock.database)

    const result = await repository.softDelete('account_123')

    expect(result).toBe(true)
    expect(databaseMock.update).toHaveBeenCalledWith(userAccountsTable)

    expect(databaseMock.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        deletedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    )
  })

  it('returns false when there is no user account to soft delete', async () => {
    const databaseMock = createDatabaseMock()

    const repository = new DrizzleUserAccountRepository(databaseMock.database)

    const result = await repository.softDelete('missing_account')

    expect(result).toBe(false)
  })
})
