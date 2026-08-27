import type { NewDiscordGuildRow } from '../../schema';
import {
  discordSnowflakeCreatedAt,
  toDiscordSnowflake,
} from '../../utils/discord';

export type DiscordGuildTransport = {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  icon?: string | null;
  banner?: string | null;
  splash?: string | null;
  discoverySplash?: string | null;
  vanityUrlCode?: string | null;
  preferredLocale?: string | null;
  features?: string[];
  unavailable?: boolean;
  verificationLevel?: number;
  defaultMessageNotifications?: number;
  explicitContentFilter?: number;
  mfaLevel?: number;
  nsfwLevel?: number;
  premiumTier?: number;
  premiumSubscriptionCount?: number;
  premiumProgressBarEnabled?: boolean;
  maxMembers?: number | null;
  maxPresences?: number | null;
  maxVideoChannelUsers?: number | null;
  maxStageVideoChannelUsers?: number | null;
  approximateMemberCount?: number | null;
  approximatePresenceCount?: number | null;
  afkChannelId?: string | null;
  afkTimeout?: number | null;
  systemChannelId?: string | null;
  rulesChannelId?: string | null;
  publicUpdatesChannelId?: string | null;
  safetyAlertsChannelId?: string | null;
  widgetEnabled?: boolean;
  widgetChannelId?: string | null;
  applicationId?: string | null;
};
export function toDiscordGuildInsert(
  guild: DiscordGuildTransport,
  now = new Date(),
): NewDiscordGuildRow {
  const features = [...new Set(guild.features ?? [])];
  return {
    discordGuildId: toDiscordSnowflake(guild.id),
    name: guild.name.trim(),
    description: normalize(guild.description),
    ownerDiscordUserId: toDiscordSnowflake(guild.ownerId),
    iconHash: normalize(guild.icon),
    bannerHash: normalize(guild.banner),
    splashHash: normalize(guild.splash),
    discoverySplashHash: normalize(guild.discoverySplash),
    vanityUrlCode: normalize(guild.vanityUrlCode),
    preferredLocale: normalize(guild.preferredLocale),
    discordCreatedAt: discordSnowflakeCreatedAt(guild.id),
    firstSeenAt: now,
    lastSyncedAt: now,
    isAvailable: !(guild.unavailable ?? false),
    isDiscordUnavailable: guild.unavailable ?? false,
    verificationLevel: guild.verificationLevel ?? 0,
    defaultNotificationLevel: guild.defaultMessageNotifications ?? 0,
    explicitContentFilter: guild.explicitContentFilter ?? 0,
    mfaLevel: guild.mfaLevel ?? 0,
    nsfwLevel: guild.nsfwLevel ?? 0,
    premiumTier: guild.premiumTier ?? 0,
    premiumSubscriptionCount: guild.premiumSubscriptionCount ?? 0,
    premiumProgressBarEnabled: guild.premiumProgressBarEnabled ?? false,
    maxMembers: guild.maxMembers ?? null,
    maxPresences: guild.maxPresences ?? null,
    maxVideoChannelUsers: guild.maxVideoChannelUsers ?? null,
    maxStageVideoChannelUsers: guild.maxStageVideoChannelUsers ?? null,
    approximateMemberCount: guild.approximateMemberCount ?? null,
    approximatePresenceCount: guild.approximatePresenceCount ?? null,
    afkChannelDiscordId: snowflakeOrNull(guild.afkChannelId),
    afkTimeoutSeconds: guild.afkTimeout ?? null,
    systemChannelDiscordId: snowflakeOrNull(guild.systemChannelId),
    rulesChannelDiscordId: snowflakeOrNull(guild.rulesChannelId),
    publicUpdatesChannelDiscordId: snowflakeOrNull(
      guild.publicUpdatesChannelId,
    ),
    safetyAlertsChannelDiscordId: snowflakeOrNull(guild.safetyAlertsChannelId),
    widgetEnabled: guild.widgetEnabled ?? false,
    widgetChannelDiscordId: snowflakeOrNull(guild.widgetChannelId),
    applicationDiscordId: snowflakeOrNull(guild.applicationId),
    isPartnered: features.includes('PARTNERED'),
    isVerified: features.includes('VERIFIED'),
    isCommunity: features.includes('COMMUNITY'),
    isDiscoverable: features.includes('DISCOVERABLE'),
    welcomeScreenEnabled: features.includes('WELCOME_SCREEN_ENABLED'),
    discordFeatures: features,
  };
}
function normalize(value: string | null | undefined): string | null {
  return value?.trim() || null;
}
function snowflakeOrNull(value: string | null | undefined): string | null {
  return value ? toDiscordSnowflake(value) : null;
}
