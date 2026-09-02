import { pgEnum } from 'drizzle-orm/pg-core';

export const DiscordMembershipStatus = {
  Active: 'active',
  Left: 'left',
  Kicked: 'kicked',
  Banned: 'banned',
  Unavailable: 'unavailable',
  Unknown: 'unknown',
} as const;
export const DiscordAgeVerificationStatus = {
  Unverified: 'unverified',
  Pending: 'pending',
  Verified: 'verified',
  Rejected: 'rejected',
  Expired: 'expired',
  Revoked: 'revoked',
  NeedsReview: 'needs_review',
} as const;
export const DiscordAgeVerificationMethod = {
  Provider: 'provider',
  Manual: 'manual',
  AccountAttestation: 'account_attestation',
  GovernmentId: 'government_id',
  PaymentMethod: 'payment_method',
  Other: 'other',
} as const;
export const DiscordRoleAssignmentSource = {
  Discord: 'discord',
  Moderator: 'moderator',
  Autorole: 'autorole',
  ReactionRole: 'reaction_role',
  ButtonRole: 'button_role',
  Automation: 'automation',
  Subscription: 'subscription',
  Leveling: 'leveling',
  TemporaryRole: 'temporary_role',
} as const;
export const DiscordModerationAction = {
  Warning: 'warning',
  Strike: 'strike',
  Note: 'note',
  Timeout: 'timeout',
  Mute: 'mute',
  Unmute: 'unmute',
  Kick: 'kick',
  Ban: 'ban',
  TemporaryBan: 'temporary_ban',
  Unban: 'unban',
  Softban: 'softban',
  Purge: 'purge',
  ChannelLockdown: 'channel_lockdown',
  RoleAction: 'role_action',
  NicknameAction: 'nickname_action',
  AutomodAction: 'automod_action',
  RaidResponse: 'raid_response',
  CustomAction: 'custom_action',
} as const;
export const DiscordModerationCaseStatus = {
  Open: 'open',
  Resolved: 'resolved',
  Reversed: 'reversed',
  Expired: 'expired',
} as const;
export const DiscordAppealStatus = {
  Pending: 'pending',
  Approved: 'approved',
  Denied: 'denied',
  Withdrawn: 'withdrawn',
} as const;
export const DiscordTicketStatus = {
  Open: 'open',
  Claimed: 'claimed',
  Closed: 'closed',
  Reopened: 'reopened',
  Archived: 'archived',
} as const;
export const DiscordTicketPriority = {
  Low: 'low',
  Normal: 'normal',
  High: 'high',
  Urgent: 'urgent',
} as const;
export const DiscordMusicTrackEndReason = {
  Finished: 'finished',
  LoadFailed: 'load_failed',
  Stopped: 'stopped',
  Replaced: 'replaced',
  Cleanup: 'cleanup',
  Skipped: 'skipped',
  Unknown: 'unknown',
} as const;
export const DiscordAiSessionType = {
  Text: 'text',
  Voice: 'voice',
  Moderation: 'moderation',
  Summarization: 'summarization',
} as const;
export const DiscordAnalyticsGranularity = {
  Hourly: 'hourly',
  Daily: 'daily',
  Weekly: 'weekly',
  Monthly: 'monthly',
} as const;
export const DiscordScheduledActionType = {
  UserReminder: 'user_reminder',
  GuildReminder: 'guild_reminder',
  ScheduledMessage: 'scheduled_message',
  ModerationAction: 'moderation_action',
  TemporaryRole: 'temporary_role',
  TemporaryBan: 'temporary_ban',
  TemporaryTimeout: 'temporary_timeout',
  Announcement: 'announcement',
} as const;
export const DiscordScheduledActionStatus = {
  Pending: 'pending',
  Running: 'running',
  Completed: 'completed',
  Failed: 'failed',
  Cancelled: 'cancelled',
} as const;
export const DiscordSyncStatus = {
  Pending: 'pending',
  Running: 'running',
  Succeeded: 'succeeded',
  Failed: 'failed',
  Stale: 'stale',
} as const;
export const DiscordCommandType = {
  Slash: 'slash',
  Prefix: 'prefix',
  UserContext: 'user_context',
  MessageContext: 'message_context',
} as const;
export const DiscordDataProvenance = {
  Discord: 'discord',
  Aerealith: 'aerealith',
  User: 'user',
  Moderator: 'moderator',
  Ai: 'ai',
  Analytics: 'analytics',
} as const;
export const DiscordProxyStatus = {
  Active: 'active',
  Disabled: 'disabled',
  Deleted: 'deleted',
} as const;

type Values<T extends Record<string, string>> = T[keyof T];
function enumValues<T extends Record<string, string>>(values: T) {
  return Object.values(values) as [Values<T>, ...Values<T>[]];
}

export const discordMembershipStatusDbEnum = pgEnum(
  'discord_membership_status',
  enumValues(DiscordMembershipStatus),
);
export const discordAgeVerificationStatusDbEnum = pgEnum(
  'discord_age_verification_status',
  enumValues(DiscordAgeVerificationStatus),
);
export const discordAgeVerificationMethodDbEnum = pgEnum(
  'discord_age_verification_method',
  enumValues(DiscordAgeVerificationMethod),
);
export const discordRoleAssignmentSourceDbEnum = pgEnum(
  'discord_role_assignment_source',
  enumValues(DiscordRoleAssignmentSource),
);
export const discordModerationActionDbEnum = pgEnum(
  'discord_moderation_action',
  enumValues(DiscordModerationAction),
);
export const discordModerationCaseStatusDbEnum = pgEnum(
  'discord_moderation_case_status',
  enumValues(DiscordModerationCaseStatus),
);
export const discordAppealStatusDbEnum = pgEnum(
  'discord_appeal_status',
  enumValues(DiscordAppealStatus),
);
export const discordTicketStatusDbEnum = pgEnum(
  'discord_ticket_status',
  enumValues(DiscordTicketStatus),
);
export const discordTicketPriorityDbEnum = pgEnum(
  'discord_ticket_priority',
  enumValues(DiscordTicketPriority),
);
export const discordMusicTrackEndReasonDbEnum = pgEnum(
  'discord_music_track_end_reason',
  enumValues(DiscordMusicTrackEndReason),
);
export const discordAiSessionTypeDbEnum = pgEnum(
  'discord_ai_session_type',
  enumValues(DiscordAiSessionType),
);
export const discordAnalyticsGranularityDbEnum = pgEnum(
  'discord_analytics_granularity',
  enumValues(DiscordAnalyticsGranularity),
);
export const discordScheduledActionTypeDbEnum = pgEnum(
  'discord_scheduled_action_type',
  enumValues(DiscordScheduledActionType),
);
export const discordScheduledActionStatusDbEnum = pgEnum(
  'discord_scheduled_action_status',
  enumValues(DiscordScheduledActionStatus),
);
export const discordSyncStatusDbEnum = pgEnum(
  'discord_sync_status',
  enumValues(DiscordSyncStatus),
);
export const discordCommandTypeDbEnum = pgEnum(
  'discord_command_type',
  enumValues(DiscordCommandType),
);
export const discordDataProvenanceDbEnum = pgEnum(
  'discord_data_provenance',
  enumValues(DiscordDataProvenance),
);
export const discordProxyStatusDbEnum = pgEnum(
  'discord_proxy_status',
  enumValues(DiscordProxyStatus),
);

export type DiscordMembershipStatus = Values<typeof DiscordMembershipStatus>;
export type DiscordAgeVerificationStatus = Values<
  typeof DiscordAgeVerificationStatus
>;
export type DiscordAgeVerificationMethod = Values<
  typeof DiscordAgeVerificationMethod
>;
export type DiscordRoleAssignmentSource = Values<
  typeof DiscordRoleAssignmentSource
>;
export type DiscordModerationAction = Values<typeof DiscordModerationAction>;
export type DiscordModerationCaseStatus = Values<
  typeof DiscordModerationCaseStatus
>;
export type DiscordAppealStatus = Values<typeof DiscordAppealStatus>;
export type DiscordTicketStatus = Values<typeof DiscordTicketStatus>;
export type DiscordTicketPriority = Values<typeof DiscordTicketPriority>;
export type DiscordMusicTrackEndReason = Values<
  typeof DiscordMusicTrackEndReason
>;
export type DiscordAiSessionType = Values<typeof DiscordAiSessionType>;
export type DiscordAnalyticsGranularity = Values<
  typeof DiscordAnalyticsGranularity
>;
export type DiscordScheduledActionType = Values<
  typeof DiscordScheduledActionType
>;
export type DiscordScheduledActionStatus = Values<
  typeof DiscordScheduledActionStatus
>;
export type DiscordSyncStatus = Values<typeof DiscordSyncStatus>;
export type DiscordCommandType = Values<typeof DiscordCommandType>;
export type DiscordDataProvenance = Values<typeof DiscordDataProvenance>;
export type DiscordProxyStatus = Values<typeof DiscordProxyStatus>;
