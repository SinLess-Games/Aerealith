UPDATE "users"
SET
  "username" = 'Sinless777',
  "role" = 'super_admin',
  "status" = 'active',
  "email_verified" = true,
  "email_verified_at" = COALESCE("email_verified_at", now()),
  "metadata" = "metadata" || '{"displayName":"Sinless777","seededAdmin":true,"superAdmin":true}'::jsonb,
  "updated_at" = now(),
  "deleted_at" = NULL
WHERE lower("email") = 'timothy.pierce444@gmail.com';
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id", "assigned_by")
SELECT role."id", permission."id", 'migration:sinless777-platform-owner'
FROM "roles" role
CROSS JOIN "permissions" permission
WHERE role."key" = 'platform_owner'
  AND permission."enabled" = true
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
  'migration:sinless777-platform-owner',
  '{"protectedOwner":true,"source":"migration"}'::jsonb,
  concat('user:', users."id"::text, ':', roles."id"::text, ':global:')
FROM "users"
CROSS JOIN "roles"
WHERE lower(users."email") = 'timothy.pierce444@gmail.com'
  AND users."deleted_at" IS NULL
  AND roles."key" = 'platform_owner'
ON CONFLICT ("active_key") DO UPDATE SET
  "expires_at" = NULL,
  "revoked_by" = NULL,
  "revoked_at" = NULL,
  "revocation_reason" = NULL,
  "metadata" = "principal_roles"."metadata" || excluded."metadata";
--> statement-breakpoint
INSERT INTO "principal_authorization_versions" (
  "principal_type", "principal_id", "version"
)
SELECT 'user', users."id"::text, 1
FROM "users"
WHERE lower(users."email") = 'timothy.pierce444@gmail.com'
  AND users."deleted_at" IS NULL
ON CONFLICT ("principal_type", "principal_id") DO UPDATE SET
  "version" = "principal_authorization_versions"."version" + 1,
  "updated_at" = now();
