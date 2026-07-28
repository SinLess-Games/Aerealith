CREATE TABLE "user_email_verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_email_verification_tokens" ADD CONSTRAINT "user_email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_verification_tokens_token_hash_unique" ON "user_email_verification_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "user_email_verification_tokens_user_id_index" ON "user_email_verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_email_verification_tokens_expires_at_index" ON "user_email_verification_tokens" USING btree ("expires_at");