// libs/db/src/adapters/drizzle-persistence.adapter.ts

import type { DatabaseClient } from '../client'
import { PersistenceAdapter } from './persistence.adapter'

/**
 * Base persistence adapter for Drizzle-backed database adapters.
 *
 * Provides access to the shared database client while leaving entity and row
 * mapping responsibilities to the concrete adapter.
 */
export abstract class DrizzlePersistenceAdapter<
  TEntity,
  TRow,
  TNewRow,
> extends PersistenceAdapter<TEntity, TRow, TNewRow> {
  protected constructor(protected readonly database: DatabaseClient) {
    super()
  }
}
