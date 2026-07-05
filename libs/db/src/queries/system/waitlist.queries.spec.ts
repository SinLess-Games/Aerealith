// libs/db/src/queries/system/waitlist.queries.spec.ts

import { PgDialect } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'

import { activeWaitlistEntryByEmail } from './waitlist.queries'

const dialect = new PgDialect()

function toQuery(condition: ReturnType<typeof activeWaitlistEntryByEmail>) {
  if (condition === undefined) {
    throw new Error(
      'Expected activeWaitlistEntryByEmail to return a SQL condition.',
    )
  }

  return dialect.sqlToQuery(condition)
}

describe('waitlist queries', () => {
  it('creates an active waitlist entry predicate by email', () => {
    const query = toQuery(activeWaitlistEntryByEmail('andy@example.com'))

    expect(query.params).toEqual(['andy@example.com'])
    expect(query.sql).toContain('"waitlist_entries"."email" = $1')
    expect(query.sql).toContain('"waitlist_entries"."deleted_at" is null')
  })

  it('uses the provided email as the predicate parameter', () => {
    const email = 'new-user@example.com'

    const query = toQuery(activeWaitlistEntryByEmail(email))

    expect(query.params).toEqual([email])
  })

  it('creates independent predicates for different email addresses', () => {
    const firstQuery = toQuery(activeWaitlistEntryByEmail('first@example.com'))

    const secondQuery = toQuery(
      activeWaitlistEntryByEmail('second@example.com'),
    )

    expect(firstQuery.params).toEqual(['first@example.com'])
    expect(secondQuery.params).toEqual(['second@example.com'])
  })

  it('always excludes soft-deleted waitlist entries', () => {
    const query = toQuery(activeWaitlistEntryByEmail('andy@example.com'))

    expect(query.sql).toContain('"waitlist_entries"."deleted_at" is null')
  })
})
