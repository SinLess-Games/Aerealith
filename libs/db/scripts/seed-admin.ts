import { randomBytes, scrypt as nodeScrypt } from 'node:crypto';
import { promisify } from 'node:util';

import { Pool } from 'pg';

import { seedSuperAdmin } from '../src/admin/super-admin.seed';

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
    const result = await seedSuperAdmin(client, {
      username,
      email,
      passwordHash: await hashPassword(password),
    });
    await client.query('COMMIT');

    console.log(
      result.created
        ? `Created verified super-admin account ${result.email}.`
        : `Super-admin account ${result.email} is already present and was normalized.`,
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

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, KeyLength)) as Buffer;
  return `scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

void main();
