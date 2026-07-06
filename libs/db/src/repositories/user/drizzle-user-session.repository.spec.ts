// libs/db/src/repositories/user/drizzle-user-session.repository.spec.ts

import { describe, expect, it, vi } from 'vitest'

import type { DatabaseClient } from '../../client'
import { type UserSessionRow, userSessionsTable } from '../../schema'
import { DrizzleUserSessionRepository } from './drizzle-user-session.repository'

function createUserSessionRow(
  overrides: Partial<UserSessionRow> = {},
): UserSessionRow {
  return {
    id: 'session_123',
    userId: 'user_123',
    tokenHash: 'hashed-session-token',

    deviceName: 'Firefox on Ubuntu',
    userAgent: 'Mozilla/5.0',
    ipAddress: '192.168.0.10',
    geoIp: {
      country: 'US',
      region: 'Idaho',
      city: 'Twin Falls',
      latitude: 42.5558,
      longitude: -114.4701,
    } as UserSessionRow['geoIp'],

    lastSeenAt: new Date('2026-06-20T00:00:00.000Z'),
    expiresAt: new Date('2026-06-27T00:00:00.000Z'),
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
  selectedRows?: UserSessionRow[]
  insertedRows?: UserSessionRow[]
  updatedRows?: UserSessionRow[] | Array<{ id: string }>
} = {}) {
  const selectLimit = vi.fn().mockResolvedValue(selectedRows)
  const selectOrderBy = vi.fn()

  const selectResult = {
    limit: selectLimit,
    orderBy: selectOrderBy,
    then<TResult1 = UserSessionRow[], TResult2 = never>(
      onfulfilled?:
        ((value: UserSessionRow[]) => TResult1 | PromiseLike<TResult1>) | null,
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
  const insertValues = vi.fn(() => ({
    returning: insertReturning,
  }))
  const insert = vi.fn(() => ({
    values: insertValues,
  }))

  const updateReturning = vi.fn().mockResolvedValue(updatedRows)
  const updateWhere = vi.fn(() => ({ returning: updateReturning }))
  const updateSet = vi.fn(() => ({ where: updateWhere }))
  const update = vi.fn(() => ({ set: updateSet }))

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

function toExpectedContract(row: UserSessionRow) {
  return {
    id: row.id,
    deviceName: row.deviceName,
    userAgent: row.userAgent,
    ipAddress: row.ipAddress,
    geoIp: toPublicGeoIp(row.geoIp),
    lastSeenAt: row.lastSeenAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    revokedAt: row.revokedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toPublicGeoIp(
  geoIp: UserSessionRow['geoIp'],
): Omit<NonNullable<UserSessionRow['geoIp']>, 'latitude' | 'longitude'> | null {
  if (!geoIp) {
    return null
  }

  const publicGeoIp = { ...geoIp }

  delete publicGeoIp.latitude
  delete publicGeoIp.longitude

  return publicGeoIp
}

describe('DrizzleUserSessionRepository', () => {
  it('finds an active session by ID', async () => {
    const row = createUserSessionRow()
    const databaseMock = createDatabaseMock({
      selectedRows: [row],
    })

    const repository = new DrizzleUserSessionRepository(databaseMock.database)

    const result = await repository.findById(row.id)

    expect(result).toEqual(toExpectedContract(row))

    expect(databaseMock.select).toHaveBeenCalledOnce()
    expect(databaseMock.selectFrom).toHaveBeenCalledWith(userSessionsTable)
    expect(databaseMock.selectLimit).toHaveBeenCalledWith(1)
  })

  it('returns null when an active session does not exist', async () => {
    const databaseMock = createDatabaseMock()

    const repository = new DrizzleUserSessionRepository(databaseMock.database)

    const result = await repository.findById('missing_session')

    expect(result).toBeNull()
  })

  it('returns every active session belonging to a user', async () => {
    const firstRow = createUserSessionRow()

    const secondRow = createUserSessionRow({
      id: 'session_456',
      tokenHash: 'another-hashed-session-token',
      deviceName: 'Chrome on Android',
      ipAddress: '192.168.0.11',
      geoIp: null,
    })

    const databaseMock = createDatabaseMock({
      selectedRows: [firstRow, secondRow],
    })

    const repository = new DrizzleUserSessionRepository(databaseMock.database)

    const result = await repository.findAllByUserId('user_123')

    expect(result).toEqual([
      toExpectedContract(firstRow),
      toExpectedContract(secondRow),
    ])
  })

  it('finds sessions by token hash and returns session history', async () => {
    const row = createUserSessionRow()
    const databaseMock = createDatabaseMock({ selectedRows: [row] })
    const repository = new DrizzleUserSessionRepository(databaseMock.database)

    await expect(repository.findByTokenHash(row.tokenHash)).resolves.toEqual(
      toExpectedContract(row),
    )
    await expect(repository.findHistoryByUserId(row.userId)).resolves.toEqual([
      toExpectedContract(row),
    ])
  })

  it('returns null when a token hash does not match an active session', async () => {
    const repository = new DrizzleUserSessionRepository(
      createDatabaseMock().database,
    )

    await expect(repository.findByTokenHash('missing')).resolves.toBeNull()
  })

  it('does not expose token hashes, user IDs, or exact GeoIP coordinates', async () => {
    const row = createUserSessionRow()
    const databaseMock = createDatabaseMock({
      selectedRows: [row],
    })

    const repository = new DrizzleUserSessionRepository(databaseMock.database)

    const result = await repository.findById(row.id)

    expect(result).not.toBeNull()
    expect(result).not.toHaveProperty('tokenHash')
    expect(result).not.toHaveProperty('userId')
    expect(result?.geoIp).not.toHaveProperty('latitude')
    expect(result?.geoIp).not.toHaveProperty('longitude')
  })

  it('creates and returns a user session', async () => {
    const row = createUserSessionRow()
    const databaseMock = createDatabaseMock({
      insertedRows: [row],
    })

    const repository = new DrizzleUserSessionRepository(databaseMock.database)

    const result = await repository.create({
      userId: row.userId,
      tokenHash: row.tokenHash,
      deviceName: row.deviceName,
      userAgent: row.userAgent,
      ipAddress: row.ipAddress,
      geoIp: row.geoIp,
      lastSeenAt: row.lastSeenAt,
      expiresAt: row.expiresAt,
    })

    expect(result).toEqual(toExpectedContract(row))

    expect(databaseMock.insert).toHaveBeenCalledWith(userSessionsTable)

    expect(databaseMock.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: row.userId,
        tokenHash: row.tokenHash,
        deviceName: row.deviceName,
        userAgent: row.userAgent,
        ipAddress: row.ipAddress,
        geoIp: row.geoIp,
        lastSeenAt: row.lastSeenAt,
        expiresAt: row.expiresAt,
      }),
    )
  })

  it('throws when creating a session does not return a row', async () => {
    const databaseMock = createDatabaseMock()

    const repository = new DrizzleUserSessionRepository(databaseMock.database)

    await expect(
      repository.create({
        userId: 'user_123',
        tokenHash: 'hashed-session-token',
        expiresAt: new Date('2026-06-27T00:00:00.000Z'),
      }),
    ).rejects.toThrow()
  })

  it('updates session activity and handles a missing session', async () => {
    const row = createUserSessionRow()
    const databaseMock = createDatabaseMock({ updatedRows: [row] })
    const repository = new DrizzleUserSessionRepository(databaseMock.database)

    await expect(repository.updateActivity(row.id)).resolves.toEqual(
      toExpectedContract(row),
    )
    expect(databaseMock.updateSet).toHaveBeenCalledWith({
      lastSeenAt: expect.any(Date),
      updatedAt: expect.any(Date),
    })

    const missingRepository = new DrizzleUserSessionRepository(
      createDatabaseMock().database,
    )
    await expect(
      missingRepository.updateActivity('missing', {
        lastSeenAt: row.lastSeenAt,
      }),
    ).resolves.toBeNull()
  })

  it('revokes one or all active sessions', async () => {
    const row = createUserSessionRow()
    const databaseMock = createDatabaseMock({
      updatedRows: [{ id: row.id }, { id: 'session_456' }],
    })
    const repository = new DrizzleUserSessionRepository(databaseMock.database)

    await expect(repository.revoke(row.id)).resolves.toBe(true)
    await expect(
      repository.revokeAllByUserId(row.userId, row.id),
    ).resolves.toBe(2)

    const missingRepository = new DrizzleUserSessionRepository(
      createDatabaseMock().database,
    )
    await expect(missingRepository.revoke('missing')).resolves.toBe(false)
    await expect(missingRepository.revokeAllByUserId(row.userId)).resolves.toBe(
      0,
    )
  })
})
