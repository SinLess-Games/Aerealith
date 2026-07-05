// libs/db/src/schema/user/user-session.table.spec.ts

import { getTableColumns, getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { userSessionsTable } from './user-session.table'

describe('userSessionsTable', () => {
  it('uses the correct database table name', () => {
    expect(getTableName(userSessionsTable)).toBe('user_sessions')
  })

  it('defines the required columns', () => {
    const columns = getTableColumns(userSessionsTable)

    expect(Object.keys(columns)).toEqual([
      'id',
      'userId',
      'tokenHash',
      'deviceName',
      'userAgent',
      'ipAddress',
      'geoIp',
      'lastSeenAt',
      'expiresAt',
      'revokedAt',
      'createdAt',
      'updatedAt',
      'deletedAt',
    ])
  })

  it('requires the user ID, token hash, and expiration time', () => {
    const { userId, tokenHash, expiresAt } = getTableColumns(userSessionsTable)

    expect(userId.notNull).toBe(true)
    expect(userId.hasDefault).toBe(false)

    expect(tokenHash.notNull).toBe(true)
    expect(tokenHash.hasDefault).toBe(false)

    expect(expiresAt.notNull).toBe(true)
    expect(expiresAt.hasDefault).toBe(false)
  })

  it('allows optional session and location details', () => {
    const { deviceName, userAgent, ipAddress, geoIp, revokedAt } =
      getTableColumns(userSessionsTable)

    expect(deviceName.notNull).toBe(false)
    expect(userAgent.notNull).toBe(false)
    expect(ipAddress.notNull).toBe(false)
    expect(geoIp.notNull).toBe(false)
    expect(revokedAt.notNull).toBe(false)
  })

  it('generates IDs and activity timestamps by default', () => {
    const { id, lastSeenAt, createdAt, updatedAt } =
      getTableColumns(userSessionsTable)

    expect(id.notNull).toBe(true)
    expect(id.hasDefault).toBe(true)

    expect(lastSeenAt.notNull).toBe(true)
    expect(lastSeenAt.hasDefault).toBe(true)

    expect(createdAt.notNull).toBe(true)
    expect(createdAt.hasDefault).toBe(true)

    expect(updatedAt.notNull).toBe(true)
    expect(updatedAt.hasDefault).toBe(true)
  })

  it('allows soft deletion', () => {
    const { deletedAt } = getTableColumns(userSessionsTable)

    expect(deletedAt.notNull).toBe(false)
  })
})
