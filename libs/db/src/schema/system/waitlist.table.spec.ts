// libs/db/src/schema/system/waitlist.table.spec.ts

import { getTableColumns, getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { waitlistTable } from './waitlist.table'

describe('waitlistTable', () => {
  it('uses the correct database table name', () => {
    expect(getTableName(waitlistTable)).toBe('waitlist_entries')
  })

  it('defines the required columns', () => {
    const columns = getTableColumns(waitlistTable)

    expect(Object.keys(columns)).toEqual([
      'id',
      'email',
      'createdAt',
      'updatedAt',
      'deletedAt',
    ])
  })

  it('requires an email address', () => {
    const { email } = getTableColumns(waitlistTable)

    expect(email.notNull).toBe(true)
    expect(email.hasDefault).toBe(false)
  })

  it('generates IDs and timestamps by default', () => {
    const { id, createdAt, updatedAt } = getTableColumns(waitlistTable)

    expect(id.notNull).toBe(true)
    expect(id.hasDefault).toBe(true)

    expect(createdAt.notNull).toBe(true)
    expect(createdAt.hasDefault).toBe(true)

    expect(updatedAt.notNull).toBe(true)
    expect(updatedAt.hasDefault).toBe(true)
  })

  it('allows soft deletion', () => {
    const { deletedAt } = getTableColumns(waitlistTable)

    expect(deletedAt.notNull).toBe(false)
  })
})
