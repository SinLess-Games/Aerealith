// libs/db/src/queries/user/user.queries.spec.ts

import type { SQL } from 'drizzle-orm'
import { PgDialect } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'

import {
  activeUserByEmail,
  activeUserById,
  activeUserByUsername,
} from './user.queries'

const dialect = new PgDialect()

function toQuery(condition: SQL | undefined) {
  if (condition === undefined) {
    throw new Error('Expected the query helper to return a SQL condition.')
  }

  return dialect.sqlToQuery(condition)
}

describe('user queries', () => {
  it('creates an active user predicate by ID', () => {
    const query = toQuery(activeUserById('user_123'))

    expect(query.params).toEqual(['user_123'])
    expect(query.sql).toContain('"users"."id" = $1')
    expect(query.sql).toContain('"users"."deleted_at" is null')
  })

  it('creates an active user predicate by normalized email', () => {
    const query = toQuery(activeUserByEmail('  ANDY@EXAMPLE.COM  '))

    expect(query.params).toEqual(['andy@example.com'])
    expect(query.sql).toContain('"users"."email" = $1')
    expect(query.sql).toContain('"users"."deleted_at" is null')
  })

  it('creates an active user predicate by normalized username', () => {
    const query = toQuery(activeUserByUsername('  SinLess777  '))

    expect(query.params).toEqual(['sinless777'])
    expect(query.sql).toContain('"users"."username" = $1')
    expect(query.sql).toContain('"users"."deleted_at" is null')
  })

  it('uses the provided user ID as the predicate parameter', () => {
    const userId = 'user_456'

    const query = toQuery(activeUserById(userId))

    expect(query.params).toEqual([userId])
  })

  it('normalizes equivalent email addresses into the same predicate', () => {
    const lowerCaseQuery = toQuery(activeUserByEmail('andy@example.com'))

    const mixedCaseQuery = toQuery(activeUserByEmail('AnDy@ExAmPlE.cOm'))

    expect(lowerCaseQuery.params).toEqual(['andy@example.com'])
    expect(mixedCaseQuery.params).toEqual(['andy@example.com'])
  })

  it('normalizes equivalent usernames into the same predicate', () => {
    const lowerCaseQuery = toQuery(activeUserByUsername('sinless777'))

    const mixedCaseQuery = toQuery(activeUserByUsername('SinLess777'))

    expect(lowerCaseQuery.params).toEqual(['sinless777'])
    expect(mixedCaseQuery.params).toEqual(['sinless777'])
  })

  it('always excludes soft-deleted users', () => {
    const byIdQuery = toQuery(activeUserById('user_123'))

    const byEmailQuery = toQuery(activeUserByEmail('andy@example.com'))

    const byUsernameQuery = toQuery(activeUserByUsername('sinless777'))

    expect(byIdQuery.sql).toContain('"users"."deleted_at" is null')

    expect(byEmailQuery.sql).toContain('"users"."deleted_at" is null')

    expect(byUsernameQuery.sql).toContain('"users"."deleted_at" is null')
  })
})
