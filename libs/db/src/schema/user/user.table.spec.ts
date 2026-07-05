// libs/db/src/schema/user/user.table.spec.ts

import { getTableColumns, getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { usersTable } from './user.table'

describe('usersTable', () => {
  it('uses the correct database table name', () => {
    expect(getTableName(usersTable)).toBe('users')
  })

  it('defines the required columns', () => {
    const columns = getTableColumns(usersTable)

    expect(Object.keys(columns)).toEqual([
      'id',
      'username',
      'email',
      'passwordHash',
      'status',
      'emailVerified',
      'emailVerifiedAt',
      'role',
      'tier',
      'metadata',
      'createdAt',
      'updatedAt',
      'deletedAt',
    ])
  })

  it('requires a username and email address', () => {
    const { username, email } = getTableColumns(usersTable)

    expect(username.notNull).toBe(true)
    expect(username.hasDefault).toBe(false)

    expect(email.notNull).toBe(true)
    expect(email.hasDefault).toBe(false)
  })

  it('allows password hashes for non-password authentication providers', () => {
    const { passwordHash } = getTableColumns(usersTable)

    expect(passwordHash.notNull).toBe(false)
  })

  it('requires lifecycle, verification, access, and metadata values', () => {
    const { status, emailVerified, role, tier, metadata } =
      getTableColumns(usersTable)

    expect(status.notNull).toBe(true)
    expect(status.hasDefault).toBe(true)

    expect(emailVerified.notNull).toBe(true)
    expect(emailVerified.hasDefault).toBe(true)

    expect(role.notNull).toBe(true)
    expect(role.hasDefault).toBe(true)

    expect(tier.notNull).toBe(true)
    expect(tier.hasDefault).toBe(true)

    expect(metadata.notNull).toBe(true)
    expect(metadata.hasDefault).toBe(true)
  })

  it('allows an optional email verification timestamp', () => {
    const { emailVerifiedAt } = getTableColumns(usersTable)

    expect(emailVerifiedAt.notNull).toBe(false)
  })

  it('generates IDs and record timestamps by default', () => {
    const { id, createdAt, updatedAt } = getTableColumns(usersTable)

    expect(id.notNull).toBe(true)
    expect(id.hasDefault).toBe(true)

    expect(createdAt.notNull).toBe(true)
    expect(createdAt.hasDefault).toBe(true)

    expect(updatedAt.notNull).toBe(true)
    expect(updatedAt.hasDefault).toBe(true)
  })

  it('allows soft deletion', () => {
    const { deletedAt } = getTableColumns(usersTable)

    expect(deletedAt.notNull).toBe(false)
  })
})
