// libs/db/src/client/database.types.spec.ts

import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { describe, expectTypeOf, it } from 'vitest'

import { type NewUserRow, type UserRow, usersTable } from '../schema'
import type {
  DatabaseClient,
  DatabaseSchema,
  TableInsert,
  TableSelect,
} from './database.types'

describe('database types', () => {
  it('infers a selected row from a table', () => {
    expectTypeOf<TableSelect<typeof usersTable>>().toEqualTypeOf<UserRow>()
  })

  it('infers an insert row from a table', () => {
    expectTypeOf<TableInsert<typeof usersTable>>().toEqualTypeOf<NewUserRow>()
  })

  it('uses the exported database schema for the database client', () => {
    expectTypeOf<DatabaseClient>().toEqualTypeOf<
      NodePgDatabase<DatabaseSchema>
    >()
  })

  it('includes the users table in the database schema', () => {
    expectTypeOf<DatabaseSchema['usersTable']>().toEqualTypeOf<
      typeof usersTable
    >()
  })
})
