// libs/db/src/transactions/with-transaction.ts

import type { DatabaseClient } from '../client'
import type { TransactionCallback } from './transaction.types'

/**
 * Runs database work inside a transaction.
 *
 * The transaction commits when the callback succeeds and rolls back when it
 * throws an error.
 */
export async function withTransaction<TResult>(
  database: DatabaseClient,
  callback: TransactionCallback<TResult>,
): Promise<TResult> {
  return database.transaction((transaction) => callback(transaction))
}
