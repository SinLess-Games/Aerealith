// libs/db/src/queries/user/user-settings.queries.spec.ts

import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { activeUserSettingsByUserId } from './user-settings.queries';

const dialect = new PgDialect();

function toQuery(condition: SQL | undefined) {
  if (condition === undefined) {
    throw new Error('Expected the query helper to return a SQL condition.');
  }

  return dialect.sqlToQuery(condition);
}

describe('user settings queries', () => {
  it('creates an active user settings predicate by user ID', () => {
    const query = toQuery(activeUserSettingsByUserId('user_123'));

    expect(query.params).toEqual(['user_123']);
    expect(query.sql).toContain('"user_settings"."user_id" = $1');
    expect(query.sql).toContain(
      '"user_settings"."deleted_at" is null',
    );
  });

  it('uses the provided user ID as the predicate parameter', () => {
    const userId = 'user_456';

    const query = toQuery(activeUserSettingsByUserId(userId));

    expect(query.params).toEqual([userId]);
  });

  it('creates independent predicates for different users', () => {
    const firstQuery = toQuery(activeUserSettingsByUserId('user_123'));

    const secondQuery = toQuery(activeUserSettingsByUserId('user_456'));

    expect(firstQuery.params).toEqual(['user_123']);
    expect(secondQuery.params).toEqual(['user_456']);
  });

  it('always excludes soft-deleted user settings', () => {
    const query = toQuery(activeUserSettingsByUserId('user_123'));

    expect(query.sql).toContain(
      '"user_settings"."deleted_at" is null',
    );
  });
});
