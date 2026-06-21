// libs/db/src/client/database.config.spec.ts

import { describe, expect, it } from 'vitest';

import {
  DatabaseUrlEnvironmentVariable,
  getDatabaseConfig,
} from './database.config';

describe('getDatabaseConfig', () => {
  it('returns the configured database connection string', () => {
    const config = getDatabaseConfig({
      [DatabaseUrlEnvironmentVariable]:
        'postgresql://user:password@localhost:5432/aerealith',
    });

    expect(config).toEqual({
      connectionString:
        'postgresql://user:password@localhost:5432/aerealith',
    });
  });

  it('trims the configured database connection string', () => {
    const config = getDatabaseConfig({
      [DatabaseUrlEnvironmentVariable]:
        '  postgresql://user:password@localhost:5432/aerealith  ',
    });

    expect(config.connectionString).toBe(
      'postgresql://user:password@localhost:5432/aerealith',
    );
  });

  it('throws when the database connection string is missing', () => {
    expect(() => getDatabaseConfig({})).toThrow(
      `${DatabaseUrlEnvironmentVariable} is required.`,
    );
  });

  it('throws when the database connection string is blank', () => {
    expect(() =>
      getDatabaseConfig({
        [DatabaseUrlEnvironmentVariable]: '   ',
      }),
    ).toThrow(`${DatabaseUrlEnvironmentVariable} is required.`);
  });
});
