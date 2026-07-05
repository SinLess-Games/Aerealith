// libs/db/src/queries/user/user-account.queries.spec.ts

import type { SQL } from 'drizzle-orm'
import { PgDialect } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'

import {
  activeUserAccountById,
  activeUserAccountsByUserId,
} from './user-account.queries'

const dialect = new PgDialect()

function toQuery(condition: SQL | undefined) {
  if (condition === undefined) {
    throw new Error('Expected the query helper to return a SQL condition.')
  }

  return dialect.sqlToQuery(condition)
}

describe('user account queries', () => {
  it('creates an active user account predicate by ID', () => {
    const query = toQuery(activeUserAccountById('account_123'))

    expect(query.params).toEqual(['account_123'])
    expect(query.sql).toContain('"user_accounts"."id" = $1')
    expect(query.sql).toContain('"user_accounts"."deleted_at" is null')
  })

  it('creates an active user account predicate by user ID', () => {
    const query = toQuery(activeUserAccountsByUserId('user_123'))

    expect(query.params).toEqual(['user_123'])
    expect(query.sql).toContain('"user_accounts"."user_id" = $1')
    expect(query.sql).toContain('"user_accounts"."deleted_at" is null')
  })

  it('uses the provided account ID as the query parameter', () => {
    const accountId = 'account_456'

    const query = toQuery(activeUserAccountById(accountId))

    expect(query.params).toEqual([accountId])
  })

  it('uses the provided user ID as the query parameter', () => {
    const userId = 'user_456'

    const query = toQuery(activeUserAccountsByUserId(userId))

    expect(query.params).toEqual([userId])
  })

  it('always excludes soft-deleted user accounts', () => {
    const byIdQuery = toQuery(activeUserAccountById('account_123'))

    const byUserIdQuery = toQuery(activeUserAccountsByUserId('user_123'))

    expect(byIdQuery.sql).toContain('"user_accounts"."deleted_at" is null')

    expect(byUserIdQuery.sql).toContain('"user_accounts"."deleted_at" is null')
  })
})
