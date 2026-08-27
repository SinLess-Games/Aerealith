import { describe, expect, it, vi } from 'vitest';

import type { DatabaseClient } from '../../client';
import {
  discordAgeVerificationEventsTable,
  discordAgeVerificationsTable,
  discordGuildAnalyticsSnapshotsTable,
  discordMessagesTable,
  discordProxiedMessagesTable,
  discordTicketEventsTable,
  discordTicketsTable,
} from '../../schema';
import { writeDiscordAnalyticsRollupTransaction } from './analytics-rollup.transaction';
import { closeDiscordTicketTransaction } from './moderation-ticket.transaction';
import {
  createDiscordPersonaProxyTransaction,
  transitionDiscordAgeVerificationTransaction,
} from './persona-age.transaction';

function transactionDatabase(transaction: object): DatabaseClient {
  return {
    transaction: (callback: (value: object) => unknown) =>
      callback(transaction),
  } as unknown as DatabaseClient;
}

describe('Discord cross-table workflows', () => {
  it('closes a ticket and writes its final lifecycle event atomically', async () => {
    const ticket = { id: 'ticket-id', status: 'closed' };
    const updates: Array<Record<string, unknown>> = [];
    const events: Array<Record<string, unknown>> = [];
    const tx = {
      update: vi.fn((table: unknown) => {
        expect(table).toBe(discordTicketsTable);
        const builder: Record<string, unknown> = {};
        builder.set = (values: Record<string, unknown>) => {
          updates.push(values);
          return builder;
        };
        builder.where = () => builder;
        builder.returning = () => Promise.resolve([ticket]);
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

    await expect(
      closeDiscordTicketTransaction(transactionDatabase(tx), {
        ticketId: 'ticket-id',
        actorAccountId: 'staff-id',
        closureReason: 'resolved',
        transcriptObjectReference: 'r2://ticket-transcript',
      }),
    ).resolves.toEqual(ticket);
    expect(updates[0]).toMatchObject({
      status: 'closed',
      closureReason: 'resolved',
      transcriptObjectReference: 'r2://ticket-transcript',
    });
    expect(events[0]).toMatchObject({
      ticketId: 'ticket-id',
      actorAccountId: 'staff-id',
      eventType: 'closed',
    });
  });

  it('stores a proxy message mapping back to its account and persona', async () => {
    const writes: Array<{ table: unknown; values?: Record<string, unknown> }> =
      [];
    const tx = {
      insert: vi.fn((table: unknown) => {
        const write: (typeof writes)[number] = { table };
        writes.push(write);
        const rows =
          table === discordMessagesTable
            ? [{ id: 'message-id' }]
            : [
                {
                  id: 'proxy-id',
                  originalAuthorAccountId: 'account-id',
                  personaId: 'persona-id',
                },
              ];
        const builder: Record<string, unknown> = {};
        builder.values = (values: Record<string, unknown>) => {
          write.values = values;
          return builder;
        };
        builder.onConflictDoUpdate = () => builder;
        builder.returning = () => Promise.resolve(rows);
        return builder;
      }),
    };

    const result = await createDiscordPersonaProxyTransaction(
      transactionDatabase(tx),
      {
        message: {
          discordMessageId: '500000000000000001',
          guildId: 'guild-id',
          channelId: 'channel-id',
          discordCreatedAt: new Date('2026-08-01T00:00:00Z'),
        },
        proxy: {
          guildId: 'guild-id',
          channelId: 'channel-id',
          originalAuthorAccountId: 'account-id',
          personaId: 'persona-id',
          resultingDiscordMessageId: '500000000000000001',
        },
      },
    );

    expect(result.proxy).toMatchObject({
      originalAuthorAccountId: 'account-id',
      personaId: 'persona-id',
    });
    expect(
      writes.find((write) => write.table === discordProxiedMessagesTable)
        ?.values,
    ).toMatchObject({
      originalAuthorAccountId: 'account-id',
      personaId: 'persona-id',
      resultingMessageId: 'message-id',
    });
  });

  it('transitions age verification and records an audit event without evidence data', async () => {
    const existing = { id: 'verification-id', status: 'pending', method: null };
    const verification = {
      ...existing,
      status: 'verified',
      method: 'provider',
      is18Plus: true,
    };
    const writes: Array<{
      table: unknown;
      values?: Record<string, unknown>;
    }> = [];
    const tx = {
      select: vi.fn(() => {
        const builder: Record<string, unknown> = {};
        builder.from = () => builder;
        builder.where = () => builder;
        builder.limit = () => Promise.resolve([existing]);
        return builder;
      }),
      update: vi.fn((table: unknown) => {
        expect(table).toBe(discordAgeVerificationsTable);
        const write: (typeof writes)[number] = { table };
        writes.push(write);
        const builder: Record<string, unknown> = {};
        builder.set = (values: Record<string, unknown>) => {
          write.values = values;
          return builder;
        };
        builder.where = () => builder;
        builder.returning = () => Promise.resolve([verification]);
        return builder;
      }),
      insert: vi.fn((table: unknown) => {
        expect(table).toBe(discordAgeVerificationEventsTable);
        const write: (typeof writes)[number] = { table };
        writes.push(write);
        const builder: Record<string, unknown> = {};
        builder.values = (values: Record<string, unknown>) => {
          write.values = values;
          return builder;
        };
        builder.returning = () =>
          Promise.resolve([{ id: 'event-id', ...write.values }]);
        return builder;
      }),
    };

    const result = await transitionDiscordAgeVerificationTransaction(
      transactionDatabase(tx),
      {
        verificationId: 'verification-id',
        nextStatus: 'verified',
        method: 'provider',
        is18Plus: true,
        actorUserId: 'reviewer-id',
      },
    );

    expect(result?.verification).toEqual(verification);
    expect(writes[0]?.values).toMatchObject({
      status: 'verified',
      method: 'provider',
      is18Plus: true,
    });
    expect(writes[0]?.values).not.toHaveProperty('providerReference');
    expect(writes[0]?.values).not.toHaveProperty('evidenceObjectReference');
    expect(writes[1]?.values).toMatchObject({
      previousStatus: 'pending',
      nextStatus: 'verified',
      actorUserId: 'reviewer-id',
    });
  });

  it('upserts analytics rollups on the constrained period key', async () => {
    const conflicts: Array<Record<string, unknown>> = [];
    const tx = {
      insert: vi.fn((table: unknown) => {
        expect(table).toBe(discordGuildAnalyticsSnapshotsTable);
        const builder: Record<string, unknown> = {};
        builder.values = () => builder;
        builder.onConflictDoUpdate = (conflict: Record<string, unknown>) => {
          conflicts.push(conflict);
          return builder;
        };
        builder.returning = () => Promise.resolve([{ id: 'snapshot-id' }]);
        return builder;
      }),
    };

    await expect(
      writeDiscordAnalyticsRollupTransaction(transactionDatabase(tx), {
        guild: {
          guildId: 'guild-id',
          granularity: 'daily',
          periodStart: new Date('2026-08-01T00:00:00Z'),
          periodEnd: new Date('2026-08-02T00:00:00Z'),
          messagesSent: 42,
        },
      }),
    ).resolves.toMatchObject({ guild: { id: 'snapshot-id' } });
    expect(conflicts[0]?.target).toHaveLength(3);
    expect(conflicts[0]?.set).toMatchObject({ messagesSent: 42 });
  });
});
