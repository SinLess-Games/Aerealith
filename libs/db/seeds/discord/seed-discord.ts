import { loadEnvFile } from 'node:process';
import { createDatabaseConnection } from '../../src/client';
import { seedDiscordDevelopment } from './discord.seed';

loadEnvFile();

const connection = createDatabaseConnection();
seedDiscordDevelopment(connection.client)
  .finally(() => connection.close())
  .catch((error: unknown) => {
    console.error('Discord development seed failed:', error);
    process.exitCode = 1;
  });
