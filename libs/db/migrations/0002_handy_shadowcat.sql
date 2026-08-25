CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(160) NOT NULL,
	"resource" varchar(80) NOT NULL,
	"action" varchar(80) NOT NULL,
	"display_name" varchar(160) NOT NULL,
	"description" text,
	"system" boolean DEFAULT false NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "permissions_key_format_check" CHECK ("permissions"."key" ~ '^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*)+$')
);
--> statement-breakpoint
CREATE TABLE "principal_authorization_versions" (
	"principal_type" varchar(20) NOT NULL,
	"principal_id" varchar(160) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "principal_authorization_versions_primary_key" PRIMARY KEY("principal_type","principal_id"),
	CONSTRAINT "principal_authorization_versions_principal_type_check" CHECK ("principal_authorization_versions"."principal_type" in ('user', 'service')),
	CONSTRAINT "principal_authorization_versions_version_check" CHECK ("principal_authorization_versions"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "principal_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"principal_type" varchar(20) NOT NULL,
	"principal_id" varchar(160) NOT NULL,
	"role_id" uuid NOT NULL,
	"scope_type" varchar(32) NOT NULL,
	"scope_id" varchar(160),
	"assigned_by" varchar(160) NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_by" varchar(160),
	"revoked_at" timestamp with time zone,
	"revocation_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"active_key" varchar(560),
	CONSTRAINT "principal_roles_principal_type_check" CHECK ("principal_roles"."principal_type" in ('user', 'service')),
	CONSTRAINT "principal_roles_scope_type_check" CHECK ("principal_roles"."scope_type" in ('global', 'organization', 'workspace', 'project', 'discord_guild', 'resource')),
	CONSTRAINT "principal_roles_global_scope_check" CHECK (("principal_roles"."scope_type" = 'global' and "principal_roles"."scope_id" is null) or ("principal_roles"."scope_type" <> 'global' and "principal_roles"."scope_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "role_conflicts" (
	"role_id" uuid NOT NULL,
	"conflicting_role_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"created_by" varchar(160) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_conflicts_primary_key" PRIMARY KEY("role_id","conflicting_role_id"),
	CONSTRAINT "role_conflicts_no_self_reference_check" CHECK ("role_conflicts"."role_id" <> "role_conflicts"."conflicting_role_id")
);
--> statement-breakpoint
CREATE TABLE "role_inheritance" (
	"role_id" uuid NOT NULL,
	"parent_role_id" uuid NOT NULL,
	"created_by" varchar(160) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_inheritance_primary_key" PRIMARY KEY("role_id","parent_role_id"),
	CONSTRAINT "role_inheritance_no_self_reference_check" CHECK ("role_inheritance"."role_id" <> "role_inheritance"."parent_role_id")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"assigned_by" varchar(160) NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_permissions_primary_key" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"display_name" varchar(160) NOT NULL,
	"description" text,
	"system" boolean DEFAULT false NOT NULL,
	"assignable" boolean DEFAULT true NOT NULL,
	"administrative_rank" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "roles_administrative_rank_check" CHECK ("roles"."administrative_rank" >= 0)
);
--> statement-breakpoint
ALTER TABLE "principal_roles" ADD CONSTRAINT "principal_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_conflicts" ADD CONSTRAINT "role_conflicts_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_conflicts" ADD CONSTRAINT "role_conflicts_conflicting_role_id_roles_id_fk" FOREIGN KEY ("conflicting_role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_inheritance" ADD CONSTRAINT "role_inheritance_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_inheritance" ADD CONSTRAINT "role_inheritance_parent_role_id_roles_id_fk" FOREIGN KEY ("parent_role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_key_unique" ON "permissions" USING btree ("key");--> statement-breakpoint
CREATE INDEX "permissions_resource_action_index" ON "permissions" USING btree ("resource","action");--> statement-breakpoint
CREATE UNIQUE INDEX "principal_roles_active_key_unique" ON "principal_roles" USING btree ("active_key");--> statement-breakpoint
CREATE INDEX "principal_roles_principal_index" ON "principal_roles" USING btree ("principal_type","principal_id");--> statement-breakpoint
CREATE INDEX "principal_roles_role_id_index" ON "principal_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "principal_roles_expires_at_index" ON "principal_roles" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "role_inheritance_parent_role_id_index" ON "role_inheritance" USING btree ("parent_role_id");--> statement-breakpoint
CREATE INDEX "role_permissions_permission_id_index" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_key_unique" ON "roles" USING btree ("key");
--> statement-breakpoint
INSERT INTO "permissions" ("key", "resource", "action", "display_name", "description", "system")
VALUES
  ('account.read', 'account', 'read', 'Read own account', 'View the authenticated principal account.', true),
  ('authorization.permissions.read', 'authorization.permissions', 'read', 'Read authorization permissions', 'View the authorization permission catalog.', true),
  ('authorization.permissions.manage', 'authorization.permissions', 'manage', 'Manage authorization permissions', 'Create and update authorization permissions and grants.', true),
  ('authorization.roles.read', 'authorization.roles', 'read', 'Read authorization roles', 'View normalized authorization roles.', true),
  ('authorization.roles.create', 'authorization.roles', 'create', 'Create authorization roles', 'Create custom authorization roles.', true),
  ('authorization.roles.update', 'authorization.roles', 'update', 'Update authorization roles', 'Update custom authorization roles.', true),
  ('authorization.roles.delete', 'authorization.roles', 'delete', 'Delete authorization roles', 'Delete custom authorization roles.', true),
  ('authorization.roles.assign', 'authorization.roles', 'assign', 'Assign authorization roles', 'Assign normalized roles to principals.', true),
  ('authorization.roles.revoke', 'authorization.roles', 'revoke', 'Revoke authorization roles', 'Revoke normalized principal role assignments.', true),
  ('authorization.roles.system.manage', 'authorization.roles.system', 'manage', 'Manage system roles', 'Use protected system-role workflows.', true),
  ('authorization.assignments.read', 'authorization.assignments', 'read', 'Read role assignments', 'View principal role assignments.', true),
  ('authorization.assignments.manage', 'authorization.assignments', 'manage', 'Manage role assignments', 'Manage normalized principal role assignments.', true),
  ('users.read', 'users', 'read', 'Read users', 'View user records.', true),
  ('users.create', 'users', 'create', 'Create users', 'Create user records.', true),
  ('users.update', 'users', 'update', 'Update users', 'Update user records.', true),
  ('users.delete', 'users', 'delete', 'Delete users', 'Delete user records.', true),
  ('users.suspend', 'users', 'suspend', 'Suspend users', 'Suspend user access.', true),
  ('users.impersonate', 'users', 'impersonate', 'Impersonate users', 'Assume a user identity for controlled support.', true),
  ('users.manage', 'users', 'manage', 'Manage users', 'Perform protected user administration.', true),
  ('sessions.read', 'sessions', 'read', 'Read sessions', 'View user sessions.', true),
  ('sessions.revoke', 'sessions', 'revoke', 'Revoke session', 'Revoke an individual user session.', true),
  ('sessions.revoke_all', 'sessions', 'revoke_all', 'Revoke all sessions', 'Revoke every session for a user.', true),
  ('roles.read', 'roles', 'read', 'Read roles', 'View roles and their grants.', true),
  ('roles.create', 'roles', 'create', 'Create roles', 'Create custom roles.', true),
  ('roles.update', 'roles', 'update', 'Update roles', 'Update custom roles.', true),
  ('roles.delete', 'roles', 'delete', 'Delete roles', 'Delete custom roles.', true),
  ('roles.assign', 'roles', 'assign', 'Assign roles', 'Assign roles to principals.', true),
  ('roles.revoke', 'roles', 'revoke', 'Revoke roles', 'Revoke principal role assignments.', true),
  ('permissions.read', 'permissions', 'read', 'Read permissions', 'View the permission catalog.', true),
  ('permissions.assign', 'permissions', 'assign', 'Assign permissions', 'Grant permissions to roles.', true),
  ('permissions.revoke', 'permissions', 'revoke', 'Revoke permissions', 'Remove permissions from roles.', true),
  ('audit.read', 'audit', 'read', 'Read audit log', 'View security and authorization audit events.', true),
  ('projects.read', 'projects', 'read', 'Read projects', 'View project resources.', true),
  ('projects.create', 'projects', 'create', 'Create projects', 'Create project resources.', true),
  ('projects.update', 'projects', 'update', 'Update projects', 'Update project resources.', true),
  ('projects.delete', 'projects', 'delete', 'Delete projects', 'Delete project resources.', true),
  ('organizations.read', 'organizations', 'read', 'Read organizations', 'View organization resources.', true),
  ('organizations.create', 'organizations', 'create', 'Create organizations', 'Create organizations.', true),
  ('organizations.update', 'organizations', 'update', 'Update organizations', 'Update organizations.', true),
  ('organizations.delete', 'organizations', 'delete', 'Delete organizations', 'Delete organizations.', true),
  ('discord.guild.read', 'discord.guild', 'read', 'Read Discord guilds', 'View connected Discord guilds.', true),
  ('discord.guild.manage', 'discord.guild', 'manage', 'Manage Discord guilds', 'Manage Discord guild integrations.', true),
  ('notifications.read', 'notifications', 'read', 'Read notifications', 'View notifications.', true),
  ('notifications.manage', 'notifications', 'manage', 'Manage notifications', 'Manage notification delivery.', true),
  ('ai.assistant.use', 'ai.assistant', 'use', 'Use AI assistant', 'Use Aerealith AI features.', true),
  ('ai.assistant.manage', 'ai.assistant', 'manage', 'Manage AI assistant', 'Manage AI configuration.', true),
  ('documentation.read', 'documentation', 'read', 'Read documentation', 'View documentation.', true),
  ('documentation.manage', 'documentation', 'manage', 'Manage documentation', 'Manage documentation content.', true),
  ('billing.read', 'billing', 'read', 'Read billing', 'View billing information.', true),
  ('billing.manage', 'billing', 'manage', 'Manage billing', 'Manage billing configuration.', true)
ON CONFLICT ("key") DO UPDATE SET
  "display_name" = excluded."display_name",
  "description" = excluded."description",
  "enabled" = true,
  "updated_at" = now();
--> statement-breakpoint
INSERT INTO "roles" ("key", "display_name", "description", "system", "assignable", "administrative_rank")
VALUES
  ('user', 'User', 'Baseline authenticated product access.', true, true, 0),
  ('support_agent', 'Support Agent', 'Customer support and account triage.', true, true, 20),
  ('security_administrator', 'Security Administrator', 'Security, identity, role, and audit administration.', true, true, 70),
  ('platform_administrator', 'Platform Administrator', 'Broad platform administration.', true, true, 90),
  ('platform_owner', 'Platform Owner', 'Protected break-glass ownership with complete platform access.', true, false, 100),
  ('service', 'Service', 'Non-human workload access.', true, true, 10)
ON CONFLICT ("key") DO UPDATE SET
  "display_name" = excluded."display_name",
  "description" = excluded."description",
  "administrative_rank" = excluded."administrative_rank",
  "updated_at" = now();
--> statement-breakpoint
INSERT INTO "role_inheritance" ("role_id", "parent_role_id", "created_by")
SELECT child."id", parent."id", 'migration:authorization-v1'
FROM (VALUES
  ('support_agent', 'user'),
  ('security_administrator', 'support_agent'),
  ('platform_administrator', 'security_administrator'),
  ('platform_owner', 'platform_administrator')
) AS edge(child_key, parent_key)
JOIN "roles" child ON child."key" = edge.child_key
JOIN "roles" parent ON parent."key" = edge.parent_key
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id", "assigned_by")
SELECT role."id", permission."id", 'migration:authorization-v1'
FROM "roles" role
JOIN "permissions" permission ON
  (role."key" = 'user' AND permission."key" IN (
    'account.read', 'projects.read', 'organizations.read', 'notifications.read',
    'ai.assistant.use', 'documentation.read'
  ))
  OR (role."key" = 'support_agent' AND permission."key" IN (
    'users.read', 'users.update', 'users.suspend', 'audit.read'
  ))
  OR (role."key" = 'security_administrator' AND permission."resource" IN (
    'users', 'roles', 'permissions', 'audit'
  ))
  OR (role."key" = 'platform_administrator')
  OR (role."key" = 'platform_owner')
  OR (role."key" = 'service' AND permission."key" IN (
    'projects.read', 'organizations.read', 'discord.guild.read',
    'notifications.manage', 'ai.assistant.use', 'documentation.read'
  ))
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "principal_roles" (
  "principal_type", "principal_id", "role_id", "scope_type", "assigned_by",
  "metadata", "active_key"
)
SELECT
  'user',
  users."id"::text,
  roles."id",
  'global',
  'migration:legacy-user-role',
  jsonb_build_object('source', 'users.role', 'legacyRole', users."role"::text),
  concat('user:', users."id"::text, ':', roles."id"::text, ':global:')
FROM "users"
JOIN "roles" ON roles."key" = CASE
  WHEN lower(users."email") = 'timothy.pierce444@gmail.com' THEN 'platform_owner'
  WHEN users."role"::text = 'support' THEN 'support_agent'
  WHEN users."role"::text = 'service' THEN 'service'
  WHEN users."role"::text = 'admin' THEN 'platform_administrator'
  WHEN users."role"::text IN ('super_admin', 'system') THEN 'platform_owner'
  ELSE 'user'
END
WHERE users."deleted_at" IS NULL
ON CONFLICT ("active_key") DO NOTHING;
--> statement-breakpoint
INSERT INTO "principal_authorization_versions" (
  "principal_type", "principal_id", "version"
)
SELECT 'user', users."id"::text, 1
FROM "users"
WHERE users."deleted_at" IS NULL
ON CONFLICT ("principal_type", "principal_id") DO NOTHING;
