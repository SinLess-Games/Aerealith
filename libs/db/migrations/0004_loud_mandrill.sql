CREATE TABLE "user_password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_password_reset_tokens" ADD CONSTRAINT "user_password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_password_reset_tokens_token_hash_unique" ON "user_password_reset_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "user_password_reset_tokens_user_id_index" ON "user_password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_password_reset_tokens_expires_at_index" ON "user_password_reset_tokens" USING btree ("expires_at");
--> statement-breakpoint
-- Add the self-service account write capability without rewriting the baseline migration.
INSERT INTO "permissions" ("key", "resource", "action", "display_name", "description", "system")
VALUES (
  'account.update',
  'account',
  'update',
  'Update own account',
  'Update the authenticated principal account.',
  true
)
ON CONFLICT DO NOTHING;
--> statement-breakpoint
-- Baseline users need self-service account and session access; inherited roles receive it too.
INSERT INTO "role_permissions" ("role_id", "permission_id", "assigned_by")
SELECT role."id", permission."id", 'migration:password-reset-and-session-access'
FROM "roles" role
JOIN "permissions" permission ON permission."key" IN (
  'account.update',
  'sessions.read',
  'sessions.revoke',
  'sessions.revoke_all'
)
WHERE role."key" = 'user'
ON CONFLICT DO NOTHING;
