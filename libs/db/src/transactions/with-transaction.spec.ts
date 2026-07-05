// libs/db/src/transactions/with-transaction.spec.ts

import { describe, expect, it, vi } from 'vitest'

import type { DatabaseClient } from '../client'
import type { DatabaseTransaction } from './transaction.types'
import { withTransaction } from './with-transaction'

describe('withTransaction', () => {
  it('runs the callback with the database transaction', async () => {
    const transaction = {} as DatabaseTransaction

    const database = {
      transaction: vi.fn(async (callback) => callback(transaction)),
    } as unknown as DatabaseClient

    const callback = vi.fn(async () => 'complete')

    const result = await withTransaction(database, callback)

    expect(result).toBe('complete')
    expect(database.transaction).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledWith(transaction)
  })

  it('returns the callback result', async () => {
    const transaction = {} as DatabaseTransaction

    const database = {
      transaction: vi.fn(async (callback) => callback(transaction)),
    } as unknown as DatabaseClient

    const result = await withTransaction(database, async () => ({
      userId: 'user_123',
      created: true,
    }))

    expect(result).toEqual({
      userId: 'user_123',
      created: true,
    })
  })

  it('propagates callback errors so Drizzle can roll back the transaction', async () => {
    const transaction = {} as DatabaseTransaction
    const expectedError = new Error('Transaction failed')

    const database = {
      transaction: vi.fn(async (callback) => callback(transaction)),
    } as unknown as DatabaseClient

    await expect(
      withTransaction(database, async () => {
        throw expectedError
      }),
    ).rejects.toThrow(expectedError)

    expect(database.transaction).toHaveBeenCalledOnce()
  })
})
