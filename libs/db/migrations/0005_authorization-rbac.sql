-- libs/db/migrations/0005_authorization-rbac.sql

/*
 * Authorization/RBAC normalization.
 *
 * IMPORTANT:
 * This migration assumes migrations 0000 through 0004 have been applied
 * successfully.
 *
 * principal_roles is intentionally removed and replaced by:
 *
 *   platform_role_assignments
 *   organization_members
 *   organization_member_roles
 *
 * The existing authorization catalog is preserved and normalized. Canonical
 * platform and organization roles/permissions are synchronized separately by
 * the authorization seed.
 */

-- ============================================================================
-- Organization authorization tables
-- ============================================================================

CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"added_by_user_id" uuid,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_status_check"
		CHECK ("status" IN ('active', 'suspended'))
);
--> statement-breakpoint

CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"created_by_user_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "organizations_status_check"
		CHECK ("status" IN ('active', 'suspended', 'archived')),
	CONSTRAINT "organizations_name_not_blank_check"
		CHECK (length(trim("name")) > 0),
	CONSTRAINT "organizations_slug_not_blank_check"
		CHECK (length(trim("slug")) > 0)
);
--> statement-breakpoint

CREATE TABLE "organization_member_roles" (
	"organization_member_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_by_user_id" uuid,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "organization_member_roles_pk"
		PRIMARY KEY ("organization_member_id", "role_id")
);
--> statement-breakpoint

CREATE TABLE "platform_role_assignments" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_by_user_id" uuid,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "platform_role_assignments_pk"
		PRIMARY KEY ("user_id", "role_id")
);
--> statement-breakpoint

-- ============================================================================
-- Remove deprecated generalized assignments
-- ============================================================================

/*
 * principal_roles represented the old generalized assignment model.
 *
 * Do not rename this table into either of the new assignment tables.
 */
DROP TABLE "principal_roles" CASCADE;
--> statement-breakpoint

-- ============================================================================
-- Normalize permissions
-- ============================================================================

/*
 * Preserve the existing system flag.
 */
ALTER TABLE "permissions"
	RENAME COLUMN "system" TO "is_system";
--> statement-breakpoint

/*
 * Scope is genuinely new.
 *
 * Add it nullable first so existing permission records can be backfilled.
 */
ALTER TABLE "permissions"
	ADD COLUMN "scope" varchar(32);
--> statement-breakpoint

/*
 * Existing organization.* permissions are organization scoped.
 *
 * Legacy permissions use other namespaces and remain platform scoped.
 * The canonical seed later inserts the normalized permission catalog.
 */
UPDATE "permissions"
SET "scope" = CASE
	WHEN "key" LIKE 'organization.%'
		THEN 'organization'
	ELSE 'platform'
END
WHERE "scope" IS NULL;
--> statement-breakpoint

ALTER TABLE "permissions"
	ALTER COLUMN "scope" SET NOT NULL;
--> statement-breakpoint

/*
 * The old key-format constraint belongs to the previous permission schema.
 * The canonical permission catalog and unique key constraint remain the
 * authoritative permission identity.
 */
ALTER TABLE "permissions"
	DROP CONSTRAINT "permissions_key_format_check";
--> statement-breakpoint

/*
 * Remove the old resource/action index before replacing it with scoped
 * resource/action uniqueness.
 */
DROP INDEX "permissions_resource_action_index";
--> statement-breakpoint

/*
 * Do NOT narrow resource/action from varchar(80) to varchar(64) here.
 *
 * CockroachDB places restrictions on ALTER COLUMN TYPE, and these columns do
 * not need to be narrowed for authorization correctness.
 */
CREATE UNIQUE INDEX "permissions_scope_resource_action_unique"
	ON "permissions"
	USING btree ("scope", "resource", "action");
--> statement-breakpoint

CREATE INDEX "permissions_scope_idx"
	ON "permissions"
	USING btree ("scope");
--> statement-breakpoint

CREATE INDEX "permissions_resource_idx"
	ON "permissions"
	USING btree ("resource");
--> statement-breakpoint

ALTER TABLE "permissions"
	DROP COLUMN "display_name";
--> statement-breakpoint

ALTER TABLE "permissions"
	DROP COLUMN "enabled";
--> statement-breakpoint

ALTER TABLE "permissions"
	DROP COLUMN "deleted_at";
--> statement-breakpoint

ALTER TABLE "permissions"
	ADD CONSTRAINT "permissions_scope_check"
	CHECK ("scope" IN ('platform', 'organization'));
--> statement-breakpoint

-- ============================================================================
-- Normalize roles
-- ============================================================================

ALTER TABLE "roles"
	RENAME COLUMN "display_name" TO "name";
--> statement-breakpoint

ALTER TABLE "roles"
	RENAME COLUMN "key" TO "slug";
--> statement-breakpoint

ALTER TABLE "roles"
	RENAME COLUMN "system" TO "is_system";
--> statement-breakpoint

/*
 * Scope is new and must be populated before NOT NULL is enforced.
 */
ALTER TABLE "roles"
	ADD COLUMN "scope" varchar(32);
--> statement-breakpoint

ALTER TABLE "roles"
	ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;
--> statement-breakpoint

/*
 * The roles that existed before this migration were platform authorization
 * roles. Organization roles are introduced by the canonical authorization
 * seed after this migration.
 *
 * Keep the explicit organization-role fallback here so this migration remains
 * safe if any canonical organization roles already exist.
 */
UPDATE "roles"
SET "scope" = CASE
	WHEN "slug" IN (
		'owner',
		'admin',
		'manager',
		'member',
		'viewer'
	)
		THEN 'organization'
	ELSE 'platform'
END
WHERE "scope" IS NULL;
--> statement-breakpoint

ALTER TABLE "roles"
	ALTER COLUMN "scope" SET NOT NULL;
--> statement-breakpoint

/*
 * administrative_rank is being removed, so its check constraint must be
 * removed first.
 */
ALTER TABLE "roles"
	DROP CONSTRAINT "roles_administrative_rank_check";
--> statement-breakpoint

/*
 * A globally unique slug prevents platform and organization roles from
 * legitimately sharing a slug. Replace it with scope + slug uniqueness.
 */
DROP INDEX "roles_key_unique";
--> statement-breakpoint

CREATE UNIQUE INDEX "roles_scope_slug_unique"
	ON "roles"
	USING btree ("scope", "slug");
--> statement-breakpoint

CREATE INDEX "roles_scope_idx"
	ON "roles"
	USING btree ("scope");
--> statement-breakpoint

CREATE INDEX "roles_scope_system_idx"
	ON "roles"
	USING btree ("scope", "is_system");
--> statement-breakpoint

ALTER TABLE "roles"
	DROP COLUMN "assignable";
--> statement-breakpoint

ALTER TABLE "roles"
	DROP COLUMN "administrative_rank";
--> statement-breakpoint

ALTER TABLE "roles"
	DROP COLUMN "enabled";
--> statement-breakpoint

ALTER TABLE "roles"
	DROP COLUMN "deleted_at";
--> statement-breakpoint

ALTER TABLE "roles"
	ADD CONSTRAINT "roles_scope_check"
	CHECK ("scope" IN ('platform', 'organization'));
--> statement-breakpoint

ALTER TABLE "roles"
	ADD CONSTRAINT "roles_platform_not_default_check"
	CHECK (
		"scope" <> 'platform'
		OR "is_default" = false
	);
--> statement-breakpoint

-- ============================================================================
-- Normalize role_permissions
-- ============================================================================

/*
 * role_permissions already has the correct primary key:
 *
 *   (role_id, permission_id)
 *
 * There is no reason to drop and recreate it.
 */

ALTER TABLE "role_permissions"
	ADD COLUMN "created_at"
	timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint

/*
 * assigned_by and assigned_at belonged to the old mutable-grant model.
 *
 * Canonical role_permissions is now only the relationship between a role and
 * permission plus creation time.
 */
ALTER TABLE "role_permissions"
	DROP COLUMN "assigned_by";
--> statement-breakpoint

ALTER TABLE "role_permissions"
	DROP COLUMN "assigned_at";
--> statement-breakpoint

/*
 * Replace the old index name with the canonical index name.
 */
DROP INDEX "role_permissions_permission_id_index";
--> statement-breakpoint

CREATE INDEX "role_permissions_permission_id_idx"
	ON "role_permissions"
	USING btree ("permission_id");
--> statement-breakpoint

-- ============================================================================
-- Organization foreign keys
-- ============================================================================

ALTER TABLE "organization_members"
	ADD CONSTRAINT
	"organization_members_organization_id_organizations_id_fk"
	FOREIGN KEY ("organization_id")
	REFERENCES "public"."organizations" ("id")
	ON DELETE cascade
	ON UPDATE cascade;
--> statement-breakpoint

ALTER TABLE "organization_members"
	ADD CONSTRAINT
	"organization_members_user_id_users_id_fk"
	FOREIGN KEY ("user_id")
	REFERENCES "public"."users" ("id")
	ON DELETE cascade
	ON UPDATE cascade;
--> statement-breakpoint

ALTER TABLE "organization_members"
	ADD CONSTRAINT
	"organization_members_added_by_user_id_users_id_fk"
	FOREIGN KEY ("added_by_user_id")
	REFERENCES "public"."users" ("id")
	ON DELETE set null
	ON UPDATE cascade;
--> statement-breakpoint

ALTER TABLE "organizations"
	ADD CONSTRAINT
	"organizations_created_by_user_id_users_id_fk"
	FOREIGN KEY ("created_by_user_id")
	REFERENCES "public"."users" ("id")
	ON DELETE set null
	ON UPDATE cascade;
--> statement-breakpoint

ALTER TABLE "organization_member_roles"
	ADD CONSTRAINT
	"organization_member_roles_organization_member_id_organization_members_id_fk"
	FOREIGN KEY ("organization_member_id")
	REFERENCES "public"."organization_members" ("id")
	ON DELETE cascade
	ON UPDATE cascade;
--> statement-breakpoint

ALTER TABLE "organization_member_roles"
	ADD CONSTRAINT
	"organization_member_roles_role_id_roles_id_fk"
	FOREIGN KEY ("role_id")
	REFERENCES "public"."roles" ("id")
	ON DELETE cascade
	ON UPDATE cascade;
--> statement-breakpoint

ALTER TABLE "organization_member_roles"
	ADD CONSTRAINT
	"organization_member_roles_assigned_by_user_id_users_id_fk"
	FOREIGN KEY ("assigned_by_user_id")
	REFERENCES "public"."users" ("id")
	ON DELETE set null
	ON UPDATE cascade;
--> statement-breakpoint

-- ============================================================================
-- Platform role assignment foreign keys
-- ============================================================================

ALTER TABLE "platform_role_assignments"
	ADD CONSTRAINT
	"platform_role_assignments_user_id_users_id_fk"
	FOREIGN KEY ("user_id")
	REFERENCES "public"."users" ("id")
	ON DELETE cascade
	ON UPDATE cascade;
--> statement-breakpoint

ALTER TABLE "platform_role_assignments"
	ADD CONSTRAINT
	"platform_role_assignments_role_id_roles_id_fk"
	FOREIGN KEY ("role_id")
	REFERENCES "public"."roles" ("id")
	ON DELETE cascade
	ON UPDATE cascade;
--> statement-breakpoint

ALTER TABLE "platform_role_assignments"
	ADD CONSTRAINT
	"platform_role_assignments_assigned_by_user_id_users_id_fk"
	FOREIGN KEY ("assigned_by_user_id")
	REFERENCES "public"."users" ("id")
	ON DELETE set null
	ON UPDATE cascade;
--> statement-breakpoint

-- ============================================================================
-- Organization indexes
-- ============================================================================

CREATE UNIQUE INDEX "organization_members_organization_user_unique"
	ON "organization_members"
	USING btree ("organization_id", "user_id");
--> statement-breakpoint

CREATE INDEX "organization_members_organization_id_idx"
	ON "organization_members"
	USING btree ("organization_id");
--> statement-breakpoint

CREATE INDEX "organization_members_user_id_idx"
	ON "organization_members"
	USING btree ("user_id");
--> statement-breakpoint

CREATE INDEX "organization_members_organization_status_idx"
	ON "organization_members"
	USING btree ("organization_id", "status");
--> statement-breakpoint

CREATE INDEX "organization_members_added_by_user_id_idx"
	ON "organization_members"
	USING btree ("added_by_user_id");
--> statement-breakpoint

CREATE UNIQUE INDEX "organizations_slug_unique"
	ON "organizations"
	USING btree ("slug");
--> statement-breakpoint

CREATE INDEX "organizations_status_idx"
	ON "organizations"
	USING btree ("status");
--> statement-breakpoint

CREATE INDEX "organizations_created_by_user_id_idx"
	ON "organizations"
	USING btree ("created_by_user_id");
--> statement-breakpoint

CREATE INDEX "organizations_created_at_idx"
	ON "organizations"
	USING btree ("created_at");
--> statement-breakpoint

CREATE INDEX "organizations_deleted_at_idx"
	ON "organizations"
	USING btree ("deleted_at");
--> statement-breakpoint

-- ============================================================================
-- Assignment indexes
-- ============================================================================

CREATE INDEX "organization_member_roles_role_id_idx"
	ON "organization_member_roles"
	USING btree ("role_id");
--> statement-breakpoint

CREATE INDEX "organization_member_roles_assigned_by_user_id_idx"
	ON "organization_member_roles"
	USING btree ("assigned_by_user_id");
--> statement-breakpoint

CREATE INDEX "organization_member_roles_expires_at_idx"
	ON "organization_member_roles"
	USING btree ("expires_at");
--> statement-breakpoint

CREATE INDEX "platform_role_assignments_role_id_idx"
	ON "platform_role_assignments"
	USING btree ("role_id");
--> statement-breakpoint

CREATE INDEX "platform_role_assignments_assigned_by_user_id_idx"
	ON "platform_role_assignments"
	USING btree ("assigned_by_user_id");
--> statement-breakpoint

CREATE INDEX "platform_role_assignments_expires_at_idx"
	ON "platform_role_assignments"
	USING btree ("expires_at");
--> statement-breakpoint

-- ============================================================================
-- Existing authorization indexes
-- ============================================================================

CREATE INDEX "role_conflicts_conflicting_role_id_index"
	ON "role_conflicts"
	USING btree ("conflicting_role_id");

-- ============================================================================
-- Remove legacy authorization catalog data
-- ============================================================================

/*
 * Migrations 0000-0004 seeded the previous authorization model.
 *
 * The normalized authorization catalog is now owned by:
 *
 *   libs/db/seeds/authorization
 *
 * Preserve the tables themselves, but remove the legacy role/permission
 * records and relationships so the canonical seed can recreate them without
 * carrying deprecated identifiers or conflicting resource/action tuples.
 */

DELETE FROM "role_conflicts";
--> statement-breakpoint

DELETE FROM "role_inheritance";
--> statement-breakpoint

DELETE FROM "role_permissions";
--> statement-breakpoint

DELETE FROM "roles";
--> statement-breakpoint

DELETE FROM "permissions";
--> statement-breakpoint
