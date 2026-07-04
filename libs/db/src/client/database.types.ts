// libs/db/src/client/database.types.ts

import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import * as schema from '../schema'

/**
 * All Drizzle table schemas exported by libs/db/src/schema.
 */
export type DatabaseSchema = typeof schema

/**
 * Main Drizzle database client.
 */
export type DatabaseClient = NodePgDatabase<DatabaseSchema>

/**
 * Helper type for a Drizzle table select row.
 */
export type TableSelect<TTable extends { $inferSelect: unknown }> =
  TTable['$inferSelect']

/**
 * Helper type for a Drizzle table insert row.
 */
export type TableInsert<TTable extends { $inferInsert: unknown }> =
  TTable['$inferInsert']
