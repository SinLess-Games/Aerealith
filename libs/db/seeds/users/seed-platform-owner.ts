import { loadEnvFile } from 'node:process';

import { createDatabaseConnection } from '../../src/client';

import { seedUsers } from './users.seed';

loadEnvFile();

async function main(): Promise<void> {
  const connection = createDatabaseConnection();

  try {
    await seedUsers(connection.client);

    console.info('Platform-owner development account is ready.');
  } finally {
    await connection.close();
  }
}

main().catch((error: unknown) => {
  console.error('Platform-owner seed failed:', error);

  process.exitCode = 1;
});
