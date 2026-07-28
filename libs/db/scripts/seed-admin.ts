import { randomBytes, scrypt as nodeScrypt } from 'node:crypto';
import { promisify } from 'node:util';

import { Pool, type PoolClient } from 'pg';

const scrypt = promisify(nodeScrypt);
const KeyLength = 64;

async function main(): Promise<void> {
  const username = process.env['ADMIN_USERNAME']?.trim() || 'Sinless777';
  const email =
    process.env['ADMIN_EMAIL']?.trim().toLowerCase() ||
    'timothy.pierce444@gmail.com';
  const configuredPassword = process.env['ADMIN_PASSWORD'];
  const generatedPassword = configuredPassword
    ? undefined
    : randomBytes(24).toString('base64url');
  const password = configuredPassword || generatedPassword;
  const databaseUrl = process.env['DATABASE_URL'];

  if (!databaseUrl) throw new Error('DATABASE_URL is required.');
  if (!password || password.length < 16) {
    throw new Error('ADMIN_PASSWORD must contain at least 16 characters.');
  }

  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('aerealith-admin-seed'))",
    );
    const result = await seedAdmin(client, {
      username,
      email,
      passwordHash: await hashPassword(password),
    });
    await client.query('COMMIT');

    console.log(
      result.created
        ? `Created verified admin account ${result.email}.`
        : `Admin account ${result.email} is already present and was normalized.`,
    );
    if (generatedPassword && result.passwordWasSet) {
      console.log(`Generated one-time admin password: ${generatedPassword}`);
      console.log('Store it securely and change it after the first login.');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function seedAdmin(
  client: PoolClient,
  input: { username: string; email: string; passwordHash: string },
): Promise<{ created: boolean; email: string; passwordWasSet: boolean }> {
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
      'The requested admin username and email belong to different accounts.',
    );
  }

  const account = existing.rows[0];
  if (
    account &&
    (account.email.toLowerCase() !== input.email.toLowerCase() ||
      account.username.toLowerCase() !== input.username.toLowerCase())
  ) {
    throw new Error(
      'The requested admin username or email is already used by another account.',
    );
  }

  if (account) {
    const passwordWasSet = account.password_hash === null;
    await client.query(
      `UPDATE users
          SET username = $2,
              email = $3,
              role = 'admin',
              status = 'active',
              email_verified = true,
              email_verified_at = COALESCE(email_verified_at, now()),
              password_hash = COALESCE(password_hash, $4),
              metadata = metadata || '{"displayName":"Sinless777","seededAdmin":true}'::jsonb,
              updated_at = now(),
              deleted_at = NULL
        WHERE id = $1`,
      [account.id, input.username, input.email, input.passwordHash],
    );
    return { created: false, email: account.email, passwordWasSet };
  }

  await client.query(
    `INSERT INTO users (
       username, email, password_hash, status, email_verified,
       email_verified_at, role, metadata
     ) VALUES ($1, $2, $3, 'active', true, now(), 'admin',
       '{"displayName":"Sinless777","seededAdmin":true}'::jsonb)`,
    [input.username, input.email, input.passwordHash],
  );
  return { created: true, email: input.email, passwordWasSet: true };
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, KeyLength)) as Buffer;
  return `scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

void main();
