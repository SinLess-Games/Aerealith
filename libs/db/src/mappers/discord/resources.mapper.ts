import type {
  NewDiscordChannelRow,
  NewDiscordGuildMemberRow,
  NewDiscordRoleRow,
} from '../../schema';
import {
  discordSnowflakeCreatedAt,
  toDiscordSnowflake,
} from '../../utils/discord';

export type DiscordMemberTransport = {
  user: { id: string; bot?: boolean };
  nick?: string | null;
  avatar?: string | null;
  banner?: string | null;
  joinedAt?: string | Date | null;
  premiumSince?: string | Date | null;
  pending?: boolean;
  flags?: string | bigint;
  mute?: boolean;
  deaf?: boolean;
  communicationDisabledUntil?: string | Date | null;
};
export function toDiscordGuildMemberInsert(
  guildId: string,
  accountId: string,
  member: DiscordMemberTransport,
  now = new Date(),
): NewDiscordGuildMemberRow {
  return {
    guildId,
    discordAccountId: accountId,
    discordUserId: toDiscordSnowflake(member.user.id),
    nickname: normalize(member.nick),
    guildAvatarHash: normalize(member.avatar),
    guildProfileMetadata: member.banner ? { bannerHash: member.banner } : {},
    joinedAt: dateOrNull(member.joinedAt),
    firstSeenAt: now,
    lastSeenAt: now,
    premiumSince: dateOrNull(member.premiumSince),
    pending: member.pending ?? false,
    flags: String(member.flags ?? 0),
    serverMuted: member.mute ?? false,
    serverDeafened: member.deaf ?? false,
    communicationDisabledUntil: dateOrNull(member.communicationDisabledUntil),
    status: 'active',
    isBot: member.user.bot ?? false,
    isPresent: true,
    lastSyncedAt: now,
  };
}
export type DiscordRoleTransport = {
  id: string;
  name: string;
  position?: number;
  color?: number;
  hoist?: boolean;
  managed?: boolean;
  mentionable?: boolean;
  permissions?: string | bigint;
  icon?: string | null;
  unicodeEmoji?: string | null;
  tags?: Record<string, unknown> | null;
  flags?: string | bigint;
};
export function toDiscordRoleInsert(
  guildId: string,
  role: DiscordRoleTransport,
  now = new Date(),
): NewDiscordRoleRow {
  return {
    guildId,
    discordRoleId: toDiscordSnowflake(role.id),
    name: role.name.trim(),
    position: role.position ?? 0,
    color: role.color ?? 0,
    hoisted: role.hoist ?? false,
    managed: role.managed ?? false,
    mentionable: role.mentionable ?? false,
    permissions: String(role.permissions ?? 0),
    iconHash: normalize(role.icon),
    unicodeEmoji: normalize(role.unicodeEmoji),
    tags: role.tags ?? {},
    flags: String(role.flags ?? 0),
    firstSeenAt: now,
    lastSyncedAt: now,
  };
}
export type DiscordChannelTransport = {
  id: string;
  type: number;
  parentId?: string | null;
  name?: string | null;
  position?: number;
  topic?: string | null;
  nsfw?: boolean;
  rateLimitPerUser?: number;
  defaultAutoArchiveDuration?: number | null;
  lastMessageId?: string | null;
  bitrate?: number | null;
  userLimit?: number | null;
  rtcRegion?: string | null;
  videoQualityMode?: number | null;
  defaultReactionEmoji?: Record<string, unknown> | null;
  defaultThreadRateLimitPerUser?: number | null;
  defaultSortOrder?: number | null;
  defaultForumLayout?: number | null;
  availableTags?: Array<{
    id: string;
    name: string;
    moderated: boolean;
    emojiId?: string;
    emojiName?: string;
  }>;
  flags?: string | bigint;
};
export function toDiscordChannelInsert(
  guildId: string,
  channel: DiscordChannelTransport,
  now = new Date(),
): NewDiscordChannelRow {
  return {
    guildId,
    discordChannelId: toDiscordSnowflake(channel.id),
    parentDiscordChannelId: channel.parentId
      ? toDiscordSnowflake(channel.parentId)
      : null,
    channelType: channel.type,
    name: normalize(channel.name),
    position: channel.position ?? 0,
    topic: normalize(channel.topic),
    nsfw: channel.nsfw ?? false,
    rateLimitPerUserSeconds: channel.rateLimitPerUser ?? 0,
    defaultAutoArchiveMinutes: channel.defaultAutoArchiveDuration ?? null,
    lastMessageDiscordId: channel.lastMessageId
      ? toDiscordSnowflake(channel.lastMessageId)
      : null,
    bitrate: channel.bitrate ?? null,
    userLimit: channel.userLimit ?? null,
    rtcRegion: normalize(channel.rtcRegion),
    videoQualityMode: channel.videoQualityMode ?? null,
    defaultReactionEmoji: channel.defaultReactionEmoji ?? null,
    defaultThreadRateLimitSeconds:
      channel.defaultThreadRateLimitPerUser ?? null,
    defaultSortOrder: channel.defaultSortOrder ?? null,
    defaultForumLayout: channel.defaultForumLayout ?? null,
    availableTags: channel.availableTags ?? [],
    flags: String(channel.flags ?? 0),
    firstSeenAt: now,
    lastSyncedAt: now,
  };
}
export type DiscordEmojiTransport = {
  id: string;
  name?: string | null;
  animated?: boolean;
  available?: boolean;
  managed?: boolean;
  requireColons?: boolean;
  roles?: string[];
};
export type DiscordStickerTransport = {
  id: string;
  name: string;
  description?: string | null;
  tags?: string | null;
  type: number;
  formatType: number;
  available?: boolean;
};
export type DiscordScheduledEventTransport = {
  id: string;
  name: string;
  description?: string | null;
  scheduledStartTime: string | Date;
  scheduledEndTime?: string | Date | null;
  privacyLevel: number;
  status: number;
  entityType: number;
  entityMetadata?: Record<string, unknown>;
  image?: string | null;
  userCount?: number;
};
export type DiscordAutomodRuleTransport = {
  id: string;
  name: string;
  eventType: number;
  triggerType: number;
  triggerMetadata?: Record<string, unknown>;
  actions?: Record<string, unknown>[];
  enabled?: boolean;
  exemptRoles?: string[];
  exemptChannels?: string[];
};
export type DiscordAuditLogEntryTransport = {
  id: string;
  targetId?: string | null;
  targetType?: string | null;
  actionType: number;
  reason?: string | null;
  changes?: Record<string, unknown>[];
  options?: Record<string, unknown>;
};
export function mapDiscordEmoji(guildId: string, value: DiscordEmojiTransport) {
  return {
    guildId,
    discordEmojiId: toDiscordSnowflake(value.id),
    name: normalize(value.name),
    animated: value.animated ?? false,
    available: value.available ?? true,
    managed: value.managed ?? false,
    requireColons: value.requireColons ?? true,
    restrictedRoleDiscordIds: (value.roles ?? []).map(toDiscordSnowflake),
  };
}
export function mapDiscordSticker(
  guildId: string,
  value: DiscordStickerTransport,
) {
  return {
    guildId,
    discordStickerId: toDiscordSnowflake(value.id),
    name: value.name.trim(),
    description: normalize(value.description),
    tags: normalize(value.tags),
    stickerType: value.type,
    formatType: value.formatType,
    available: value.available ?? true,
  };
}
export function mapDiscordScheduledEvent(
  guildId: string,
  value: DiscordScheduledEventTransport,
) {
  return {
    guildId,
    discordEventId: toDiscordSnowflake(value.id),
    name: value.name.trim(),
    description: normalize(value.description),
    scheduledStartAt: date(value.scheduledStartTime),
    scheduledEndAt: dateOrNull(value.scheduledEndTime),
    privacyLevel: value.privacyLevel,
    status: value.status,
    entityType: value.entityType,
    entityMetadata: value.entityMetadata ?? {},
    imageHash: normalize(value.image),
    interestedUserCount: value.userCount ?? 0,
  };
}
export function mapDiscordAutomodRule(
  guildId: string,
  value: DiscordAutomodRuleTransport,
) {
  return {
    guildId,
    discordRuleId: toDiscordSnowflake(value.id),
    name: value.name.trim(),
    eventType: value.eventType,
    triggerType: value.triggerType,
    triggerMetadata: value.triggerMetadata ?? {},
    actions: value.actions ?? [],
    enabled: value.enabled ?? true,
    exemptRoleDiscordIds: (value.exemptRoles ?? []).map(toDiscordSnowflake),
    exemptChannelDiscordIds: (value.exemptChannels ?? []).map(
      toDiscordSnowflake,
    ),
  };
}
export function mapDiscordAuditLogEntry(
  guildId: string,
  value: DiscordAuditLogEntryTransport,
) {
  return {
    guildId,
    discordEntryId: toDiscordSnowflake(value.id),
    targetDiscordId: value.targetId ? toDiscordSnowflake(value.targetId) : null,
    targetType: normalize(value.targetType),
    actionType: value.actionType,
    reason: normalize(value.reason),
    changes: value.changes ?? [],
    options: value.options ?? {},
    discordCreatedAt: discordSnowflakeCreatedAt(value.id),
  };
}
function normalize(value: string | null | undefined): string | null {
  return value?.trim() || null;
}
function date(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}
function dateOrNull(value: string | Date | null | undefined): Date | null {
  return value ? date(value) : null;
}
