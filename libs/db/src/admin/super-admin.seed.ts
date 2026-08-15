import type { PoolClient } from 'pg';

export interface SuperAdminSeedInput {
  readonly username: string;
  readonly email: string;
  readonly passwordHash: string;
}

export interface SuperAdminSeedResult {
  readonly created: boolean;
  readonly email: string;
  readonly passwordWasSet: boolean;
}

/**
 * Idempotently promotes the configured owner in the normalized authorization
 * model. users.role remains a compatibility projection only.
 */
export async function seedSuperAdmin(
  client: Pick<PoolClient, 'query'>,
  input: SuperAdminSeedInput,
): Promise<SuperAdminSeedResult> {
  const existing = await client.query<{
    id: string;
    username: string;
    email: string;
    password_hash: string | null;
  }>(
    `SELECT id, username, email, password_hash
       FROM users
      WHERE lower(email) = lower($1) OR lower(username) = lower($2)
      FOR UPDATE`,
    [input.email, input.username],
  );

  if (existing.rowCount && existing.rowCount > 1) {
    throw new Error(
      'The requested super-admin username and email belong to different accounts.',
    );
  }

  const account = existing.rows[0];
  if (
    account &&
    (account.email.toLowerCase() !== input.email.toLowerCase() ||
      account.username.toLowerCase() !== input.username.toLowerCase())
  ) {
    throw new Error(
      'The requested super-admin username or email is already used by another account.',
    );
  }

  const passwordWasSet = account?.password_hash == null;
  const userResult = account
    ? await client.query<{ id: string; email: string }>(
        `UPDATE users
            SET username = $2,
                email = $3,
                role = 'super_admin',
                status = 'active',
                email_verified = true,
                email_verified_at = COALESCE(email_verified_at, now()),
                password_hash = COALESCE(password_hash, $4),
                metadata = metadata || jsonb_build_object(
                  'displayName', $2::text,
                  'seededAdmin', true,
                  'superAdmin', true
                ),
                updated_at = now(),
                deleted_at = NULL
          WHERE id = $1
          RETURNING id, email`,
        [account.id, input.username, input.email, input.passwordHash],
      )
    : await client.query<{ id: string; email: string }>(
        `INSERT INTO users (
           username, email, password_hash, status, email_verified,
           email_verified_at, role, metadata
         ) VALUES (
           $1, $2, $3, 'active', true, now(), 'super_admin',
           jsonb_build_object(
             'displayName', $1::text,
             'seededAdmin', true,
             'superAdmin', true
           )
         )
         RETURNING id, email`,
        [input.username, input.email, input.passwordHash],
      );
  const user = userResult.rows[0];
  if (!user) throw new Error('Failed to create or update the super admin.');

  const roleResult = await client.query<{ id: string }>(
    `INSERT INTO roles (
       name, slug, scope, description, is_system, is_default
     ) VALUES (
       'Platform Owner', 'platform-owner', 'platform',
       'Protected ownership with complete platform access.',
       true, false
     )
     ON CONFLICT (scope, slug) DO UPDATE SET
       name = excluded.name,
       description = excluded.description,
       is_system = true,
       is_default = false,
       updated_at = now()
     RETURNING id`,
  );
  const role = roleResult.rows[0];
  if (!role) throw new Error('The platform-owner role could not be ensured.');

  await client.query(
    `INSERT INTO role_permissions (role_id, permission_id)
     SELECT $1, permissions.id
       FROM permissions
      WHERE permissions.scope = 'platform'
     ON CONFLICT DO NOTHING`,
    [role.id],
  );
  await client.query(
    `INSERT INTO platform_role_assignments (
       user_id, role_id, assigned_by_user_id, expires_at
     ) VALUES ($1, $2, NULL, NULL)
     ON CONFLICT (user_id, role_id) DO UPDATE SET expires_at = NULL`,
    [user.id, role.id],
  );
  await client.query(
    `INSERT INTO principal_authorization_versions (
       principal_type, principal_id, version
     ) VALUES ('user', $1, 1)
     ON CONFLICT (principal_type, principal_id) DO UPDATE SET
       version = principal_authorization_versions.version + 1,
       updated_at = now()`,
    [user.id],
  );

  return {
    created: account === undefined,
    email: user.email,
    passwordWasSet,
  };
}
