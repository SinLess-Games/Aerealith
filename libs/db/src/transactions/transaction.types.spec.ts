// libs/db/src/transactions/transaction.types.spec.ts

import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { NodePgTransaction } from 'drizzle-orm/node-postgres'
import { describe, expectTypeOf, it } from 'vitest'

import type { DatabaseSchema } from '../client'
import type {
  DatabaseTransaction,
  TransactionCallback,
} from './transaction.types'

describe('transaction types', () => {
  it('defines the expected Drizzle transaction type', () => {
    expectTypeOf<DatabaseTransaction>().toEqualTypeOf<
      NodePgTransaction<
        DatabaseSchema,
        ExtractTablesWithRelations<DatabaseSchema>
      >
    >()
  })

  it('defines callbacks that receive a database transaction', () => {
    expectTypeOf<TransactionCallback<string>>().toEqualTypeOf<
      (transaction: DatabaseTransaction) => Promise<string>
    >()
  })

  it('supports async callbacks with typed results', () => {
    expectTypeOf<TransactionCallback<{ id: string }>>().returns.toEqualTypeOf<
      Promise<{ id: string }>
    >()
  })
})
