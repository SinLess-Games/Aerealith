// libs/db/src/queries/user/user-profile.queries.spec.ts

import type { SQL } from 'drizzle-orm'
import { PgDialect } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'

import {
  activeUserProfileByHandle,
  activeUserProfileById,
  activeUserProfileByUserId,
} from './user-profile.queries'

const dialect = new PgDialect()

function toQuery(condition: SQL | undefined) {
  if (condition === undefined) {
    throw new Error('Expected the query helper to return a SQL condition.')
  }

  return dialect.sqlToQuery(condition)
}

describe('user profile queries', () => {
  it('creates an active user profile predicate by ID', () => {
    const query = toQuery(activeUserProfileById('profile_123'))

    expect(query.params).toEqual(['profile_123'])
    expect(query.sql).toContain('"user_profiles"."id" = $1')
    expect(query.sql).toContain('"user_profiles"."deleted_at" is null')
  })

  it('creates an active user profile predicate by user ID', () => {
    const query = toQuery(activeUserProfileByUserId('user_123'))

    expect(query.params).toEqual(['user_123'])
    expect(query.sql).toContain('"user_profiles"."user_id" = $1')
    expect(query.sql).toContain('"user_profiles"."deleted_at" is null')
  })

  it('creates an active user profile predicate by normalized handle', () => {
    const query = toQuery(activeUserProfileByHandle('sinless777'))

    expect(query.params).toEqual(['sinless777'])
    expect(query.sql).toContain('"user_profiles"."handle" = $1')
    expect(query.sql).toContain('"user_profiles"."deleted_at" is null')
  })

  it('uses the provided profile ID as the predicate parameter', () => {
    const profileId = 'profile_456'

    const query = toQuery(activeUserProfileById(profileId))

    expect(query.params).toEqual([profileId])
  })

  it('uses the provided user ID as the predicate parameter', () => {
    const userId = 'user_456'

    const query = toQuery(activeUserProfileByUserId(userId))

    expect(query.params).toEqual([userId])
  })

  it('uses the provided handle as the predicate parameter', () => {
    const handle = 'aerealith-admin'

    const query = toQuery(activeUserProfileByHandle(handle))

    expect(query.params).toEqual([handle])
  })

  it('always excludes soft-deleted user profiles', () => {
    const byIdQuery = toQuery(activeUserProfileById('profile_123'))

    const byUserIdQuery = toQuery(activeUserProfileByUserId('user_123'))

    const byHandleQuery = toQuery(activeUserProfileByHandle('sinless777'))

    expect(byIdQuery.sql).toContain('"user_profiles"."deleted_at" is null')

    expect(byUserIdQuery.sql).toContain('"user_profiles"."deleted_at" is null')

    expect(byHandleQuery.sql).toContain('"user_profiles"."deleted_at" is null')
  })
})
