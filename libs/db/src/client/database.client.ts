// libs/db/src/client/database.client.ts

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from '../schema'
import { getDatabaseConfig, type DatabaseEnvironment } from './database.config'
import type { DatabaseClient } from './database.types'

export type DatabaseClientConnection = {
  client: DatabaseClient
  pool: Pool
  close: () => Promise<void>
}

/**
 * Creates a Drizzle database client backed by a PostgreSQL connection pool.
 *
 * This is intended for Node.js services.
 * Do not use this client directly inside Cloudflare Workers.
 */
export function createDatabaseConnection(
  environment: DatabaseEnvironment = process.env,
): DatabaseClientConnection {
  const config = getDatabaseConfig(environment)

  const pool = new Pool({
    connectionString: config.connectionString,
  })

  const client = drizzle(pool, {
    schema,
  })

  return {
    client,
    pool,
    close: async () => {
      await pool.end()
    },
  }
}

/**
 * Creates a database client when the connection pool does not need
 * to be accessed directly.
 */
export function createDatabaseClient(
  environment: DatabaseEnvironment = process.env,
): DatabaseClient {
  return createDatabaseConnection(environment).client
}
