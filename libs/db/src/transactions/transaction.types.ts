// libs/db/src/transactions/transaction.types.ts

import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { NodePgTransaction } from 'drizzle-orm/node-postgres'

import type { DatabaseSchema } from '../client'

/**
 * Represents a typed Drizzle transaction for the Aerealith database schema.
 */
export type DatabaseTransaction = NodePgTransaction<
  DatabaseSchema,
  ExtractTablesWithRelations<DatabaseSchema>
>

/**
 * Represents work performed inside a database transaction.
 */
export type TransactionCallback<TResult> = (
  transaction: DatabaseTransaction,
) => Promise<TResult>
