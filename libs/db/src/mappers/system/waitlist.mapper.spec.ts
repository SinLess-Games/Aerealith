// libs/db/src/mappers/system/waitlist.mapper.spec.ts

import { describe, expect, it } from 'vitest';

import type { WaitlistRow } from '../../schema';
import {
  toNewWaitlistRow,
  toWaitlistContract,
  toWaitlistEntity,
} from './waitlist.mapper';

function createWaitlistRow(
  overrides: Partial<WaitlistRow> = {},
): WaitlistRow {
  return {
    id: 'waitlist_123',
    email: 'andy@example.com',

    createdAt: new Date('2026-06-20T00:00:00.000Z'),
    updatedAt: new Date('2026-06-20T00:00:00.000Z'),
    deletedAt: null,

    ...overrides,
  };
}

describe('waitlist mapper', () => {
  it('converts a database row into a waitlist entity', () => {
    const row = createWaitlistRow();

    const entity = toWaitlistEntity(row);

    expect(entity).toEqual(
      expect.objectContaining({
        id: row.id,
        email: row.email,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt,
      }),
    );
  });

  it('preserves a soft-deletion timestamp when converting to an entity', () => {
    const deletedAt = new Date('2026-06-21T00:00:00.000Z');

    const entity = toWaitlistEntity(
      createWaitlistRow({
        deletedAt,
      }),
    );

    expect(entity.deletedAt).toBe(deletedAt);
  });

  it('converts a waitlist entity into a database insert row', () => {
    const row = createWaitlistRow();
    const entity = toWaitlistEntity(row);

    const newRow = toNewWaitlistRow(entity);

    expect(newRow).toEqual({
      email: row.email,
    });
  });

  it('converts a waitlist entity into a contract with an ISO timestamp', () => {
    const row = createWaitlistRow();
    const entity = toWaitlistEntity(row);

    const contract = toWaitlistContract(entity);

    expect(contract).toEqual({
      id: row.id,
      email: row.email,
      createdAt: row.createdAt.toISOString(),
    });
  });

  it('does not expose internal timestamps in the contract', () => {
    const entity = toWaitlistEntity(
      createWaitlistRow({
        deletedAt: new Date('2026-06-21T00:00:00.000Z'),
      }),
    );

    const contract = toWaitlistContract(entity);

    expect(contract).not.toHaveProperty('updatedAt');
    expect(contract).not.toHaveProperty('deletedAt');
  });
});
