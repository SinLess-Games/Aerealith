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
}: {
  selectedRows?: UserSessionRow[]
  insertedRows?: UserSessionRow[]
} = {}) {
  const selectLimit = vi.fn().mockResolvedValue(selectedRows)
  const selectOrderBy = vi.fn()

  const selectResult = {
    limit: selectLimit,
    orderBy: selectOrderBy,
    then<TResult1 = UserSessionRow[], TResult2 = never>(
      onfulfilled?:
        | ((value: UserSessionRow[]) => TResult1 | PromiseLike<TResult1>)
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

  const database = {
    select,
    insert,
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
})
