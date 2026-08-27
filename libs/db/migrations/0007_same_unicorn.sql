CREATE TYPE "public"."discord_age_verification_method" AS ENUM('provider', 'manual', 'account_attestation', 'government_id', 'payment_method', 'other');--> statement-breakpoint
CREATE TYPE "public"."discord_age_verification_status" AS ENUM('unverified', 'pending', 'verified', 'rejected', 'expired', 'revoked', 'needs_review');--> statement-breakpoint
CREATE TYPE "public"."discord_ai_session_type" AS ENUM('text', 'voice', 'moderation', 'summarization');--> statement-breakpoint
CREATE TYPE "public"."discord_analytics_granularity" AS ENUM('hourly', 'daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."discord_appeal_status" AS ENUM('pending', 'approved', 'denied', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."discord_command_type" AS ENUM('slash', 'prefix', 'user_context', 'message_context');--> statement-breakpoint
CREATE TYPE "public"."discord_data_provenance" AS ENUM('discord', 'aerealith', 'user', 'moderator', 'ai', 'analytics');--> statement-breakpoint
CREATE TYPE "public"."discord_membership_status" AS ENUM('active', 'left', 'kicked', 'banned', 'unavailable', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."discord_moderation_action" AS ENUM('warning', 'strike', 'note', 'timeout', 'mute', 'unmute', 'kick', 'ban', 'temporary_ban', 'unban', 'softban', 'purge', 'channel_lockdown', 'role_action', 'nickname_action', 'automod_action', 'raid_response', 'custom_action');--> statement-breakpoint
CREATE TYPE "public"."discord_moderation_case_status" AS ENUM('open', 'resolved', 'reversed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."discord_music_track_end_reason" AS ENUM('finished', 'load_failed', 'stopped', 'replaced', 'cleanup', 'skipped', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."discord_proxy_status" AS ENUM('active', 'disabled', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."discord_role_assignment_source" AS ENUM('discord', 'moderator', 'autorole', 'reaction_role', 'button_role', 'automation', 'subscription', 'leveling', 'temporary_role');--> statement-breakpoint
CREATE TYPE "public"."discord_scheduled_action_status" AS ENUM('pending', 'running', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."discord_scheduled_action_type" AS ENUM('user_reminder', 'guild_reminder', 'scheduled_message', 'moderation_action', 'temporary_role', 'temporary_ban', 'temporary_timeout', 'announcement');--> statement-breakpoint
CREATE TYPE "public"."discord_sync_status" AS ENUM('pending', 'running', 'succeeded', 'failed', 'stale');--> statement-breakpoint
CREATE TYPE "public"."discord_ticket_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."discord_ticket_status" AS ENUM('open', 'claimed', 'closed', 'reopened', 'archived');--> statement-breakpoint
CREATE TABLE "discord_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_account_id" uuid,
	"discord_user_id" varchar(20) NOT NULL,
	"username" varchar(32) NOT NULL,
	"global_display_name" varchar(100),
	"discriminator" varchar(4),
	"avatar_hash" varchar(128),
	"avatar_decoration" jsonb,
	"banner_hash" varchar(128),
	"accent_color" integer,
	"is_bot" boolean DEFAULT false NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"public_flags" varchar(32) DEFAULT '0' NOT NULL,
	"user_flags" varchar(32),
	"locale" varchar(35),
	"oauth_scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_synced_at" timestamp with time zone,
	"linked_at" timestamp with time zone,
	"unlinked_at" timestamp with time zone,
	"is_linked_active" boolean DEFAULT false NOT NULL,
	"is_unavailable" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "discord_accounts_snowflake_check" CHECK ("discord_accounts"."discord_user_id" ~ '^[0-9]{1,20}$'),
	CONSTRAINT "discord_accounts_link_state_check" CHECK (("discord_accounts"."user_account_id" is null and "discord_accounts"."is_linked_active" = false) or "discord_accounts"."user_account_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "discord_age_verification_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"verification_id" uuid NOT NULL,
	"previous_status" "discord_age_verification_status",
	"next_status" "discord_age_verification_status" NOT NULL,
	"actor_user_id" uuid,
	"reason_code" varchar(100),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_age_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discord_account_id" uuid NOT NULL,
	"status" "discord_age_verification_status" DEFAULT 'unverified' NOT NULL,
	"is_18_plus" boolean DEFAULT false NOT NULL,
	"method" "discord_age_verification_method",
	"provider" varchar(100),
	"provider_reference" text,
	"evidence_object_reference" text,
	"evidence_retention_status" varchar(32) DEFAULT 'not_collected' NOT NULL,
	"document_type" varchar(64),
	"issuing_country" varchar(2),
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"rejection_reason_code" varchar(100),
	"manual_review_state" varchar(32),
	"reviewer_user_id" uuid,
	"verified_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"purged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "discord_age_attempt_count_check" CHECK ("discord_age_verifications"."attempt_count" >= 0),
	CONSTRAINT "discord_age_verified_state_check" CHECK ("discord_age_verifications"."status" <> 'verified' or ("discord_age_verifications"."verified_at" is not null and "discord_age_verifications"."method" is not null))
);
--> statement-breakpoint
CREATE TABLE "discord_user_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discord_account_id" uuid NOT NULL,
	"locale" varchar(35),
	"timezone" varchar(100),
	"notifications" jsonb DEFAULT '{"dm":true,"mentions":true,"moderation":true,"tickets":true,"reminders":true}'::jsonb NOT NULL,
	"ai" jsonb DEFAULT '{"responseMode":"ask","voiceEnabled":true,"preferredVoice":null,"personalityId":null,"memoryOptIn":false,"crossGuildPersonalization":false}'::jsonb NOT NULL,
	"privacy" jsonb DEFAULT '{"analyticsPersonalization":false,"profileVisibility":"mutual_guilds","activityVisible":true,"mutualGuildsVisible":true,"dataSharing":false,"discoverable":false}'::jsonb NOT NULL,
	"music" jsonb DEFAULT '{"defaultVolume":80,"autoplay":false,"explicitContent":"filter"}'::jsonb NOT NULL,
	"commands" jsonb DEFAULT '{"ephemeralByDefault":false}'::jsonb NOT NULL,
	"accessibility" jsonb DEFAULT '{"reduceMotion":false}'::jsonb NOT NULL,
	"personas" jsonb DEFAULT '{"enabled":true}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{"schemaVersion":1}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_channel_analytics_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"granularity" "discord_analytics_granularity" DEFAULT 'daily' NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"unique_authors" integer DEFAULT 0 NOT NULL,
	"reaction_count" integer DEFAULT 0 NOT NULL,
	"threads_created" integer DEFAULT 0 NOT NULL,
	"forum_posts" integer DEFAULT 0 NOT NULL,
	"forum_replies" integer DEFAULT 0 NOT NULL,
	"unanswered_forum_posts" integer DEFAULT 0 NOT NULL,
	"voice_minutes" integer DEFAULT 0 NOT NULL,
	"ai_interactions" integer DEFAULT 0 NOT NULL,
	"command_executions" integer DEFAULT 0 NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_command_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"command_name" varchar(100) NOT NULL,
	"command_type" "discord_command_type" NOT NULL,
	"guild_id" uuid,
	"channel_id" uuid,
	"account_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"duration_milliseconds" integer,
	"succeeded" boolean DEFAULT false NOT NULL,
	"error_category" varchar(100),
	"shard_id" integer,
	"cluster_id" varchar(100),
	"premium_feature" boolean DEFAULT false NOT NULL,
	"ai_command" boolean DEFAULT false NOT NULL,
	"music_command" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_guild_analytics_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"granularity" "discord_analytics_granularity" DEFAULT 'daily' NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"total_members" integer DEFAULT 0 NOT NULL,
	"human_members" integer DEFAULT 0 NOT NULL,
	"bot_members" integer DEFAULT 0 NOT NULL,
	"active_members" integer DEFAULT 0 NOT NULL,
	"new_members" integer DEFAULT 0 NOT NULL,
	"returning_members" integer DEFAULT 0 NOT NULL,
	"members_left" integer DEFAULT 0 NOT NULL,
	"net_growth" integer DEFAULT 0 NOT NULL,
	"online_members" integer DEFAULT 0 NOT NULL,
	"idle_members" integer DEFAULT 0 NOT NULL,
	"dnd_members" integer DEFAULT 0 NOT NULL,
	"offline_members" integer DEFAULT 0 NOT NULL,
	"category_count" integer DEFAULT 0 NOT NULL,
	"text_channel_count" integer DEFAULT 0 NOT NULL,
	"announcement_channel_count" integer DEFAULT 0 NOT NULL,
	"voice_channel_count" integer DEFAULT 0 NOT NULL,
	"stage_channel_count" integer DEFAULT 0 NOT NULL,
	"forum_channel_count" integer DEFAULT 0 NOT NULL,
	"media_channel_count" integer DEFAULT 0 NOT NULL,
	"active_thread_count" integer DEFAULT 0 NOT NULL,
	"archived_thread_count" integer DEFAULT 0 NOT NULL,
	"private_thread_count" integer DEFAULT 0 NOT NULL,
	"public_thread_count" integer DEFAULT 0 NOT NULL,
	"role_count" integer DEFAULT 0 NOT NULL,
	"emoji_count" integer DEFAULT 0 NOT NULL,
	"animated_emoji_count" integer DEFAULT 0 NOT NULL,
	"sticker_count" integer DEFAULT 0 NOT NULL,
	"soundboard_sound_count" integer DEFAULT 0 NOT NULL,
	"scheduled_event_count" integer DEFAULT 0 NOT NULL,
	"invite_count" integer DEFAULT 0 NOT NULL,
	"boost_count" integer DEFAULT 0 NOT NULL,
	"boost_tier" integer DEFAULT 0 NOT NULL,
	"messages_sent" integer DEFAULT 0 NOT NULL,
	"unique_message_authors" integer DEFAULT 0 NOT NULL,
	"messages_edited" integer DEFAULT 0 NOT NULL,
	"messages_deleted" integer DEFAULT 0 NOT NULL,
	"attachment_count" integer DEFAULT 0 NOT NULL,
	"media_count" integer DEFAULT 0 NOT NULL,
	"link_count" integer DEFAULT 0 NOT NULL,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"mention_count" integer DEFAULT 0 NOT NULL,
	"reaction_count" integer DEFAULT 0 NOT NULL,
	"threads_created" integer DEFAULT 0 NOT NULL,
	"forum_posts_created" integer DEFAULT 0 NOT NULL,
	"voice_sessions" integer DEFAULT 0 NOT NULL,
	"unique_voice_users" integer DEFAULT 0 NOT NULL,
	"voice_minutes" integer DEFAULT 0 NOT NULL,
	"peak_concurrent_voice_users" integer DEFAULT 0 NOT NULL,
	"stage_participants" integer DEFAULT 0 NOT NULL,
	"stream_sessions" integer DEFAULT 0 NOT NULL,
	"video_sessions" integer DEFAULT 0 NOT NULL,
	"music_sessions" integer DEFAULT 0 NOT NULL,
	"songs_played" integer DEFAULT 0 NOT NULL,
	"music_minutes" integer DEFAULT 0 NOT NULL,
	"unique_music_listeners" integer DEFAULT 0 NOT NULL,
	"unique_music_requesters" integer DEFAULT 0 NOT NULL,
	"music_skips" integer DEFAULT 0 NOT NULL,
	"failed_tracks" integer DEFAULT 0 NOT NULL,
	"ai_interactions" integer DEFAULT 0 NOT NULL,
	"unique_ai_users" integer DEFAULT 0 NOT NULL,
	"ai_text_interactions" integer DEFAULT 0 NOT NULL,
	"ai_voice_sessions" integer DEFAULT 0 NOT NULL,
	"ai_voice_minutes" integer DEFAULT 0 NOT NULL,
	"ai_input_tokens" integer DEFAULT 0 NOT NULL,
	"ai_output_tokens" integer DEFAULT 0 NOT NULL,
	"ai_tool_calls" integer DEFAULT 0 NOT NULL,
	"ai_failures" integer DEFAULT 0 NOT NULL,
	"ai_estimated_cost" numeric(18, 8) DEFAULT '0' NOT NULL,
	"commands_executed" integer DEFAULT 0 NOT NULL,
	"successful_commands" integer DEFAULT 0 NOT NULL,
	"failed_commands" integer DEFAULT 0 NOT NULL,
	"unique_command_users" integer DEFAULT 0 NOT NULL,
	"warnings" integer DEFAULT 0 NOT NULL,
	"strikes" integer DEFAULT 0 NOT NULL,
	"timeouts" integer DEFAULT 0 NOT NULL,
	"kicks" integer DEFAULT 0 NOT NULL,
	"bans" integer DEFAULT 0 NOT NULL,
	"unbans" integer DEFAULT 0 NOT NULL,
	"automod_actions" integer DEFAULT 0 NOT NULL,
	"spam_deleted" integer DEFAULT 0 NOT NULL,
	"phishing_detections" integer DEFAULT 0 NOT NULL,
	"raid_incidents" integer DEFAULT 0 NOT NULL,
	"appeals" integer DEFAULT 0 NOT NULL,
	"tickets_opened" integer DEFAULT 0 NOT NULL,
	"tickets_closed" integer DEFAULT 0 NOT NULL,
	"suggestions_created" integer DEFAULT 0 NOT NULL,
	"suggestions_accepted" integer DEFAULT 0 NOT NULL,
	"giveaways" integer DEFAULT 0 NOT NULL,
	"reputation_events" integer DEFAULT 0 NOT NULL,
	"xp_events" integer DEFAULT 0 NOT NULL,
	"starboard_entries" integer DEFAULT 0 NOT NULL,
	"top_commands" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"calculated_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_member_analytics_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"granularity" "discord_analytics_granularity" DEFAULT 'daily' NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"messages" integer DEFAULT 0 NOT NULL,
	"voice_minutes" integer DEFAULT 0 NOT NULL,
	"commands" integer DEFAULT 0 NOT NULL,
	"ai_interactions" integer DEFAULT 0 NOT NULL,
	"music_requests" integer DEFAULT 0 NOT NULL,
	"reactions" integer DEFAULT 0 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"reputation" integer DEFAULT 0 NOT NULL,
	"moderation_events" integer DEFAULT 0 NOT NULL,
	"last_active_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_presence_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"online" integer DEFAULT 0 NOT NULL,
	"idle" integer DEFAULT 0 NOT NULL,
	"dnd" integer DEFAULT 0 NOT NULL,
	"offline_or_unknown" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_channel_permission_overwrites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"target_discord_id" varchar(20) NOT NULL,
	"target_type" varchar(16) NOT NULL,
	"allow_permissions" varchar(32) DEFAULT '0' NOT NULL,
	"deny_permissions" varchar(32) DEFAULT '0' NOT NULL,
	"last_synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"discord_channel_id" varchar(20) NOT NULL,
	"parent_channel_id" uuid,
	"parent_discord_channel_id" varchar(20),
	"channel_type" integer NOT NULL,
	"name" varchar(100),
	"position" integer DEFAULT 0 NOT NULL,
	"topic" text,
	"nsfw" boolean DEFAULT false NOT NULL,
	"rate_limit_per_user_seconds" integer DEFAULT 0 NOT NULL,
	"default_auto_archive_minutes" integer,
	"permissions_synced" boolean DEFAULT false NOT NULL,
	"last_message_discord_id" varchar(20),
	"bitrate" integer,
	"user_limit" integer,
	"rtc_region" varchar(100),
	"video_quality_mode" integer,
	"default_reaction_emoji" jsonb,
	"default_thread_rate_limit_seconds" integer,
	"default_sort_order" integer,
	"default_forum_layout" integer,
	"available_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"flags" varchar(32) DEFAULT '0' NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_synced_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_forum_post_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"forum_channel_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	"author_account_id" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"last_activity_at" timestamp with time zone,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"participant_count" integer DEFAULT 0 NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"locked" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_forum_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"forum_channel_id" uuid NOT NULL,
	"discord_tag_id" varchar(20) NOT NULL,
	"name" varchar(20) NOT NULL,
	"moderated" boolean DEFAULT false NOT NULL,
	"emoji_discord_id" varchar(20),
	"emoji_name" varchar(100),
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"parent_channel_id" uuid NOT NULL,
	"owner_account_id" uuid,
	"thread_type" integer NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"auto_archive_duration_minutes" integer NOT NULL,
	"archive_timestamp" timestamp with time zone,
	"locked" boolean DEFAULT false NOT NULL,
	"invitable" boolean DEFAULT true NOT NULL,
	"thread_created_at" timestamp with time zone,
	"message_count" integer DEFAULT 0 NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"total_messages_sent" integer DEFAULT 0 NOT NULL,
	"applied_tag_discord_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_activity_at" timestamp with time zone,
	"last_synced_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discord_autoroles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"target_type" varchar(16) DEFAULT 'human' NOT NULL,
	"delay_seconds" integer DEFAULT 0 NOT NULL,
	"requirements" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"minimum_tier" varchar(32),
	"requires_age_verification" boolean DEFAULT false NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_custom_commands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"name" varchar(64) NOT NULL,
	"aliases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"trigger_type" varchar(32) DEFAULT 'exact' NOT NULL,
	"response" text NOT NULL,
	"embed" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"required_role_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"blocked_role_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allowed_channel_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cooldown_seconds" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_by_account_id" uuid,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_feed_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"provider" varchar(64) NOT NULL,
	"external_reference" text NOT NULL,
	"configuration" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_cursor" text,
	"last_synced_at" timestamp with time zone,
	"last_failure_code" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_giveaway_entrants" (
	"giveaway_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"entered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"selected_as_winner" boolean DEFAULT false NOT NULL,
	"selected_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discord_giveaways" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"host_account_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"message_id" uuid,
	"prize" text NOT NULL,
	"description" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"winner_count" integer DEFAULT 1 NOT NULL,
	"requirements" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(32) DEFAULT 'scheduled' NOT NULL,
	"reroll_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_greeting_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"greeting_type" varchar(16) NOT NULL,
	"channel_id" uuid,
	"dm_enabled" boolean DEFAULT false NOT NULL,
	"template" text NOT NULL,
	"embed" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"image_object_reference" text,
	"enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_greeting_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"greeting_type" varchar(16) NOT NULL,
	"delivered" boolean DEFAULT false NOT NULL,
	"failure_code" varchar(100),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_level_role_rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"level" integer NOT NULL,
	"remove_previous" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_member_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"current_xp" integer DEFAULT 0 NOT NULL,
	"lifetime_xp" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 0 NOT NULL,
	"message_xp" integer DEFAULT 0 NOT NULL,
	"voice_xp" integer DEFAULT 0 NOT NULL,
	"bonus_xp" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"last_xp_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_member_reputation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"lifetime_score" integer DEFAULT 0 NOT NULL,
	"gives_received" integer DEFAULT 0 NOT NULL,
	"gives_sent" integer DEFAULT 0 NOT NULL,
	"last_given_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_poll_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"voter_account_id" uuid,
	"voter_key_hash" varchar(128) NOT NULL,
	"option_key" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_polls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"message_id" uuid,
	"creator_account_id" uuid NOT NULL,
	"question" text NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"anonymous" boolean DEFAULT false NOT NULL,
	"multi_select" boolean DEFAULT false NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone,
	"status" varchar(32) DEFAULT 'open' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_reputation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"receiver_member_id" uuid NOT NULL,
	"giver_member_id" uuid,
	"amount" integer NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discord_role_assignment_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"trigger_type" varchar(16) NOT NULL,
	"trigger_key" varchar(128) NOT NULL,
	"behavior" varchar(32) DEFAULT 'toggle' NOT NULL,
	"exclusive_group" varchar(100),
	"required_role_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"prohibited_role_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_scheduled_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid,
	"account_id" uuid,
	"action_type" "discord_scheduled_action_type" NOT NULL,
	"status" "discord_scheduled_action_status" DEFAULT 'pending' NOT NULL,
	"execute_at" timestamp with time zone NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"queue_reference" varchar(128),
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_failure_code" varchar(100),
	"locked_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_starboard_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"emoji_key" varchar(128) DEFAULT '⭐' NOT NULL,
	"threshold" integer DEFAULT 3 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_starboard_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"source_message_id" uuid NOT NULL,
	"starboard_message_id" uuid,
	"star_count" integer DEFAULT 0 NOT NULL,
	"state" varchar(32) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"author_account_id" uuid NOT NULL,
	"channel_id" uuid,
	"message_id" uuid,
	"content" text NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"downvotes" integer DEFAULT 0 NOT NULL,
	"staff_response" text,
	"reviewer_account_id" uuid,
	"reviewed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_guild_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"module_key" varchar(100) NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"configuration" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled_at" timestamp with time zone,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_guild_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"bot_enabled" boolean DEFAULT true NOT NULL,
	"core" jsonb DEFAULT '{"prefix":"!","slashCommands":true,"textCommands":false,"locale":"en-US","timezone":"UTC","adminRoleId":null,"moderatorRoleIds":[],"staffRoleIds":[],"managementRoleIds":[]}'::jsonb NOT NULL,
	"ai" jsonb DEFAULT '{"enabled":false,"chatEnabled":false,"voiceEnabled":false,"moderationEnabled":false,"summariesEnabled":false,"memoryEnabled":false,"knowledgeEnabled":false,"allowedChannelIds":[],"blockedChannelIds":[]}'::jsonb NOT NULL,
	"music" jsonb DEFAULT '{"enabled":true,"defaultVolume":80,"autoplay":false,"explicitContent":"filter"}'::jsonb NOT NULL,
	"moderation" jsonb DEFAULT '{"enabled":true,"automodEnabled":false,"raidProtection":true,"antiSpam":true,"antiPhishing":true}'::jsonb NOT NULL,
	"community" jsonb DEFAULT '{"welcomeEnabled":false,"goodbyeEnabled":false,"levelingEnabled":false,"reputationEnabled":false,"ticketsEnabled":false}'::jsonb NOT NULL,
	"analytics" jsonb DEFAULT '{"enabled":true,"retentionDays":730,"messageAnalytics":true,"voiceAnalytics":true,"aiAnalytics":true,"musicAnalytics":true,"memberAnalytics":true,"moderationAnalytics":true,"contentStorage":"moderation_only","privacyMode":"standard"}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_guild_sync_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"resource" varchar(64) NOT NULL,
	"status" "discord_sync_status" DEFAULT 'pending' NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"last_successful_at" timestamp with time zone,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"last_failure_code" varchar(100),
	"last_failure_message" text,
	"cursor" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_guilds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discord_guild_id" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"owner_discord_user_id" varchar(20) NOT NULL,
	"owner_account_id" uuid,
	"icon_hash" varchar(128),
	"banner_hash" varchar(128),
	"splash_hash" varchar(128),
	"discovery_splash_hash" varchar(128),
	"vanity_url_code" varchar(100),
	"preferred_locale" varchar(35),
	"discord_created_at" timestamp with time zone,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"bot_joined_at" timestamp with time zone,
	"bot_left_at" timestamp with time zone,
	"last_synced_at" timestamp with time zone,
	"is_bot_installed" boolean DEFAULT true NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"is_discord_unavailable" boolean DEFAULT false NOT NULL,
	"shard_id" integer,
	"cluster_id" varchar(100),
	"verification_level" integer DEFAULT 0 NOT NULL,
	"default_notification_level" integer DEFAULT 0 NOT NULL,
	"explicit_content_filter" integer DEFAULT 0 NOT NULL,
	"mfa_level" integer DEFAULT 0 NOT NULL,
	"nsfw_level" integer DEFAULT 0 NOT NULL,
	"premium_tier" integer DEFAULT 0 NOT NULL,
	"premium_subscription_count" integer DEFAULT 0 NOT NULL,
	"premium_progress_bar_enabled" boolean DEFAULT false NOT NULL,
	"max_members" integer,
	"max_presences" integer,
	"max_video_channel_users" integer,
	"max_stage_video_channel_users" integer,
	"approximate_member_count" integer,
	"approximate_presence_count" integer,
	"afk_channel_discord_id" varchar(20),
	"afk_timeout_seconds" integer,
	"system_channel_discord_id" varchar(20),
	"rules_channel_discord_id" varchar(20),
	"public_updates_channel_discord_id" varchar(20),
	"safety_alerts_channel_discord_id" varchar(20),
	"widget_enabled" boolean DEFAULT false NOT NULL,
	"widget_channel_discord_id" varchar(20),
	"application_discord_id" varchar(20),
	"is_partnered" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_community" boolean DEFAULT false NOT NULL,
	"is_discoverable" boolean DEFAULT false NOT NULL,
	"discovery_enabled_at" timestamp with time zone,
	"welcome_screen_enabled" boolean DEFAULT false NOT NULL,
	"discord_features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_audit_log_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discord_entry_id" varchar(20) NOT NULL,
	"guild_id" uuid NOT NULL,
	"actor_account_id" uuid,
	"target_discord_id" varchar(20),
	"target_type" varchar(64),
	"action_type" integer NOT NULL,
	"reason" text,
	"changes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"options" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"discord_created_at" timestamp with time zone NOT NULL,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_emojis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"discord_emoji_id" varchar(20) NOT NULL,
	"name" varchar(100),
	"animated" boolean DEFAULT false NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"managed" boolean DEFAULT false NOT NULL,
	"require_colons" boolean DEFAULT true NOT NULL,
	"creator_account_id" uuid,
	"restricted_role_discord_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_synced_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discord_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"guild_id" uuid NOT NULL,
	"channel_id" uuid,
	"inviter_account_id" uuid,
	"target_discord_user_id" varchar(20),
	"target_application_discord_id" varchar(20),
	"max_age_seconds" integer DEFAULT 0 NOT NULL,
	"max_uses" integer DEFAULT 0 NOT NULL,
	"temporary" boolean DEFAULT false NOT NULL,
	"uses" integer DEFAULT 0 NOT NULL,
	"last_observed_uses" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_native_automod_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discord_rule_id" varchar(20) NOT NULL,
	"guild_id" uuid NOT NULL,
	"creator_account_id" uuid,
	"name" varchar(100) NOT NULL,
	"event_type" integer NOT NULL,
	"trigger_type" integer NOT NULL,
	"trigger_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"exempt_role_discord_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"exempt_channel_discord_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_scheduled_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discord_event_id" varchar(20) NOT NULL,
	"guild_id" uuid NOT NULL,
	"channel_id" uuid,
	"creator_account_id" uuid,
	"name" varchar(100) NOT NULL,
	"description" text,
	"scheduled_start_at" timestamp with time zone NOT NULL,
	"scheduled_end_at" timestamp with time zone,
	"privacy_level" integer NOT NULL,
	"status" integer NOT NULL,
	"entity_type" integer NOT NULL,
	"entity_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"image_hash" varchar(128),
	"interested_user_count" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_soundboard_sounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"discord_sound_id" varchar(20) NOT NULL,
	"name" varchar(32) NOT NULL,
	"volume" numeric(5, 4) DEFAULT '1' NOT NULL,
	"emoji_discord_id" varchar(20),
	"emoji_name" varchar(100),
	"available" boolean DEFAULT true NOT NULL,
	"creator_account_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_stage_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"scheduled_event_id" uuid,
	"topic" text NOT NULL,
	"privacy_level" integer NOT NULL,
	"discoverable_disabled" boolean DEFAULT false NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discord_stickers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"discord_sticker_id" varchar(20) NOT NULL,
	"name" varchar(30) NOT NULL,
	"description" text,
	"tags" text,
	"sticker_type" integer NOT NULL,
	"format_type" integer NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"creator_account_id" uuid,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_synced_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discord_webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid,
	"channel_id" uuid,
	"discord_webhook_id" varchar(20) NOT NULL,
	"webhook_type" integer NOT NULL,
	"name" varchar(100),
	"avatar_hash" varchar(128),
	"application_discord_id" varchar(20),
	"owner_account_id" uuid,
	"managed_by_aerealith" boolean DEFAULT false NOT NULL,
	"purpose" varchar(64),
	"token_secret_reference" text,
	"last_validated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_guild_member_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"guild_id" uuid NOT NULL,
	"status" "discord_membership_status" NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_account_id" uuid,
	"reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_guild_member_role_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"action" varchar(16) NOT NULL,
	"source" "discord_role_assignment_source" DEFAULT 'discord' NOT NULL,
	"provenance" "discord_data_provenance" DEFAULT 'discord' NOT NULL,
	"actor_account_id" uuid,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_guild_member_roles" (
	"member_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"source" "discord_role_assignment_source" DEFAULT 'discord' NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "discord_guild_member_roles_pk" PRIMARY KEY("member_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "discord_guild_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"discord_account_id" uuid NOT NULL,
	"discord_user_id" varchar(20) NOT NULL,
	"nickname" varchar(100),
	"guild_avatar_hash" varchar(128),
	"guild_profile_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"joined_at" timestamp with time zone,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"premium_since" timestamp with time zone,
	"pending" boolean DEFAULT false NOT NULL,
	"flags" varchar(32) DEFAULT '0' NOT NULL,
	"server_muted" boolean DEFAULT false NOT NULL,
	"server_deafened" boolean DEFAULT false NOT NULL,
	"communication_disabled_until" timestamp with time zone,
	"status" "discord_membership_status" DEFAULT 'active' NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"is_present" boolean DEFAULT true NOT NULL,
	"rejoin_count" integer DEFAULT 0 NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"discord_role_id" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"color" integer DEFAULT 0 NOT NULL,
	"hoisted" boolean DEFAULT false NOT NULL,
	"managed" boolean DEFAULT false NOT NULL,
	"mentionable" boolean DEFAULT false NOT NULL,
	"permissions" varchar(32) DEFAULT '0' NOT NULL,
	"icon_hash" varchar(128),
	"unicode_emoji" varchar(32),
	"tags" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"flags" varchar(32) DEFAULT '0' NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_synced_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_message_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid,
	"guild_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"event_type" varchar(32) NOT NULL,
	"actor_account_id" uuid,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discord_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discord_message_id" varchar(20) NOT NULL,
	"guild_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"thread_channel_id" uuid,
	"author_account_id" uuid,
	"webhook_id" uuid,
	"referenced_message_id" uuid,
	"message_type" integer NOT NULL,
	"discord_created_at" timestamp with time zone NOT NULL,
	"edited_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"attachment_count" integer DEFAULT 0 NOT NULL,
	"embed_count" integer DEFAULT 0 NOT NULL,
	"mention_count" integer DEFAULT 0 NOT NULL,
	"role_mention_count" integer DEFAULT 0 NOT NULL,
	"mentions_everyone" boolean DEFAULT false NOT NULL,
	"character_count" integer DEFAULT 0 NOT NULL,
	"link_count" integer DEFAULT 0 NOT NULL,
	"reaction_count" integer DEFAULT 0 NOT NULL,
	"is_proxied" boolean DEFAULT false NOT NULL,
	"is_bot_generated" boolean DEFAULT false NOT NULL,
	"is_command_related" boolean DEFAULT false NOT NULL,
	"is_ai_generated" boolean DEFAULT false NOT NULL,
	"is_moderation_flagged" boolean DEFAULT false NOT NULL,
	"provenance" "discord_data_provenance" DEFAULT 'discord' NOT NULL,
	"content_ciphertext" text,
	"content_storage_policy" varchar(32) DEFAULT 'none' NOT NULL,
	"content_stored_at" timestamp with time zone,
	"content_purge_at" timestamp with time zone,
	"attachment_metadata" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"emoji_key" varchar(128) NOT NULL,
	"burst" boolean DEFAULT false NOT NULL,
	"reacted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discord_voice_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"session_type" varchar(16) NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_seconds" integer,
	"streamed" boolean DEFAULT false NOT NULL,
	"used_video" boolean DEFAULT false NOT NULL,
	"server_mute_seconds" integer DEFAULT 0 NOT NULL,
	"server_deaf_seconds" integer DEFAULT 0 NOT NULL,
	"self_mute_seconds" integer DEFAULT 0 NOT NULL,
	"self_deaf_seconds" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_automod_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"trigger_type" varchar(64) NOT NULL,
	"trigger_configuration" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"conditions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"exempt_account_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"exempt_role_discord_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"exempt_channel_discord_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"escalation" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by_account_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discord_moderation_appeals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"case_id" uuid NOT NULL,
	"appellant_account_id" uuid NOT NULL,
	"content_ciphertext" text NOT NULL,
	"status" "discord_appeal_status" DEFAULT 'pending' NOT NULL,
	"reviewer_account_id" uuid,
	"response_ciphertext" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discord_moderation_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"case_number" integer NOT NULL,
	"target_account_id" uuid NOT NULL,
	"target_member_id" uuid,
	"moderator_account_id" uuid,
	"action" "discord_moderation_action" NOT NULL,
	"status" "discord_moderation_case_status" DEFAULT 'open' NOT NULL,
	"source" varchar(64) DEFAULT 'manual' NOT NULL,
	"provenance" "discord_data_provenance" DEFAULT 'moderator' NOT NULL,
	"reason" text,
	"public_reason" text,
	"internal_notes_ciphertext" text,
	"duration_seconds" integer,
	"expires_at" timestamp with time zone,
	"related_audit_log_entry_id" uuid,
	"related_native_automod_rule_id" uuid,
	"related_message_id" uuid,
	"related_channel_id" uuid,
	"resolved_at" timestamp with time zone,
	"reversed_at" timestamp with time zone,
	"expired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_moderation_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"evidence_type" varchar(32) NOT NULL,
	"message_id" uuid,
	"object_reference" text,
	"external_url" text,
	"note_ciphertext" text,
	"evidence_hash" varchar(128),
	"collected_by_account_id" uuid,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"purge_at" timestamp with time zone,
	"purged_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_raid_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"detection_source" varchar(64) NOT NULL,
	"join_velocity_per_minute" integer DEFAULT 0 NOT NULL,
	"account_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"actions_taken" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"lockdown_active" boolean DEFAULT false NOT NULL,
	"acknowledged_by_account_id" uuid,
	"acknowledged_at" timestamp with time zone,
	"resolution" text,
	"notes_ciphertext" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_ai_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid,
	"channel_id" uuid,
	"account_id" uuid NOT NULL,
	"aerealith_session_reference" varchar(128) NOT NULL,
	"session_type" "discord_ai_session_type" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"provider" varchar(100),
	"model" varchar(160),
	"usage_reference" varchar(128),
	"memory_enabled" boolean DEFAULT false NOT NULL,
	"server_context_enabled" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_ai_usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"guild_id" uuid,
	"account_id" uuid NOT NULL,
	"request_type" varchar(32) NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cached_tokens" integer DEFAULT 0 NOT NULL,
	"tool_calls" integer DEFAULT 0 NOT NULL,
	"voice_seconds" integer DEFAULT 0 NOT NULL,
	"latency_milliseconds" integer,
	"failed" boolean DEFAULT false NOT NULL,
	"failure_code" varchar(100),
	"estimated_provider_cost" numeric(18, 8),
	"billing_usage_reference" varchar(128),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_music_playlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_account_id" uuid NOT NULL,
	"guild_id" uuid,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"tracks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discord_music_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"voice_channel_id" uuid NOT NULL,
	"control_channel_id" uuid,
	"initiated_by_account_id" uuid,
	"lavalink_node" varchar(100),
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_seconds" integer,
	"track_count" integer DEFAULT 0 NOT NULL,
	"unique_listener_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_music_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"requested_by_account_id" uuid,
	"track_reference" text NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"uri" text,
	"source" varchar(64),
	"duration_milliseconds" integer,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"end_reason" "discord_music_track_end_reason",
	"skipped" boolean DEFAULT false NOT NULL,
	"failed" boolean DEFAULT false NOT NULL,
	"failure_code" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "discord_persona_guild_settings" (
	"persona_id" uuid NOT NULL,
	"guild_id" uuid NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"nickname_override" varchar(100),
	"avatar_object_reference" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_persona_proxy_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persona_id" uuid NOT NULL,
	"prefix" varchar(100) DEFAULT '' NOT NULL,
	"suffix" varchar(100) DEFAULT '' NOT NULL,
	"regex_pattern" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_personas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_account_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"avatar_object_reference" text,
	"description" text,
	"color" integer,
	"pronouns" varchar(100),
	"profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"group_name" varchar(100),
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "discord_proxy_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discord_proxied_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"original_author_account_id" uuid NOT NULL,
	"persona_id" uuid NOT NULL,
	"webhook_id" uuid,
	"resulting_message_id" uuid,
	"resulting_discord_message_id" varchar(20) NOT NULL,
	"original_discord_message_id" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"edited_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discord_ticket_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"actor_account_id" uuid,
	"event_type" varchar(32) NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_ticket_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"role" varchar(32) DEFAULT 'participant' NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discord_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"ticket_number" integer NOT NULL,
	"creator_account_id" uuid NOT NULL,
	"assigned_staff_account_id" uuid,
	"category" varchar(100),
	"channel_id" uuid,
	"status" "discord_ticket_status" DEFAULT 'open' NOT NULL,
	"priority" "discord_ticket_priority" DEFAULT 'normal' NOT NULL,
	"subject" text NOT NULL,
	"claimed_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"reopened_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"closure_reason" text,
	"transcript_object_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "discord_accounts" ADD CONSTRAINT "discord_accounts_user_account_id_user_accounts_id_fk" FOREIGN KEY ("user_account_id") REFERENCES "public"."user_accounts"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "discord_age_verification_events" ADD CONSTRAINT "discord_age_verification_events_verification_id_discord_age_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "public"."discord_age_verifications"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "discord_age_verification_events" ADD CONSTRAINT "discord_age_verification_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_age_verifications" ADD CONSTRAINT "discord_age_verifications_discord_account_id_discord_accounts_id_fk" FOREIGN KEY ("discord_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "discord_age_verifications" ADD CONSTRAINT "discord_age_verifications_reviewer_user_id_users_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_user_settings" ADD CONSTRAINT "discord_user_settings_discord_account_id_discord_accounts_id_fk" FOREIGN KEY ("discord_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "discord_channel_analytics_snapshots" ADD CONSTRAINT "discord_channel_analytics_snapshots_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_channel_analytics_snapshots" ADD CONSTRAINT "discord_channel_analytics_snapshots_channel_id_discord_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_command_executions" ADD CONSTRAINT "discord_command_executions_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_command_executions" ADD CONSTRAINT "discord_command_executions_channel_id_discord_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_command_executions" ADD CONSTRAINT "discord_command_executions_account_id_discord_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_guild_analytics_snapshots" ADD CONSTRAINT "discord_guild_analytics_snapshots_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_member_analytics_snapshots" ADD CONSTRAINT "discord_member_analytics_snapshots_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_member_analytics_snapshots" ADD CONSTRAINT "discord_member_analytics_snapshots_member_id_discord_guild_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."discord_guild_members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_presence_snapshots" ADD CONSTRAINT "discord_presence_snapshots_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_channel_permission_overwrites" ADD CONSTRAINT "discord_channel_permission_overwrites_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_channel_permission_overwrites" ADD CONSTRAINT "discord_channel_permission_overwrites_channel_id_discord_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_channels" ADD CONSTRAINT "discord_channels_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_channels" ADD CONSTRAINT "discord_channels_parent_channel_id_discord_channels_id_fk" FOREIGN KEY ("parent_channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_forum_post_state" ADD CONSTRAINT "discord_forum_post_state_forum_channel_id_discord_channels_id_fk" FOREIGN KEY ("forum_channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_forum_post_state" ADD CONSTRAINT "discord_forum_post_state_thread_id_discord_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."discord_threads"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_forum_post_state" ADD CONSTRAINT "discord_forum_post_state_author_account_id_discord_accounts_id_fk" FOREIGN KEY ("author_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_forum_tags" ADD CONSTRAINT "discord_forum_tags_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_forum_tags" ADD CONSTRAINT "discord_forum_tags_forum_channel_id_discord_channels_id_fk" FOREIGN KEY ("forum_channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_threads" ADD CONSTRAINT "discord_threads_channel_id_discord_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_threads" ADD CONSTRAINT "discord_threads_parent_channel_id_discord_channels_id_fk" FOREIGN KEY ("parent_channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_threads" ADD CONSTRAINT "discord_threads_owner_account_id_discord_accounts_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_autoroles" ADD CONSTRAINT "discord_autoroles_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_autoroles" ADD CONSTRAINT "discord_autoroles_role_id_discord_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."discord_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_custom_commands" ADD CONSTRAINT "discord_custom_commands_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_custom_commands" ADD CONSTRAINT "discord_custom_commands_created_by_account_id_discord_accounts_id_fk" FOREIGN KEY ("created_by_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_feed_configurations" ADD CONSTRAINT "discord_feed_configurations_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_feed_configurations" ADD CONSTRAINT "discord_feed_configurations_channel_id_discord_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_giveaway_entrants" ADD CONSTRAINT "discord_giveaway_entrants_giveaway_id_discord_giveaways_id_fk" FOREIGN KEY ("giveaway_id") REFERENCES "public"."discord_giveaways"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_giveaway_entrants" ADD CONSTRAINT "discord_giveaway_entrants_account_id_discord_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_giveaways" ADD CONSTRAINT "discord_giveaways_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_giveaways" ADD CONSTRAINT "discord_giveaways_host_account_id_discord_accounts_id_fk" FOREIGN KEY ("host_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_giveaways" ADD CONSTRAINT "discord_giveaways_channel_id_discord_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_giveaways" ADD CONSTRAINT "discord_giveaways_message_id_discord_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."discord_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_greeting_configurations" ADD CONSTRAINT "discord_greeting_configurations_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_greeting_configurations" ADD CONSTRAINT "discord_greeting_configurations_channel_id_discord_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_greeting_events" ADD CONSTRAINT "discord_greeting_events_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_greeting_events" ADD CONSTRAINT "discord_greeting_events_member_id_discord_guild_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."discord_guild_members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_level_role_rewards" ADD CONSTRAINT "discord_level_role_rewards_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_level_role_rewards" ADD CONSTRAINT "discord_level_role_rewards_role_id_discord_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."discord_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_member_levels" ADD CONSTRAINT "discord_member_levels_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_member_levels" ADD CONSTRAINT "discord_member_levels_member_id_discord_guild_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."discord_guild_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_member_reputation" ADD CONSTRAINT "discord_member_reputation_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_member_reputation" ADD CONSTRAINT "discord_member_reputation_member_id_discord_guild_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."discord_guild_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_poll_votes" ADD CONSTRAINT "discord_poll_votes_poll_id_discord_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."discord_polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_poll_votes" ADD CONSTRAINT "discord_poll_votes_voter_account_id_discord_accounts_id_fk" FOREIGN KEY ("voter_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_polls" ADD CONSTRAINT "discord_polls_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_polls" ADD CONSTRAINT "discord_polls_channel_id_discord_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_polls" ADD CONSTRAINT "discord_polls_message_id_discord_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."discord_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_polls" ADD CONSTRAINT "discord_polls_creator_account_id_discord_accounts_id_fk" FOREIGN KEY ("creator_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_reputation_events" ADD CONSTRAINT "discord_reputation_events_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_reputation_events" ADD CONSTRAINT "discord_reputation_events_receiver_member_id_discord_guild_members_id_fk" FOREIGN KEY ("receiver_member_id") REFERENCES "public"."discord_guild_members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_reputation_events" ADD CONSTRAINT "discord_reputation_events_giver_member_id_discord_guild_members_id_fk" FOREIGN KEY ("giver_member_id") REFERENCES "public"."discord_guild_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_role_assignment_configurations" ADD CONSTRAINT "discord_role_assignment_configurations_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_role_assignment_configurations" ADD CONSTRAINT "discord_role_assignment_configurations_channel_id_discord_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_role_assignment_configurations" ADD CONSTRAINT "discord_role_assignment_configurations_message_id_discord_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."discord_messages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_role_assignment_configurations" ADD CONSTRAINT "discord_role_assignment_configurations_role_id_discord_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."discord_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_scheduled_actions" ADD CONSTRAINT "discord_scheduled_actions_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_scheduled_actions" ADD CONSTRAINT "discord_scheduled_actions_account_id_discord_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_starboard_configurations" ADD CONSTRAINT "discord_starboard_configurations_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_starboard_configurations" ADD CONSTRAINT "discord_starboard_configurations_channel_id_discord_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_starboard_entries" ADD CONSTRAINT "discord_starboard_entries_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_starboard_entries" ADD CONSTRAINT "discord_starboard_entries_source_message_id_discord_messages_id_fk" FOREIGN KEY ("source_message_id") REFERENCES "public"."discord_messages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_starboard_entries" ADD CONSTRAINT "discord_starboard_entries_starboard_message_id_discord_messages_id_fk" FOREIGN KEY ("starboard_message_id") REFERENCES "public"."discord_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_suggestions" ADD CONSTRAINT "discord_suggestions_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_suggestions" ADD CONSTRAINT "discord_suggestions_author_account_id_discord_accounts_id_fk" FOREIGN KEY ("author_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_suggestions" ADD CONSTRAINT "discord_suggestions_channel_id_discord_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_suggestions" ADD CONSTRAINT "discord_suggestions_message_id_discord_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."discord_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_suggestions" ADD CONSTRAINT "discord_suggestions_reviewer_account_id_discord_accounts_id_fk" FOREIGN KEY ("reviewer_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_guild_modules" ADD CONSTRAINT "discord_guild_modules_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_guild_settings" ADD CONSTRAINT "discord_guild_settings_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_guild_sync_states" ADD CONSTRAINT "discord_guild_sync_states_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_guilds" ADD CONSTRAINT "discord_guilds_owner_account_id_discord_accounts_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_audit_log_entries" ADD CONSTRAINT "discord_audit_log_entries_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_audit_log_entries" ADD CONSTRAINT "discord_audit_log_entries_actor_account_id_discord_accounts_id_fk" FOREIGN KEY ("actor_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_emojis" ADD CONSTRAINT "discord_emojis_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_emojis" ADD CONSTRAINT "discord_emojis_creator_account_id_discord_accounts_id_fk" FOREIGN KEY ("creator_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_invites" ADD CONSTRAINT "discord_invites_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_invites" ADD CONSTRAINT "discord_invites_channel_id_discord_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_invites" ADD CONSTRAINT "discord_invites_inviter_account_id_discord_accounts_id_fk" FOREIGN KEY ("inviter_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_native_automod_rules" ADD CONSTRAINT "discord_native_automod_rules_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_native_automod_rules" ADD CONSTRAINT "discord_native_automod_rules_creator_account_id_discord_accounts_id_fk" FOREIGN KEY ("creator_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_scheduled_events" ADD CONSTRAINT "discord_scheduled_events_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_scheduled_events" ADD CONSTRAINT "discord_scheduled_events_channel_id_discord_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_scheduled_events" ADD CONSTRAINT "discord_scheduled_events_creator_account_id_discord_accounts_id_fk" FOREIGN KEY ("creator_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_soundboard_sounds" ADD CONSTRAINT "discord_soundboard_sounds_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_soundboard_sounds" ADD CONSTRAINT "discord_soundboard_sounds_creator_account_id_discord_accounts_id_fk" FOREIGN KEY ("creator_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_stage_instances" ADD CONSTRAINT "discord_stage_instances_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_stage_instances" ADD CONSTRAINT "discord_stage_instances_channel_id_discord_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_stage_instances" ADD CONSTRAINT "discord_stage_instances_scheduled_event_id_discord_scheduled_events_id_fk" FOREIGN KEY ("scheduled_event_id") REFERENCES "public"."discord_scheduled_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_stickers" ADD CONSTRAINT "discord_stickers_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_stickers" ADD CONSTRAINT "discord_stickers_creator_account_id_discord_accounts_id_fk" FOREIGN KEY ("creator_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_webhooks" ADD CONSTRAINT "discord_webhooks_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_webhooks" ADD CONSTRAINT "discord_webhooks_channel_id_discord_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_webhooks" ADD CONSTRAINT "discord_webhooks_owner_account_id_discord_accounts_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_guild_member_events" ADD CONSTRAINT "discord_guild_member_events_member_id_discord_guild_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."discord_guild_members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_guild_member_events" ADD CONSTRAINT "discord_guild_member_events_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_guild_member_events" ADD CONSTRAINT "discord_guild_member_events_actor_account_id_discord_accounts_id_fk" FOREIGN KEY ("actor_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_guild_member_role_events" ADD CONSTRAINT "discord_guild_member_role_events_member_id_discord_guild_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."discord_guild_members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_guild_member_role_events" ADD CONSTRAINT "discord_guild_member_role_events_role_id_discord_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."discord_roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_guild_member_role_events" ADD CONSTRAINT "discord_guild_member_role_events_actor_account_id_discord_accounts_id_fk" FOREIGN KEY ("actor_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_guild_member_roles" ADD CONSTRAINT "discord_guild_member_roles_member_id_discord_guild_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."discord_guild_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_guild_member_roles" ADD CONSTRAINT "discord_guild_member_roles_role_id_discord_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."discord_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_guild_members" ADD CONSTRAINT "discord_guild_members_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_guild_members" ADD CONSTRAINT "discord_guild_members_discord_account_id_discord_accounts_id_fk" FOREIGN KEY ("discord_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_roles" ADD CONSTRAINT "discord_roles_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_message_events" ADD CONSTRAINT "discord_message_events_message_id_discord_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."discord_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_message_events" ADD CONSTRAINT "discord_message_events_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_message_events" ADD CONSTRAINT "discord_message_events_channel_id_discord_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_message_events" ADD CONSTRAINT "discord_message_events_actor_account_id_discord_accounts_id_fk" FOREIGN KEY ("actor_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_messages" ADD CONSTRAINT "discord_messages_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_messages" ADD CONSTRAINT "discord_messages_channel_id_discord_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_messages" ADD CONSTRAINT "discord_messages_thread_channel_id_discord_channels_id_fk" FOREIGN KEY ("thread_channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_messages" ADD CONSTRAINT "discord_messages_author_account_id_discord_accounts_id_fk" FOREIGN KEY ("author_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_messages" ADD CONSTRAINT "discord_messages_webhook_id_discord_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."discord_webhooks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_messages" ADD CONSTRAINT "discord_messages_referenced_message_id_discord_messages_id_fk" FOREIGN KEY ("referenced_message_id") REFERENCES "public"."discord_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_reactions" ADD CONSTRAINT "discord_reactions_message_id_discord_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."discord_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_reactions" ADD CONSTRAINT "discord_reactions_account_id_discord_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_voice_sessions" ADD CONSTRAINT "discord_voice_sessions_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_voice_sessions" ADD CONSTRAINT "discord_voice_sessions_member_id_discord_guild_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."discord_guild_members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_voice_sessions" ADD CONSTRAINT "discord_voice_sessions_channel_id_discord_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_automod_rules" ADD CONSTRAINT "discord_automod_rules_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_automod_rules" ADD CONSTRAINT "discord_automod_rules_created_by_account_id_discord_accounts_id_fk" FOREIGN KEY ("created_by_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_moderation_appeals" ADD CONSTRAINT "discord_moderation_appeals_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_moderation_appeals" ADD CONSTRAINT "discord_moderation_appeals_case_id_discord_moderation_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."discord_moderation_cases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_moderation_appeals" ADD CONSTRAINT "discord_moderation_appeals_appellant_account_id_discord_accounts_id_fk" FOREIGN KEY ("appellant_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_moderation_appeals" ADD CONSTRAINT "discord_moderation_appeals_reviewer_account_id_discord_accounts_id_fk" FOREIGN KEY ("reviewer_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_moderation_cases" ADD CONSTRAINT "discord_moderation_cases_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_moderation_cases" ADD CONSTRAINT "discord_moderation_cases_target_account_id_discord_accounts_id_fk" FOREIGN KEY ("target_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_moderation_cases" ADD CONSTRAINT "discord_moderation_cases_target_member_id_discord_guild_members_id_fk" FOREIGN KEY ("target_member_id") REFERENCES "public"."discord_guild_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_moderation_cases" ADD CONSTRAINT "discord_moderation_cases_moderator_account_id_discord_accounts_id_fk" FOREIGN KEY ("moderator_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_moderation_cases" ADD CONSTRAINT "discord_moderation_cases_related_audit_log_entry_id_discord_audit_log_entries_id_fk" FOREIGN KEY ("related_audit_log_entry_id") REFERENCES "public"."discord_audit_log_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_moderation_cases" ADD CONSTRAINT "discord_moderation_cases_related_native_automod_rule_id_discord_native_automod_rules_id_fk" FOREIGN KEY ("related_native_automod_rule_id") REFERENCES "public"."discord_native_automod_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_moderation_cases" ADD CONSTRAINT "discord_moderation_cases_related_message_id_discord_messages_id_fk" FOREIGN KEY ("related_message_id") REFERENCES "public"."discord_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_moderation_cases" ADD CONSTRAINT "discord_moderation_cases_related_channel_id_discord_channels_id_fk" FOREIGN KEY ("related_channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_moderation_evidence" ADD CONSTRAINT "discord_moderation_evidence_case_id_discord_moderation_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."discord_moderation_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_moderation_evidence" ADD CONSTRAINT "discord_moderation_evidence_message_id_discord_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."discord_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_moderation_evidence" ADD CONSTRAINT "discord_moderation_evidence_collected_by_account_id_discord_accounts_id_fk" FOREIGN KEY ("collected_by_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_raid_incidents" ADD CONSTRAINT "discord_raid_incidents_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_raid_incidents" ADD CONSTRAINT "discord_raid_incidents_acknowledged_by_account_id_discord_accounts_id_fk" FOREIGN KEY ("acknowledged_by_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_ai_sessions" ADD CONSTRAINT "discord_ai_sessions_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_ai_sessions" ADD CONSTRAINT "discord_ai_sessions_channel_id_discord_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_ai_sessions" ADD CONSTRAINT "discord_ai_sessions_account_id_discord_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_ai_usage_events" ADD CONSTRAINT "discord_ai_usage_events_session_id_discord_ai_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."discord_ai_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_ai_usage_events" ADD CONSTRAINT "discord_ai_usage_events_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_ai_usage_events" ADD CONSTRAINT "discord_ai_usage_events_account_id_discord_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_music_playlists" ADD CONSTRAINT "discord_music_playlists_owner_account_id_discord_accounts_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_music_playlists" ADD CONSTRAINT "discord_music_playlists_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_music_sessions" ADD CONSTRAINT "discord_music_sessions_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_music_sessions" ADD CONSTRAINT "discord_music_sessions_voice_channel_id_discord_channels_id_fk" FOREIGN KEY ("voice_channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_music_sessions" ADD CONSTRAINT "discord_music_sessions_control_channel_id_discord_channels_id_fk" FOREIGN KEY ("control_channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_music_sessions" ADD CONSTRAINT "discord_music_sessions_initiated_by_account_id_discord_accounts_id_fk" FOREIGN KEY ("initiated_by_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_music_tracks" ADD CONSTRAINT "discord_music_tracks_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_music_tracks" ADD CONSTRAINT "discord_music_tracks_session_id_discord_music_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."discord_music_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_music_tracks" ADD CONSTRAINT "discord_music_tracks_requested_by_account_id_discord_accounts_id_fk" FOREIGN KEY ("requested_by_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_persona_guild_settings" ADD CONSTRAINT "discord_persona_guild_settings_persona_id_discord_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."discord_personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_persona_guild_settings" ADD CONSTRAINT "discord_persona_guild_settings_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_persona_proxy_patterns" ADD CONSTRAINT "discord_persona_proxy_patterns_persona_id_discord_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."discord_personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_personas" ADD CONSTRAINT "discord_personas_owner_account_id_discord_accounts_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_proxied_messages" ADD CONSTRAINT "discord_proxied_messages_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_proxied_messages" ADD CONSTRAINT "discord_proxied_messages_channel_id_discord_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_proxied_messages" ADD CONSTRAINT "discord_proxied_messages_original_author_account_id_discord_accounts_id_fk" FOREIGN KEY ("original_author_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_proxied_messages" ADD CONSTRAINT "discord_proxied_messages_persona_id_discord_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."discord_personas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_proxied_messages" ADD CONSTRAINT "discord_proxied_messages_webhook_id_discord_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."discord_webhooks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_proxied_messages" ADD CONSTRAINT "discord_proxied_messages_resulting_message_id_discord_messages_id_fk" FOREIGN KEY ("resulting_message_id") REFERENCES "public"."discord_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_ticket_events" ADD CONSTRAINT "discord_ticket_events_ticket_id_discord_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."discord_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_ticket_events" ADD CONSTRAINT "discord_ticket_events_actor_account_id_discord_accounts_id_fk" FOREIGN KEY ("actor_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_ticket_participants" ADD CONSTRAINT "discord_ticket_participants_ticket_id_discord_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."discord_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_ticket_participants" ADD CONSTRAINT "discord_ticket_participants_account_id_discord_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_tickets" ADD CONSTRAINT "discord_tickets_guild_id_discord_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."discord_guilds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_tickets" ADD CONSTRAINT "discord_tickets_creator_account_id_discord_accounts_id_fk" FOREIGN KEY ("creator_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_tickets" ADD CONSTRAINT "discord_tickets_assigned_staff_account_id_discord_accounts_id_fk" FOREIGN KEY ("assigned_staff_account_id") REFERENCES "public"."discord_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_tickets" ADD CONSTRAINT "discord_tickets_channel_id_discord_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."discord_channels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "discord_accounts_user_id_unique" ON "discord_accounts" USING btree ("discord_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_accounts_connected_account_unique" ON "discord_accounts" USING btree ("user_account_id");--> statement-breakpoint
CREATE INDEX "discord_accounts_last_seen_idx" ON "discord_accounts" USING btree ("last_seen_at");--> statement-breakpoint
CREATE INDEX "discord_age_events_verification_time_idx" ON "discord_age_verification_events" USING btree ("verification_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_age_verifications_account_unique" ON "discord_age_verifications" USING btree ("discord_account_id");--> statement-breakpoint
CREATE INDEX "discord_age_verifications_status_idx" ON "discord_age_verifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "discord_age_verifications_expires_idx" ON "discord_age_verifications" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_user_settings_account_unique" ON "discord_user_settings" USING btree ("discord_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_channel_analytics_period_unique" ON "discord_channel_analytics_snapshots" USING btree ("channel_id","granularity","period_start");--> statement-breakpoint
CREATE INDEX "discord_channel_analytics_range_idx" ON "discord_channel_analytics_snapshots" USING btree ("guild_id","channel_id","period_start");--> statement-breakpoint
CREATE INDEX "discord_commands_guild_time_idx" ON "discord_command_executions" USING btree ("guild_id","started_at");--> statement-breakpoint
CREATE INDEX "discord_commands_name_time_idx" ON "discord_command_executions" USING btree ("command_name","started_at");--> statement-breakpoint
CREATE INDEX "discord_commands_account_time_idx" ON "discord_command_executions" USING btree ("account_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_guild_analytics_period_unique" ON "discord_guild_analytics_snapshots" USING btree ("guild_id","granularity","period_start");--> statement-breakpoint
CREATE INDEX "discord_guild_analytics_range_idx" ON "discord_guild_analytics_snapshots" USING btree ("guild_id","period_start");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_member_analytics_period_unique" ON "discord_member_analytics_snapshots" USING btree ("member_id","granularity","period_start");--> statement-breakpoint
CREATE INDEX "discord_member_analytics_range_idx" ON "discord_member_analytics_snapshots" USING btree ("guild_id","member_id","period_start");--> statement-breakpoint
CREATE INDEX "discord_member_analytics_expiry_idx" ON "discord_member_analytics_snapshots" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_presence_guild_capture_unique" ON "discord_presence_snapshots" USING btree ("guild_id","captured_at");--> statement-breakpoint
CREATE INDEX "discord_presence_guild_time_idx" ON "discord_presence_snapshots" USING btree ("guild_id","captured_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_channel_overwrite_target_unique" ON "discord_channel_permission_overwrites" USING btree ("channel_id","target_discord_id","target_type");--> statement-breakpoint
CREATE INDEX "discord_channel_overwrites_guild_idx" ON "discord_channel_permission_overwrites" USING btree ("guild_id");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_channels_discord_id_unique" ON "discord_channels" USING btree ("discord_channel_id");--> statement-breakpoint
CREATE INDEX "discord_channels_guild_type_idx" ON "discord_channels" USING btree ("guild_id","channel_type");--> statement-breakpoint
CREATE INDEX "discord_channels_parent_idx" ON "discord_channels" USING btree ("parent_channel_id");--> statement-breakpoint
CREATE INDEX "discord_channels_guild_deleted_idx" ON "discord_channels" USING btree ("guild_id","deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_forum_post_thread_unique" ON "discord_forum_post_state" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "discord_forum_post_activity_idx" ON "discord_forum_post_state" USING btree ("forum_channel_id","last_activity_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_forum_tags_discord_id_unique" ON "discord_forum_tags" USING btree ("discord_tag_id");--> statement-breakpoint
CREATE INDEX "discord_forum_tags_channel_idx" ON "discord_forum_tags" USING btree ("forum_channel_id","deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_threads_channel_unique" ON "discord_threads" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "discord_threads_parent_archive_idx" ON "discord_threads" USING btree ("parent_channel_id","archived");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_autoroles_guild_role_unique" ON "discord_autoroles" USING btree ("guild_id","role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_custom_commands_guild_name_unique" ON "discord_custom_commands" USING btree ("guild_id","name");--> statement-breakpoint
CREATE INDEX "discord_feeds_guild_provider_idx" ON "discord_feed_configurations" USING btree ("guild_id","provider","enabled");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_giveaway_entrant_unique" ON "discord_giveaway_entrants" USING btree ("giveaway_id","account_id");--> statement-breakpoint
CREATE INDEX "discord_giveaways_guild_status_idx" ON "discord_giveaways" USING btree ("guild_id","status","ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_greeting_guild_type_unique" ON "discord_greeting_configurations" USING btree ("guild_id","greeting_type");--> statement-breakpoint
CREATE INDEX "discord_greeting_events_guild_time_idx" ON "discord_greeting_events" USING btree ("guild_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_level_rewards_guild_level_unique" ON "discord_level_role_rewards" USING btree ("guild_id","level");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_member_levels_member_unique" ON "discord_member_levels" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "discord_member_levels_guild_rank_idx" ON "discord_member_levels" USING btree ("guild_id","lifetime_xp");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_member_reputation_member_unique" ON "discord_member_reputation" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "discord_member_reputation_guild_score_idx" ON "discord_member_reputation" USING btree ("guild_id","score");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_poll_vote_option_unique" ON "discord_poll_votes" USING btree ("poll_id","voter_key_hash","option_key");--> statement-breakpoint
CREATE INDEX "discord_polls_guild_status_idx" ON "discord_polls" USING btree ("guild_id","status");--> statement-breakpoint
CREATE INDEX "discord_reputation_events_receiver_idx" ON "discord_reputation_events" USING btree ("receiver_member_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_role_assignment_trigger_unique" ON "discord_role_assignment_configurations" USING btree ("message_id","trigger_key");--> statement-breakpoint
CREATE INDEX "discord_scheduled_actions_due_idx" ON "discord_scheduled_actions" USING btree ("status","execute_at");--> statement-breakpoint
CREATE INDEX "discord_scheduled_actions_guild_idx" ON "discord_scheduled_actions" USING btree ("guild_id","execute_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_starboard_config_guild_unique" ON "discord_starboard_configurations" USING btree ("guild_id");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_starboard_source_unique" ON "discord_starboard_entries" USING btree ("source_message_id");--> statement-breakpoint
CREATE INDEX "discord_starboard_guild_count_idx" ON "discord_starboard_entries" USING btree ("guild_id","star_count");--> statement-breakpoint
CREATE INDEX "discord_suggestions_guild_status_idx" ON "discord_suggestions" USING btree ("guild_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_guild_modules_key_unique" ON "discord_guild_modules" USING btree ("guild_id","module_key");--> statement-breakpoint
CREATE INDEX "discord_guild_modules_enabled_idx" ON "discord_guild_modules" USING btree ("guild_id","enabled");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_guild_settings_guild_unique" ON "discord_guild_settings" USING btree ("guild_id");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_guild_sync_resource_unique" ON "discord_guild_sync_states" USING btree ("guild_id","resource");--> statement-breakpoint
CREATE INDEX "discord_guild_sync_status_idx" ON "discord_guild_sync_states" USING btree ("status","last_attempt_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_guilds_discord_id_unique" ON "discord_guilds" USING btree ("discord_guild_id");--> statement-breakpoint
CREATE INDEX "discord_guilds_owner_account_idx" ON "discord_guilds" USING btree ("owner_account_id");--> statement-breakpoint
CREATE INDEX "discord_guilds_installation_idx" ON "discord_guilds" USING btree ("is_bot_installed","deleted_at");--> statement-breakpoint
CREATE INDEX "discord_guilds_discovery_idx" ON "discord_guilds" USING btree ("is_discoverable","deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_audit_entries_discord_id_unique" ON "discord_audit_log_entries" USING btree ("discord_entry_id");--> statement-breakpoint
CREATE INDEX "discord_audit_entries_guild_time_idx" ON "discord_audit_log_entries" USING btree ("guild_id","discord_created_at");--> statement-breakpoint
CREATE INDEX "discord_audit_entries_target_idx" ON "discord_audit_log_entries" USING btree ("guild_id","target_discord_id");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_emojis_discord_id_unique" ON "discord_emojis" USING btree ("discord_emoji_id");--> statement-breakpoint
CREATE INDEX "discord_emojis_guild_deleted_idx" ON "discord_emojis" USING btree ("guild_id","deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_invites_code_unique" ON "discord_invites" USING btree ("code");--> statement-breakpoint
CREATE INDEX "discord_invites_guild_active_idx" ON "discord_invites" USING btree ("guild_id","revoked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_native_automod_id_unique" ON "discord_native_automod_rules" USING btree ("discord_rule_id");--> statement-breakpoint
CREATE INDEX "discord_native_automod_guild_enabled_idx" ON "discord_native_automod_rules" USING btree ("guild_id","enabled");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_scheduled_events_id_unique" ON "discord_scheduled_events" USING btree ("discord_event_id");--> statement-breakpoint
CREATE INDEX "discord_scheduled_events_guild_start_idx" ON "discord_scheduled_events" USING btree ("guild_id","scheduled_start_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_soundboard_discord_id_unique" ON "discord_soundboard_sounds" USING btree ("discord_sound_id");--> statement-breakpoint
CREATE INDEX "discord_soundboard_guild_deleted_idx" ON "discord_soundboard_sounds" USING btree ("guild_id","deleted_at");--> statement-breakpoint
CREATE INDEX "discord_stage_instances_guild_time_idx" ON "discord_stage_instances" USING btree ("guild_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_stickers_discord_id_unique" ON "discord_stickers" USING btree ("discord_sticker_id");--> statement-breakpoint
CREATE INDEX "discord_stickers_guild_deleted_idx" ON "discord_stickers" USING btree ("guild_id","deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_webhooks_discord_id_unique" ON "discord_webhooks" USING btree ("discord_webhook_id");--> statement-breakpoint
CREATE INDEX "discord_webhooks_guild_purpose_idx" ON "discord_webhooks" USING btree ("guild_id","purpose");--> statement-breakpoint
CREATE INDEX "discord_webhooks_channel_idx" ON "discord_webhooks" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "discord_member_events_member_time_idx" ON "discord_guild_member_events" USING btree ("member_id","occurred_at");--> statement-breakpoint
CREATE INDEX "discord_member_events_guild_time_idx" ON "discord_guild_member_events" USING btree ("guild_id","occurred_at");--> statement-breakpoint
CREATE INDEX "discord_member_role_events_member_time_idx" ON "discord_guild_member_role_events" USING btree ("member_id","occurred_at");--> statement-breakpoint
CREATE INDEX "discord_member_roles_role_active_idx" ON "discord_guild_member_roles" USING btree ("role_id","active");--> statement-breakpoint
CREATE INDEX "discord_member_roles_expiry_idx" ON "discord_guild_member_roles" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_members_guild_account_unique" ON "discord_guild_members" USING btree ("guild_id","discord_account_id");--> statement-breakpoint
CREATE INDEX "discord_members_guild_status_idx" ON "discord_guild_members" USING btree ("guild_id","status");--> statement-breakpoint
CREATE INDEX "discord_members_account_status_idx" ON "discord_guild_members" USING btree ("discord_account_id","status");--> statement-breakpoint
CREATE INDEX "discord_members_guild_user_idx" ON "discord_guild_members" USING btree ("guild_id","discord_user_id");--> statement-breakpoint
CREATE INDEX "discord_members_last_seen_idx" ON "discord_guild_members" USING btree ("guild_id","last_seen_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_roles_discord_id_unique" ON "discord_roles" USING btree ("discord_role_id");--> statement-breakpoint
CREATE INDEX "discord_roles_guild_position_idx" ON "discord_roles" USING btree ("guild_id","position");--> statement-breakpoint
CREATE INDEX "discord_roles_guild_deleted_idx" ON "discord_roles" USING btree ("guild_id","deleted_at");--> statement-breakpoint
CREATE INDEX "discord_message_events_guild_time_idx" ON "discord_message_events" USING btree ("guild_id","occurred_at");--> statement-breakpoint
CREATE INDEX "discord_message_events_message_time_idx" ON "discord_message_events" USING btree ("message_id","occurred_at");--> statement-breakpoint
CREATE INDEX "discord_message_events_expiry_idx" ON "discord_message_events" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_messages_discord_id_unique" ON "discord_messages" USING btree ("discord_message_id");--> statement-breakpoint
CREATE INDEX "discord_messages_guild_time_idx" ON "discord_messages" USING btree ("guild_id","discord_created_at");--> statement-breakpoint
CREATE INDEX "discord_messages_channel_time_idx" ON "discord_messages" USING btree ("channel_id","discord_created_at");--> statement-breakpoint
CREATE INDEX "discord_messages_author_time_idx" ON "discord_messages" USING btree ("author_account_id","discord_created_at");--> statement-breakpoint
CREATE INDEX "discord_messages_content_purge_idx" ON "discord_messages" USING btree ("content_purge_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_reactions_message_user_emoji_unique" ON "discord_reactions" USING btree ("message_id","account_id","emoji_key");--> statement-breakpoint
CREATE INDEX "discord_reactions_message_active_idx" ON "discord_reactions" USING btree ("message_id","removed_at");--> statement-breakpoint
CREATE INDEX "discord_voice_sessions_guild_time_idx" ON "discord_voice_sessions" USING btree ("guild_id","started_at");--> statement-breakpoint
CREATE INDEX "discord_voice_sessions_member_time_idx" ON "discord_voice_sessions" USING btree ("member_id","started_at");--> statement-breakpoint
CREATE INDEX "discord_voice_sessions_channel_time_idx" ON "discord_voice_sessions" USING btree ("channel_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_automod_rules_guild_name_unique" ON "discord_automod_rules" USING btree ("guild_id","name");--> statement-breakpoint
CREATE INDEX "discord_automod_rules_guild_enabled_idx" ON "discord_automod_rules" USING btree ("guild_id","enabled","priority");--> statement-breakpoint
CREATE INDEX "discord_mod_appeals_guild_status_idx" ON "discord_moderation_appeals" USING btree ("guild_id","status");--> statement-breakpoint
CREATE INDEX "discord_mod_appeals_case_idx" ON "discord_moderation_appeals" USING btree ("case_id");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_mod_cases_guild_number_unique" ON "discord_moderation_cases" USING btree ("guild_id","case_number");--> statement-breakpoint
CREATE INDEX "discord_mod_cases_guild_status_idx" ON "discord_moderation_cases" USING btree ("guild_id","status");--> statement-breakpoint
CREATE INDEX "discord_mod_cases_target_time_idx" ON "discord_moderation_cases" USING btree ("target_account_id","created_at");--> statement-breakpoint
CREATE INDEX "discord_mod_cases_expiry_idx" ON "discord_moderation_cases" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "discord_mod_evidence_case_idx" ON "discord_moderation_evidence" USING btree ("case_id","captured_at");--> statement-breakpoint
CREATE INDEX "discord_mod_evidence_purge_idx" ON "discord_moderation_evidence" USING btree ("purge_at");--> statement-breakpoint
CREATE INDEX "discord_raid_incidents_guild_time_idx" ON "discord_raid_incidents" USING btree ("guild_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_ai_sessions_core_ref_unique" ON "discord_ai_sessions" USING btree ("aerealith_session_reference");--> statement-breakpoint
CREATE INDEX "discord_ai_sessions_guild_time_idx" ON "discord_ai_sessions" USING btree ("guild_id","started_at");--> statement-breakpoint
CREATE INDEX "discord_ai_sessions_account_time_idx" ON "discord_ai_sessions" USING btree ("account_id","started_at");--> statement-breakpoint
CREATE INDEX "discord_ai_usage_guild_time_idx" ON "discord_ai_usage_events" USING btree ("guild_id","occurred_at");--> statement-breakpoint
CREATE INDEX "discord_ai_usage_account_time_idx" ON "discord_ai_usage_events" USING btree ("account_id","occurred_at");--> statement-breakpoint
CREATE INDEX "discord_music_playlists_owner_idx" ON "discord_music_playlists" USING btree ("owner_account_id","deleted_at");--> statement-breakpoint
CREATE INDEX "discord_music_sessions_guild_time_idx" ON "discord_music_sessions" USING btree ("guild_id","started_at");--> statement-breakpoint
CREATE INDEX "discord_music_tracks_session_time_idx" ON "discord_music_tracks" USING btree ("session_id","requested_at");--> statement-breakpoint
CREATE INDEX "discord_music_tracks_guild_time_idx" ON "discord_music_tracks" USING btree ("guild_id","requested_at");--> statement-breakpoint
CREATE INDEX "discord_music_tracks_requester_idx" ON "discord_music_tracks" USING btree ("requested_by_account_id","requested_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_persona_guild_unique" ON "discord_persona_guild_settings" USING btree ("persona_id","guild_id");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_proxy_patterns_persona_pattern_unique" ON "discord_persona_proxy_patterns" USING btree ("persona_id","prefix","suffix");--> statement-breakpoint
CREATE INDEX "discord_proxy_patterns_enabled_idx" ON "discord_persona_proxy_patterns" USING btree ("enabled","priority");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_personas_owner_name_unique" ON "discord_personas" USING btree ("owner_account_id","name");--> statement-breakpoint
CREATE INDEX "discord_personas_owner_status_idx" ON "discord_personas" USING btree ("owner_account_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_proxied_messages_result_unique" ON "discord_proxied_messages" USING btree ("resulting_discord_message_id");--> statement-breakpoint
CREATE INDEX "discord_proxied_messages_owner_idx" ON "discord_proxied_messages" USING btree ("original_author_account_id","created_at");--> statement-breakpoint
CREATE INDEX "discord_proxied_messages_guild_idx" ON "discord_proxied_messages" USING btree ("guild_id","created_at");--> statement-breakpoint
CREATE INDEX "discord_ticket_events_ticket_time_idx" ON "discord_ticket_events" USING btree ("ticket_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_ticket_participant_unique" ON "discord_ticket_participants" USING btree ("ticket_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_tickets_guild_number_unique" ON "discord_tickets" USING btree ("guild_id","ticket_number");--> statement-breakpoint
CREATE INDEX "discord_tickets_guild_status_idx" ON "discord_tickets" USING btree ("guild_id","status","created_at");--> statement-breakpoint
CREATE INDEX "discord_tickets_creator_idx" ON "discord_tickets" USING btree ("creator_account_id","created_at");