CREATE TABLE "newsletter_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"source" varchar(100) DEFAULT 'waitlist' NOT NULL,
	"subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "waitlist_entries" ADD COLUMN "role" varchar(100);--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_recipients_email_unique" ON "newsletter_recipients" USING btree ("email");--> statement-breakpoint
CREATE INDEX "newsletter_recipients_subscribed_at_index" ON "newsletter_recipients" USING btree ("subscribed_at");