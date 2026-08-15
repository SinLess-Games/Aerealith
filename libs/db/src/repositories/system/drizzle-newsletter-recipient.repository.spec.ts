import { describe, expect, it, vi } from 'vitest';

import type { DatabaseClient } from '../../client';
import {
  newsletterRecipientsTable,
  type NewsletterRecipientRow,
} from '../../schema';
import { DrizzleNewsletterRecipientRepository } from './drizzle-newsletter-recipient.repository';

function row(
  overrides: Partial<NewsletterRecipientRow> = {},
): NewsletterRecipientRow {
  return {
    id: 'recipient-1',
    email: 'person@example.com',
    source: 'waitlist',
    subscribedAt: new Date('2026-08-13T10:00:00.000Z'),
    createdAt: new Date('2026-08-13T10:00:00.000Z'),
    updatedAt: new Date('2026-08-13T10:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

function databaseMock({
  selected = [],
  inserted = [],
  updated = [],
}: {
  selected?: NewsletterRecipientRow[];
  inserted?: NewsletterRecipientRow[];
  updated?: { id: string }[];
} = {}) {
  const selectLimit = vi.fn().mockResolvedValue(selected);
  const selectWhere = vi.fn(() => ({ limit: selectLimit }));
  const selectFrom = vi.fn(() => ({ where: selectWhere }));
  const select = vi.fn(() => ({ from: selectFrom }));

  const insertReturning = vi.fn().mockResolvedValue(inserted);
  const onConflictDoUpdate = vi.fn(() => ({ returning: insertReturning }));
  const insertValues = vi.fn(() => ({ onConflictDoUpdate }));
  const insert = vi.fn(() => ({ values: insertValues }));

  const updateReturning = vi.fn().mockResolvedValue(updated);
  const updateWhere = vi.fn(() => ({ returning: updateReturning }));
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set: updateSet }));

  return {
    database: { insert, select, update } as unknown as DatabaseClient,
    insert,
    insertValues,
    onConflictDoUpdate,
    selectFrom,
    selectLimit,
    update,
    updateSet,
  };
}

describe('DrizzleNewsletterRecipientRepository', () => {
  it('finds and maps an active recipient using a normalized email', async () => {
    const expected = row();
    const mock = databaseMock({ selected: [expected] });
    const repository = new DrizzleNewsletterRecipientRepository(mock.database);

    await expect(
      repository.findByEmail(' Person@Example.COM '),
    ).resolves.toEqual({
      id: 'recipient-1',
      email: 'person@example.com',
      source: 'waitlist',
      subscribedAt: '2026-08-13T10:00:00.000Z',
      createdAt: '2026-08-13T10:00:00.000Z',
    });
    expect(mock.selectFrom).toHaveBeenCalledWith(newsletterRecipientsTable);
    expect(mock.selectLimit).toHaveBeenCalledWith(1);
  });

  it('returns null when an active recipient does not exist', async () => {
    const mock = databaseMock();
    const repository = new DrizzleNewsletterRecipientRepository(mock.database);
    await expect(
      repository.findByEmail('missing@example.com'),
    ).resolves.toBeNull();
  });

  it.each([
    [undefined, 'waitlist'],
    ['   ', 'waitlist'],
    [' Product launch ', 'Product launch'],
  ])(
    'upserts a subscription with source %p',
    async (source, expectedSource) => {
      const expected = row({ source: expectedSource });
      const mock = databaseMock({ inserted: [expected] });
      const repository = new DrizzleNewsletterRecipientRepository(
        mock.database,
      );

      await expect(
        repository.subscribe({ email: ' Person@Example.COM ', source }),
      ).resolves.toMatchObject({
        email: 'person@example.com',
        source: expectedSource,
      });
      expect(mock.insert).toHaveBeenCalledWith(newsletterRecipientsTable);
      expect(mock.insertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'person@example.com',
          source: expectedSource,
          subscribedAt: expect.any(Date),
        }),
      );
      expect(mock.onConflictDoUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          target: newsletterRecipientsTable.email,
          set: expect.objectContaining({
            deletedAt: null,
            source: expectedSource,
          }),
        }),
      );
    },
  );

  it('throws when the upsert does not return a recipient', async () => {
    const repository = new DrizzleNewsletterRecipientRepository(
      databaseMock().database,
    );
    await expect(
      repository.subscribe({ email: 'person@example.com' }),
    ).rejects.toThrow('Failed to subscribe newsletter recipient.');
  });

  it.each([
    [[{ id: 'recipient-1' }], true],
    [[], false],
  ])(
    'soft deletes an active recipient and returns %s',
    async (updated, expected) => {
      const mock = databaseMock({ updated });
      const repository = new DrizzleNewsletterRecipientRepository(
        mock.database,
      );
      await expect(
        repository.unsubscribe(' Person@Example.COM '),
      ).resolves.toBe(expected);
      expect(mock.update).toHaveBeenCalledWith(newsletterRecipientsTable);
      expect(mock.updateSet).toHaveBeenCalledWith({
        deletedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    },
  );
});
