import type { DatabaseClient } from '../../src/client';
import { and, eq } from 'drizzle-orm';
import {
  discordAccountsTable,
  discordAgeVerificationsTable,
  discordAiSessionsTable,
  discordChannelsTable,
  discordForumPostStateTable,
  discordGuildAnalyticsSnapshotsTable,
  discordGuildMemberRolesTable,
  discordGuildMembersTable,
  discordGuildModulesTable,
  discordGuildSettingsTable,
  discordGuildsTable,
  discordMessagesTable,
  discordModerationCasesTable,
  discordMusicSessionsTable,
  discordMusicTracksTable,
  discordPersonaProxyPatternsTable,
  discordPersonasTable,
  discordProxiedMessagesTable,
  discordRolesTable,
  discordScheduledActionsTable,
  discordThreadsTable,
  discordTicketsTable,
  discordVoiceSessionsTable,
  userAccountsTable,
  usersTable,
} from '../../src/schema';
import type { DatabaseTransaction } from '../../src/transactions';

const SNOWFLAKES = {
  linked: '100000000000000001',
  guest: '100000000000000002',
  guild: '200000000000000001',
  category: '300000000000000001',
  general: '300000000000000002',
  voice: '300000000000000003',
  forum: '300000000000000004',
  thread: '300000000000000005',
  everyone: '400000000000000001',
  moderator: '400000000000000002',
  member: '400000000000000003',
  proxyMessage: '500000000000000001',
} as const;

/** Opt-in, idempotent, synthetic development/preview data. */
export async function seedDiscordDevelopment(
  database: DatabaseClient,
): Promise<void> {
  if (process.env['ALLOW_DISCORD_DEVELOPMENT_SEED'] !== 'true') {
    throw new Error(
      'Set ALLOW_DISCORD_DEVELOPMENT_SEED=true to seed fake Discord data.',
    );
  }
  await database.transaction(async (tx) => {
    const canonical = await tx
      .select({ id: usersTable.id })
      .from(usersTable)
      .limit(1)
      .then((rows) => rows[0]);
    let userAccountId: string | null = null;
    if (canonical) {
      const [connected] = await tx
        .insert(userAccountsTable)
        .values({
          userId: canonical.id,
          provider: 'discord',
          accountId: SNOWFLAKES.linked,
          displayName: 'Aerealith Developer',
          status: 'active',
        })
        .onConflictDoUpdate({
          target: [userAccountsTable.provider, userAccountsTable.accountId],
          set: { userId: canonical.id, status: 'active', deletedAt: null },
        })
        .returning();
      userAccountId = connected?.id ?? null;
    }
    const linked = await upsertAccount(
      tx,
      SNOWFLAKES.linked,
      'aerealith_dev',
      userAccountId,
    );
    const guest = await upsertAccount(
      tx,
      SNOWFLAKES.guest,
      'discord_guest',
      null,
    );
    const [guild] = await tx
      .insert(discordGuildsTable)
      .values({
        discordGuildId: SNOWFLAKES.guild,
        name: 'Aerealith Development Guild',
        description: 'Synthetic Discord data-layer guild.',
        ownerDiscordUserId: SNOWFLAKES.linked,
        ownerAccountId: linked.id,
        botJoinedAt: new Date('2026-01-01T00:00:00Z'),
        isCommunity: true,
        isDiscoverable: true,
        discordFeatures: ['COMMUNITY', 'DISCOVERABLE'],
      })
      .onConflictDoUpdate({
        target: discordGuildsTable.discordGuildId,
        set: {
          ownerAccountId: linked.id,
          isBotInstalled: true,
          deletedAt: null,
        },
      })
      .returning();
    if (!guild) throw new Error('Failed to seed Discord guild.');
    await tx
      .insert(discordGuildSettingsTable)
      .values({ guildId: guild.id })
      .onConflictDoNothing({ target: discordGuildSettingsTable.guildId });
    for (const moduleKey of [
      'moderation',
      'analytics',
      'tickets',
      'music',
      'ai_chat',
      'personas',
    ]) {
      await tx
        .insert(discordGuildModulesTable)
        .values({ guildId: guild.id, moduleKey, enabled: true })
        .onConflictDoUpdate({
          target: [
            discordGuildModulesTable.guildId,
            discordGuildModulesTable.moduleKey,
          ],
          set: { enabled: true },
        });
    }
    const category = await upsertChannel(
      tx,
      guild.id,
      SNOWFLAKES.category,
      4,
      'Community',
      null,
    );
    const general = await upsertChannel(
      tx,
      guild.id,
      SNOWFLAKES.general,
      0,
      'general',
      category.id,
    );
    const voice = await upsertChannel(
      tx,
      guild.id,
      SNOWFLAKES.voice,
      2,
      'Lounge',
      category.id,
    );
    const forum = await upsertChannel(
      tx,
      guild.id,
      SNOWFLAKES.forum,
      15,
      'help-forum',
      category.id,
    );
    const threadChannel = await upsertChannel(
      tx,
      guild.id,
      SNOWFLAKES.thread,
      11,
      'How do I configure Aerealith?',
      forum.id,
    );
    const [thread] = await tx
      .insert(discordThreadsTable)
      .values({
        channelId: threadChannel.id,
        parentChannelId: forum.id,
        ownerAccountId: linked.id,
        threadType: 11,
        autoArchiveDurationMinutes: 1440,
        threadCreatedAt: new Date('2026-08-20T12:00:00Z'),
        messageCount: 3,
        memberCount: 2,
        totalMessagesSent: 3,
      })
      .onConflictDoUpdate({
        target: discordThreadsTable.channelId,
        set: { messageCount: 3 },
      })
      .returning();
    if (thread)
      await tx
        .insert(discordForumPostStateTable)
        .values({
          forumChannelId: forum.id,
          threadId: thread.id,
          authorAccountId: linked.id,
          createdAt: new Date('2026-08-20T12:00:00Z'),
          replyCount: 2,
          participantCount: 2,
        })
        .onConflictDoNothing({ target: discordForumPostStateTable.threadId });
    const everyone = await upsertRole(
      tx,
      guild.id,
      SNOWFLAKES.everyone,
      '@everyone',
      0,
      '0',
    );
    const moderator = await upsertRole(
      tx,
      guild.id,
      SNOWFLAKES.moderator,
      'Moderator',
      2,
      '8',
    );
    const memberRole = await upsertRole(
      tx,
      guild.id,
      SNOWFLAKES.member,
      'Member',
      1,
      '1024',
    );
    const linkedMember = await upsertMember(
      tx,
      guild.id,
      linked.id,
      SNOWFLAKES.linked,
      'Aerealith Dev',
    );
    const guestMember = await upsertMember(
      tx,
      guild.id,
      guest.id,
      SNOWFLAKES.guest,
      'Guest',
    );
    for (const [memberId, roleId] of [
      [linkedMember.id, everyone.id],
      [linkedMember.id, moderator.id],
      [guestMember.id, everyone.id],
      [guestMember.id, memberRole.id],
    ]) {
      await tx
        .insert(discordGuildMemberRolesTable)
        .values({ memberId, roleId, source: 'discord' })
        .onConflictDoUpdate({
          target: [
            discordGuildMemberRolesTable.memberId,
            discordGuildMemberRolesTable.roleId,
          ],
          set: { active: true, removedAt: null },
        });
    }
    await tx
      .insert(discordModerationCasesTable)
      .values({
        guildId: guild.id,
        caseNumber: 1,
        targetAccountId: guest.id,
        targetMemberId: guestMember.id,
        moderatorAccountId: linked.id,
        action: 'warning',
        reason: 'Synthetic development warning.',
      })
      .onConflictDoNothing({
        target: [
          discordModerationCasesTable.guildId,
          discordModerationCasesTable.caseNumber,
        ],
      });
    await tx
      .insert(discordTicketsTable)
      .values({
        guildId: guild.id,
        ticketNumber: 1,
        creatorAccountId: guest.id,
        assignedStaffAccountId: linked.id,
        channelId: general.id,
        status: 'claimed',
        subject: 'Synthetic development ticket',
      })
      .onConflictDoNothing({
        target: [discordTicketsTable.guildId, discordTicketsTable.ticketNumber],
      });
    const [persona] = await tx
      .insert(discordPersonasTable)
      .values({
        ownerAccountId: linked.id,
        name: 'Aerealith Guide',
        description: 'Synthetic proxy persona.',
      })
      .onConflictDoUpdate({
        target: [
          discordPersonasTable.ownerAccountId,
          discordPersonasTable.name,
        ],
        set: { status: 'active', deletedAt: null },
      })
      .returning();
    if (persona) {
      await tx
        .insert(discordPersonaProxyPatternsTable)
        .values({ personaId: persona.id, prefix: '[', suffix: ']' })
        .onConflictDoNothing({
          target: [
            discordPersonaProxyPatternsTable.personaId,
            discordPersonaProxyPatternsTable.prefix,
            discordPersonaProxyPatternsTable.suffix,
          ],
        });
      const [message] = await tx
        .insert(discordMessagesTable)
        .values({
          discordMessageId: SNOWFLAKES.proxyMessage,
          guildId: guild.id,
          channelId: general.id,
          authorAccountId: linked.id,
          messageType: 0,
          discordCreatedAt: new Date('2026-08-23T12:00:00Z'),
          isProxied: true,
        })
        .onConflictDoUpdate({
          target: discordMessagesTable.discordMessageId,
          set: { isProxied: true },
        })
        .returning();
      await tx
        .insert(discordProxiedMessagesTable)
        .values({
          guildId: guild.id,
          channelId: general.id,
          originalAuthorAccountId: linked.id,
          personaId: persona.id,
          resultingMessageId: message?.id,
          resultingDiscordMessageId: SNOWFLAKES.proxyMessage,
        })
        .onConflictDoUpdate({
          target: discordProxiedMessagesTable.resultingDiscordMessageId,
          set: { personaId: persona.id, deletedAt: null },
        });
    }
    const sessionStartedAt = new Date('2026-08-23T18:00:00Z');
    const existingVoiceSession = await tx
      .select({ id: discordVoiceSessionsTable.id })
      .from(discordVoiceSessionsTable)
      .where(
        and(
          eq(discordVoiceSessionsTable.guildId, guild.id),
          eq(discordVoiceSessionsTable.memberId, linkedMember.id),
          eq(discordVoiceSessionsTable.startedAt, sessionStartedAt),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]);
    if (!existingVoiceSession) {
      await tx.insert(discordVoiceSessionsTable).values({
        guildId: guild.id,
        memberId: linkedMember.id,
        channelId: voice.id,
        sessionType: 'voice',
        startedAt: sessionStartedAt,
        endedAt: new Date('2026-08-23T18:45:00Z'),
        durationSeconds: 2700,
      });
    }
    const existingMusicSession = await tx
      .select({ id: discordMusicSessionsTable.id })
      .from(discordMusicSessionsTable)
      .where(
        and(
          eq(discordMusicSessionsTable.guildId, guild.id),
          eq(discordMusicSessionsTable.startedAt, sessionStartedAt),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]);
    const music =
      existingMusicSession ??
      (await tx
        .insert(discordMusicSessionsTable)
        .values({
          guildId: guild.id,
          voiceChannelId: voice.id,
          controlChannelId: general.id,
          initiatedByAccountId: linked.id,
          startedAt: sessionStartedAt,
          endedAt: new Date('2026-08-23T18:04:00Z'),
          durationSeconds: 240,
          trackCount: 1,
          uniqueListenerCount: 2,
        })
        .returning({ id: discordMusicSessionsTable.id })
        .then((rows) => rows[0]));
    if (music) {
      const existingTrack = await tx
        .select({ id: discordMusicTracksTable.id })
        .from(discordMusicTracksTable)
        .where(
          and(
            eq(discordMusicTracksTable.sessionId, music.id),
            eq(discordMusicTracksTable.trackReference, 'synthetic-track'),
          ),
        )
        .limit(1)
        .then((rows) => rows[0]);
      if (!existingTrack) {
        await tx.insert(discordMusicTracksTable).values({
          guildId: guild.id,
          sessionId: music.id,
          requestedByAccountId: linked.id,
          trackReference: 'synthetic-track',
          title: 'Synthetic Song',
          author: 'Example Artist',
          source: 'development',
          endReason: 'finished',
        });
      }
    }
    await tx
      .insert(discordAiSessionsTable)
      .values({
        guildId: guild.id,
        channelId: general.id,
        accountId: linked.id,
        aerealithSessionReference: 'development-ai-session',
        sessionType: 'text',
        provider: 'development',
        model: 'synthetic-model',
      })
      .onConflictDoUpdate({
        target: discordAiSessionsTable.aerealithSessionReference,
        set: { guildId: guild.id },
      });
    await upsertVerification(
      tx,
      linked.id,
      'verified',
      true,
      new Date('2026-08-01T00:00:00Z'),
    );
    await upsertVerification(tx, guest.id, 'pending', false, null);
    const reminderExecuteAt = new Date('2027-01-01T00:00:00Z');
    const existingReminder = await tx
      .select({ id: discordScheduledActionsTable.id })
      .from(discordScheduledActionsTable)
      .where(
        and(
          eq(discordScheduledActionsTable.guildId, guild.id),
          eq(discordScheduledActionsTable.accountId, linked.id),
          eq(discordScheduledActionsTable.actionType, 'user_reminder'),
          eq(discordScheduledActionsTable.executeAt, reminderExecuteAt),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]);
    if (!existingReminder) {
      await tx.insert(discordScheduledActionsTable).values({
        guildId: guild.id,
        accountId: linked.id,
        actionType: 'user_reminder',
        executeAt: reminderExecuteAt,
        payload: { message: 'Synthetic reminder' },
      });
    }
    for (const day of ['2026-08-22', '2026-08-23', '2026-08-24']) {
      const start = new Date(`${day}T00:00:00Z`),
        end = new Date(start.getTime() + 86_400_000);
      await tx
        .insert(discordGuildAnalyticsSnapshotsTable)
        .values({
          guildId: guild.id,
          granularity: 'daily',
          periodStart: start,
          periodEnd: end,
          totalMembers: 2,
          humanMembers: 2,
          activeMembers: 2,
          messagesSent: 24,
          uniqueMessageAuthors: 2,
          voiceSessions: 1,
          uniqueVoiceUsers: 1,
          voiceMinutes: 45,
          musicSessions: 1,
          songsPlayed: 1,
          aiInteractions: 3,
          uniqueAiUsers: 1,
          commandsExecuted: 6,
          successfulCommands: 6,
        })
        .onConflictDoUpdate({
          target: [
            discordGuildAnalyticsSnapshotsTable.guildId,
            discordGuildAnalyticsSnapshotsTable.granularity,
            discordGuildAnalyticsSnapshotsTable.periodStart,
          ],
          set: { totalMembers: 2, messagesSent: 24 },
        });
    }
  });
}

async function upsertAccount(
  tx: DatabaseTransaction,
  discordUserId: string,
  username: string,
  userAccountId: string | null,
) {
  const [row] = await tx
    .insert(discordAccountsTable)
    .values({
      discordUserId,
      username,
      userAccountId,
      isLinkedActive: userAccountId !== null,
    })
    .onConflictDoUpdate({
      target: discordAccountsTable.discordUserId,
      set: {
        username,
        userAccountId,
        isLinkedActive: userAccountId !== null,
        deletedAt: null,
      },
    })
    .returning();
  if (!row) throw new Error('Failed to seed Discord account.');
  return row;
}
async function upsertChannel(
  tx: DatabaseTransaction,
  guildId: string,
  discordChannelId: string,
  channelType: number,
  name: string,
  parentChannelId: string | null,
) {
  const [row] = await tx
    .insert(discordChannelsTable)
    .values({ guildId, discordChannelId, channelType, name, parentChannelId })
    .onConflictDoUpdate({
      target: discordChannelsTable.discordChannelId,
      set: { name, parentChannelId, deletedAt: null },
    })
    .returning();
  if (!row) throw new Error('Failed to seed Discord channel.');
  return row;
}
async function upsertRole(
  tx: DatabaseTransaction,
  guildId: string,
  discordRoleId: string,
  name: string,
  position: number,
  permissions: string,
) {
  const [row] = await tx
    .insert(discordRolesTable)
    .values({ guildId, discordRoleId, name, position, permissions })
    .onConflictDoUpdate({
      target: discordRolesTable.discordRoleId,
      set: { name, position, permissions, deletedAt: null },
    })
    .returning();
  if (!row) throw new Error('Failed to seed Discord role.');
  return row;
}
async function upsertMember(
  tx: DatabaseTransaction,
  guildId: string,
  discordAccountId: string,
  discordUserId: string,
  nickname: string,
) {
  const [row] = await tx
    .insert(discordGuildMembersTable)
    .values({
      guildId,
      discordAccountId,
      discordUserId,
      nickname,
      joinedAt: new Date('2026-01-01T00:00:00Z'),
    })
    .onConflictDoUpdate({
      target: [
        discordGuildMembersTable.guildId,
        discordGuildMembersTable.discordAccountId,
      ],
      set: { nickname, status: 'active', isPresent: true, leftAt: null },
    })
    .returning();
  if (!row) throw new Error('Failed to seed Discord member.');
  return row;
}
async function upsertVerification(
  tx: DatabaseTransaction,
  discordAccountId: string,
  status: 'verified' | 'pending',
  is18Plus: boolean,
  verifiedAt: Date | null,
) {
  const [row] = await tx
    .insert(discordAgeVerificationsTable)
    .values({
      discordAccountId,
      status,
      is18Plus,
      method: 'provider',
      provider: 'development-provider',
      providerReference: `dev-${discordAccountId}`,
      attemptCount: 1,
      verifiedAt,
    })
    .onConflictDoUpdate({
      target: discordAgeVerificationsTable.discordAccountId,
      set: { status, is18Plus, verifiedAt },
    })
    .returning();
  if (!row) throw new Error('Failed to seed age verification.');
  return row;
}
