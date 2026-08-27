import { and, eq, isNull } from 'drizzle-orm';
import { UserLifecycleStatus, UserTier } from '@aerealith-ai/core';
import type { DatabaseClient } from '../../client';
import {
  discordAccountsTable,
  discordAgeVerificationsTable,
  discordUserSettingsTable,
  userAccountsTable,
  usersTable,
} from '../../schema';
import { toDiscordSnowflake } from '../../utils/discord';

export function discordAccountByDiscordId(discordUserId: string) {
  return eq(
    discordAccountsTable.discordUserId,
    toDiscordSnowflake(discordUserId),
  );
}
export function activeDiscordAccountByDiscordId(discordUserId: string) {
  return and(
    discordAccountByDiscordId(discordUserId),
    isNull(discordAccountsTable.deletedAt),
  );
}
export function discordAccountByConnectedAccountId(userAccountId: string) {
  return eq(discordAccountsTable.userAccountId, userAccountId);
}
export function discordAccountById(id: string) {
  return eq(discordAccountsTable.id, id);
}
export async function getDiscordAccountByCanonicalUserId(
  database: DatabaseClient,
  userId: string,
) {
  const [record] = await database
    .select({
      account: discordAccountsTable,
      connectedAccount: userAccountsTable,
    })
    .from(discordAccountsTable)
    .innerJoin(
      userAccountsTable,
      eq(discordAccountsTable.userAccountId, userAccountsTable.id),
    )
    .where(
      and(
        eq(userAccountsTable.userId, userId),
        isNull(discordAccountsTable.deletedAt),
      ),
    )
    .limit(1);
  return record ?? null;
}
export async function getDiscordLinkedCanonicalUser(
  database: DatabaseClient,
  discordUserId: string,
) {
  const [record] = await database
    .select({
      id: usersTable.id,
      username: usersTable.username,
      tier: usersTable.tier,
      status: usersTable.status,
    })
    .from(discordAccountsTable)
    .innerJoin(
      userAccountsTable,
      eq(discordAccountsTable.userAccountId, userAccountsTable.id),
    )
    .innerJoin(usersTable, eq(userAccountsTable.userId, usersTable.id))
    .where(activeDiscordAccountByDiscordId(discordUserId))
    .limit(1);
  return record ?? null;
}
export async function getDiscordUserSettings(
  database: DatabaseClient,
  discordAccountId: string,
) {
  const [record] = await database
    .select()
    .from(discordUserSettingsTable)
    .where(eq(discordUserSettingsTable.discordAccountId, discordAccountId))
    .limit(1);
  return record ?? null;
}

export async function getDiscordUserEntitlements(
  database: DatabaseClient,
  discordUserId: string,
) {
  const [record] = await database
    .select({
      tier: usersTable.tier,
      userStatus: usersTable.status,
      accountStatus: userAccountsTable.status,
      linkedActive: discordAccountsTable.isLinkedActive,
    })
    .from(discordAccountsTable)
    .innerJoin(
      userAccountsTable,
      eq(discordAccountsTable.userAccountId, userAccountsTable.id),
    )
    .innerJoin(usersTable, eq(userAccountsTable.userId, usersTable.id))
    .where(activeDiscordAccountByDiscordId(discordUserId))
    .limit(1);
  const active =
    record?.linkedActive === true &&
    record.accountStatus === 'active' &&
    record.userStatus === UserLifecycleStatus.Active;
  const tier = record?.tier ?? UserTier.Basic;
  const subscribed = active && tier !== UserTier.Basic;
  return {
    source: 'canonical_user_tier' as const,
    linked: record !== undefined,
    active,
    subscribed,
    tier,
    trial: false,
    gracePeriod: false,
    currentPeriodEnd: null,
    features: subscribed ? discordFeaturesForTier(tier) : [],
  };
}
export async function isDiscordUserSubscribed(
  database: DatabaseClient,
  discordUserId: string,
) {
  return (await getDiscordUserEntitlements(database, discordUserId)).subscribed;
}
export async function getDiscordUserSubscriptionTier(
  database: DatabaseClient,
  discordUserId: string,
) {
  return (await getDiscordUserEntitlements(database, discordUserId)).tier;
}
export const hasDiscordPersonalPremiumAccess = isDiscordUserSubscribed;
export async function getDiscordAgeVerificationState(
  database: DatabaseClient,
  discordUserId: string,
) {
  const [record] = await database
    .select({
      status: discordAgeVerificationsTable.status,
      is18Plus: discordAgeVerificationsTable.is18Plus,
      method: discordAgeVerificationsTable.method,
      verifiedAt: discordAgeVerificationsTable.verifiedAt,
      expiresAt: discordAgeVerificationsTable.expiresAt,
    })
    .from(discordAgeVerificationsTable)
    .innerJoin(
      discordAccountsTable,
      eq(
        discordAgeVerificationsTable.discordAccountId,
        discordAccountsTable.id,
      ),
    )
    .where(activeDiscordAccountByDiscordId(discordUserId))
    .limit(1);
  if (!record) return null;
  return {
    ...record,
    valid:
      record.status === 'verified' &&
      record.is18Plus &&
      (!record.expiresAt || record.expiresAt > new Date()),
  };
}
function discordFeaturesForTier(tier: string): string[] {
  const features = [
    'premium_commands',
    'personal_ai_memory',
    'saved_music_playlists',
  ];
  if (
    [
      UserTier.Premium,
      UserTier.PremiumPlus,
      UserTier.Pro,
      UserTier.ProPlus,
    ].includes(tier as never)
  )
    features.push('ai_voice', 'cross_guild_personalization');
  if ([UserTier.Pro, UserTier.ProPlus].includes(tier as never))
    features.push('priority_ai', 'advanced_analytics');
  return features;
}
