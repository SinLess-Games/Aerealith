import { describe, expect, it, vi } from 'vitest';

import type { DatabaseClient } from '../../client';
import { discordTicketEventsTable, discordTicketsTable } from '../../schema';
import { DrizzleDiscordTicketRepository } from './drizzle-discord-ticket.repository';

describe('DrizzleDiscordTicketRepository', () => {
  it('records claim, close, reopen, and archive lifecycle transitions', async () => {
    const transitions: Array<Record<string, unknown>> = [];
    const events: Array<Record<string, unknown>> = [];
    const tx = {
      update: vi.fn((table: unknown) => {
        expect(table).toBe(discordTicketsTable);
        let values: Record<string, unknown> = {};
        const builder: Record<string, unknown> = {};
        builder.set = (next: Record<string, unknown>) => {
          values = next;
          transitions.push(next);
          return builder;
        };
        builder.where = () => builder;
        builder.returning = () =>
          Promise.resolve([{ id: 'ticket-id', status: values.status }]);
        return builder;
      }),
      insert: vi.fn((table: unknown) => {
        expect(table).toBe(discordTicketEventsTable);
        const builder: Record<string, unknown> = {};
        builder.values = (values: Record<string, unknown>) => {
          events.push(values);
          return Promise.resolve([]);
        };
        return builder;
      }),
    };
    const repository = new DrizzleDiscordTicketRepository({
      transaction: (callback: (value: typeof tx) => unknown) => callback(tx),
    } as unknown as DatabaseClient);

    await expect(
      repository.assign('ticket-id', 'staff-id'),
    ).resolves.toMatchObject({ status: 'claimed' });
    await expect(
      repository.close('ticket-id', 'staff-id', 'resolved', 'r2://transcript'),
    ).resolves.toMatchObject({ status: 'closed' });
    await expect(
      repository.reopen('ticket-id', 'staff-id'),
    ).resolves.toMatchObject({ status: 'reopened' });
    await expect(
      repository.archive('ticket-id', 'staff-id'),
    ).resolves.toMatchObject({ status: 'archived' });

    expect(transitions.map((transition) => transition.status)).toEqual([
      'claimed',
      'closed',
      'reopened',
      'archived',
    ]);
    expect(events.map((event) => event.eventType)).toEqual([
      'claimed',
      'closed',
      'reopened',
      'archived',
    ]);
  });
});
