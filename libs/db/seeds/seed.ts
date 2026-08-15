// libs/db/seeds/seed.ts

import { loadEnvFile } from 'node:process';

import { createDatabaseConnection } from '../src/client';

import { seedAuthorization } from './authorization';

import { seedUsers } from './users';

loadEnvFile();

/**
 * Database seed entry point.
 *
 * Seed order matters:
 *
 *   1. authorization
 *      ├── permissions
 *      ├── roles
 *      └── role_permissions
 *
 *   2. users
 *      └── bootstrap platform owner
 *
 * The platform-owner user seed depends on the canonical
 * platform-owner role already existing.
 */
async function main(): Promise<void> {
  const connection = createDatabaseConnection();

  try {
    console.info('Starting database seed...');

    await seedAuthorization(connection.client);

    console.info('Authorization seed complete.');

    await seedUsers(connection.client);

    console.info('User seed complete.');

    console.info('Database seed complete.');
  } finally {
    await connection.close();
  }
}

main().catch((error: unknown) => {
  console.error('Database seed failed:', error);

  process.exitCode = 1;
});
