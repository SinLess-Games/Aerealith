import type { NewDiscordAccountRow } from '../../schema';
import { toDiscordSnowflake } from '../../utils/discord';

export type DiscordUserTransport = {
  id: string;
  username: string;
  globalName?: string | null;
  discriminator?: string | null;
  avatar?: string | null;
  avatarDecorationData?: Record<string, unknown> | null;
  banner?: string | null;
  accentColor?: number | null;
  bot?: boolean;
  system?: boolean;
  publicFlags?: string | bigint | null;
  flags?: string | bigint | null;
  locale?: string | null;
};
export function toDiscordAccountInsert(
  user: DiscordUserTransport,
  now = new Date(),
): NewDiscordAccountRow {
  return {
    discordUserId: toDiscordSnowflake(user.id),
    username: user.username.trim(),
    globalDisplayName: normalize(user.globalName),
    discriminator: normalize(user.discriminator),
    avatarHash: normalize(user.avatar),
    avatarDecoration: user.avatarDecorationData ?? null,
    bannerHash: normalize(user.banner),
    accentColor: user.accentColor ?? null,
    isBot: user.bot ?? false,
    isSystem: user.system ?? false,
    publicFlags: String(user.publicFlags ?? 0),
    userFlags: user.flags == null ? null : String(user.flags),
    locale: normalize(user.locale),
    firstSeenAt: now,
    lastSeenAt: now,
    lastSyncedAt: now,
  };
}
function normalize(value: string | null | undefined): string | null {
  return value?.trim() || null;
}
