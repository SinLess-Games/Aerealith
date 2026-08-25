CREATE TYPE "public"."profile_status" AS ENUM('pending_setup', 'active', 'hidden', 'disabled', 'suspended', 'under_review', 'archived', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."user_account_status" AS ENUM('active', 'revoked', 'suspended', 'expired');--> statement-breakpoint
CREATE TYPE "public"."user_consent_type" AS ENUM('terms_of_service', 'privacy_policy', 'marketing_emails', 'product_updates', 'analytics', 'cookies');--> statement-breakpoint
CREATE TYPE "public"."user_lifecycle_status" AS ENUM('active', 'disabled', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('guest', 'user', 'support', 'moderator', 'developer', 'admin', 'super_admin', 'service', 'system');--> statement-breakpoint
CREATE TYPE "public"."user_tier" AS ENUM('basic', 'basic_plus', 'premium', 'premium_plus', 'pro', 'pro_plus');--> statement-breakpoint
CREATE TABLE "waitlist_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(100) NOT NULL,
	"account_id" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"management_url" text,
	"status" "user_account_status" DEFAULT 'active' NOT NULL,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "user_consent_type" NOT NULL,
	"version" varchar(100),
	"granted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"locale" varchar(100),
	"timezone" varchar(100),
	"timezone_utc" varchar(16),
	"timezone_greenwich" varchar(16),
	"date_format" varchar(50) DEFAULT 'yyyy-MM-dd' NOT NULL,
	"time_format" varchar(50) DEFAULT '12-hour' NOT NULL,
	"week_start_day" varchar(50) DEFAULT 'locale_default' NOT NULL,
	"name_display_order" varchar(50) DEFAULT 'locale_default' NOT NULL,
	"measurement_system" varchar(50) DEFAULT 'metric' NOT NULL,
	"content_maturity" varchar(50) DEFAULT 'family_friendly' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"handle" varchar(32) NOT NULL,
	"display_name" varchar(100),
	"given_name" varchar(100),
	"middle_name" varchar(100),
	"family_name" varchar(100),
	"pronouns" varchar(100),
	"avatar_url" text,
	"banner_url" text,
	"bio" text,
	"status" "profile_status" DEFAULT 'pending_setup' NOT NULL,
	"field_visibility" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"location_label" varchar(255),
	"country" varchar(100),
	"gender" varchar(100),
	"sex" varchar(100),
	"sexuality" varchar(100),
	"romantic_orientation" varchar(100),
	"sex_attitude" varchar(100),
	"languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"website_url" text,
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"device_name" varchar(255),
	"user_agent" text,
	"ip_address" varchar(45),
	"geo_ip" jsonb,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"metadata" jsonb DEFAULT '{"schemaVersion":1}'::jsonb NOT NULL,
	"accessibility" jsonb DEFAULT '{"reduceMotion":false,"highContrast":false,"textScale":1}'::jsonb NOT NULL,
	"appearance" jsonb DEFAULT '{"theme":"system","compactMode":false}'::jsonb NOT NULL,
	"communication" jsonb DEFAULT '{"progressUpdates":true,"quietMode":false}'::jsonb NOT NULL,
	"notifications" jsonb DEFAULT '{"email":true,"push":false,"productUpdates":true,"securityAlerts":true}'::jsonb NOT NULL,
	"privacy" jsonb DEFAULT '{"analytics":false,"personalization":true}'::jsonb NOT NULL,
	"security" jsonb DEFAULT '{"mfaEnabled":false}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(32) NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" text,
	"status" "user_lifecycle_status" DEFAULT 'active' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verified_at" timestamp with time zone,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"tier" "user_tier" DEFAULT 'basic' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_entries_email_unique" ON "waitlist_entries" USING btree ("email");--> statement-breakpoint
CREATE INDEX "waitlist_entries_created_at_index" ON "waitlist_entries" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_accounts_provider_account_id_unique" ON "user_accounts" USING btree ("provider","account_id");--> statement-breakpoint
CREATE INDEX "user_accounts_user_id_index" ON "user_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_accounts_status_index" ON "user_accounts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_accounts_connected_at_index" ON "user_accounts" USING btree ("connected_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_consents_user_id_type_unique" ON "user_consents" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "user_consents_user_id_index" ON "user_consents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_consents_type_index" ON "user_consents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "user_consents_granted_at_index" ON "user_consents" USING btree ("granted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_preferences_user_id_unique" ON "user_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_preferences_locale_index" ON "user_preferences" USING btree ("locale");--> statement-breakpoint
CREATE UNIQUE INDEX "user_profiles_user_id_unique" ON "user_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_profiles_handle_unique" ON "user_profiles" USING btree ("handle");--> statement-breakpoint
CREATE INDEX "user_profiles_status_index" ON "user_profiles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_profiles_country_index" ON "user_profiles" USING btree ("country");--> statement-breakpoint
CREATE INDEX "user_profiles_created_at_index" ON "user_profiles" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_sessions_token_hash_unique" ON "user_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "user_sessions_user_id_index" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_sessions_user_id_revoked_at_index" ON "user_sessions" USING btree ("user_id","revoked_at");--> statement-breakpoint
CREATE INDEX "user_sessions_expires_at_index" ON "user_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "user_sessions_last_seen_at_index" ON "user_sessions" USING btree ("last_seen_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_settings_user_id_unique" ON "user_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_settings_created_at_index" ON "user_settings" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_unique" ON "users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_status_index" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_created_at_index" ON "users" USING btree ("created_at");