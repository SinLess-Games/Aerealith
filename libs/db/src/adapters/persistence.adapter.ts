// libs/db/src/adapters/persistence.adapter.ts

/**
 * Defines the minimum mapping required between a database row and a core entity.
 *
 * API contract mapping belongs in the mapper layer, not persistence adapters.
 */
export abstract class PersistenceAdapter<TEntity, TRow, TNewRow> {
  /**
   * Converts a database row into a core entity.
   */
  public abstract toEntity(row: TRow): TEntity;

  /**
   * Converts a core entity into a row suitable for database insertion.
   */
  public abstract toNewRow(entity: TEntity): TNewRow;

  /**
   * Converts multiple database rows into core entities.
   */
  public toEntities(rows: readonly TRow[]): TEntity[] {
    return rows.map((row) => this.toEntity(row));
  }
}
