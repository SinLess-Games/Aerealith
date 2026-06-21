// libs/db/src/client/database.config.ts

export const DatabaseUrlEnvironmentVariable = 'DATABASE_URL';

export type DatabaseEnvironment = Record<string, string | undefined>;

export type DatabaseConfig = {
  connectionString: string;
};

/**
 * Reads the database connection configuration.
 *
 * Pass a Worker or service environment object when `process.env` is not used.
 */
export function getDatabaseConfig(
  environment: DatabaseEnvironment = process.env,
): DatabaseConfig {
  const connectionString =
    environment[DatabaseUrlEnvironmentVariable]?.trim();

  if (!connectionString) {
    throw new Error(`${DatabaseUrlEnvironmentVariable} is required.`);
  }

  return {
    connectionString,
  };
}
