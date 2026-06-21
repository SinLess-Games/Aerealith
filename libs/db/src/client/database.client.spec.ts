// libs/db/src/client/database.client.spec.ts

import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const pool = {
    end: vi.fn(),
  };

  return {
    drizzle: vi.fn(),
    Pool: vi.fn(function MockPool() {
      return pool;
    }),
    pool,
  };
});

vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: mocks.drizzle,
}));

vi.mock('pg', () => ({
  Pool: mocks.Pool,
}));

import {
  createDatabaseClient,
  createDatabaseConnection,
} from './database.client';
import { DatabaseUrlEnvironmentVariable } from './database.config';

const environment = {
  [DatabaseUrlEnvironmentVariable]:
    'postgresql://user:password@localhost:5432/aerealith',
};

describe('database client', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates a PostgreSQL pool using the configured connection string', () => {
    mocks.drizzle.mockReturnValueOnce({});

    createDatabaseConnection(environment);

    expect(mocks.Pool).toHaveBeenCalledWith({
      connectionString: environment[DatabaseUrlEnvironmentVariable],
    });
  });

  it('creates a Drizzle client using the PostgreSQL pool and schema', () => {
    const drizzleClient = {};
    mocks.drizzle.mockReturnValueOnce(drizzleClient);

    const connection = createDatabaseConnection(environment);

    expect(mocks.drizzle).toHaveBeenCalledWith(
      mocks.pool,
      expect.objectContaining({
        schema: expect.any(Object),
      }),
    );

    expect(connection.client).toBe(drizzleClient);
  });

  it('returns the created PostgreSQL pool', () => {
    mocks.drizzle.mockReturnValueOnce({});

    const connection = createDatabaseConnection(environment);

    expect(connection.pool).toBe(mocks.pool);
  });

  it('closes the PostgreSQL pool', async () => {
    mocks.drizzle.mockReturnValueOnce({});

    const connection = createDatabaseConnection(environment);

    await connection.close();

    expect(mocks.pool.end).toHaveBeenCalledOnce();
  });

  it('returns only the Drizzle client when using createDatabaseClient', () => {
    const drizzleClient = {};
    mocks.drizzle.mockReturnValueOnce(drizzleClient);

    const client = createDatabaseClient(environment);

    expect(client).toBe(drizzleClient);
  });
});
