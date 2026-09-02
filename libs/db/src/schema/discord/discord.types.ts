export type JsonRecord = Record<string, unknown>;

export type DiscordNotificationSettings = {
  dm: boolean;
  mentions: boolean;
  moderation: boolean;
  tickets: boolean;
  reminders: boolean;
};

export type DiscordAiUserSettings = {
  responseMode: 'public' | 'ephemeral' | 'ask';
  voiceEnabled: boolean;
  preferredVoice: string | null;
  personalityId: string | null;
  memoryOptIn: boolean;
  crossGuildPersonalization: boolean;
};

export type DiscordPrivacySettings = {
  analyticsPersonalization: boolean;
  profileVisibility: 'private' | 'mutual_guilds' | 'public';
  activityVisible: boolean;
  mutualGuildsVisible: boolean;
  dataSharing: boolean;
  discoverable: boolean;
};

export type DiscordGuildCoreSettings = {
  prefix: string;
  slashCommands: boolean;
  textCommands: boolean;
  locale: string;
  timezone: string;
  adminRoleId: string | null;
  moderatorRoleIds: string[];
  staffRoleIds: string[];
  managementRoleIds: string[];
};

export type DiscordGuildAiSettings = JsonRecord & {
  enabled: boolean;
  chatEnabled: boolean;
  voiceEnabled: boolean;
  moderationEnabled: boolean;
  summariesEnabled: boolean;
  memoryEnabled: boolean;
  knowledgeEnabled: boolean;
  allowedChannelIds: string[];
  blockedChannelIds: string[];
};

export type DiscordGuildMusicSettings = JsonRecord & {
  enabled: boolean;
  defaultVolume: number;
  autoplay: boolean;
  explicitContent: 'allow' | 'filter' | 'deny';
};

export type DiscordGuildModerationSettings = JsonRecord & {
  enabled: boolean;
  automodEnabled: boolean;
  raidProtection: boolean;
  antiSpam: boolean;
  antiPhishing: boolean;
};

export type DiscordGuildCommunitySettings = JsonRecord & {
  welcomeEnabled: boolean;
  goodbyeEnabled: boolean;
  levelingEnabled: boolean;
  reputationEnabled: boolean;
  ticketsEnabled: boolean;
};

export type DiscordGuildAnalyticsSettings = JsonRecord & {
  enabled: boolean;
  retentionDays: number;
  messageAnalytics: boolean;
  voiceAnalytics: boolean;
  aiAnalytics: boolean;
  musicAnalytics: boolean;
  memberAnalytics: boolean;
  moderationAnalytics: boolean;
  contentStorage: 'none' | 'moderation_only' | 'configured';
  privacyMode: 'standard' | 'aggregate_only';
};

export type DiscordForumTagDefinition = {
  id: string;
  name: string;
  moderated: boolean;
  emojiId?: string;
  emojiName?: string;
};
