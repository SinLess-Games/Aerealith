// libs/db/src/queries/user/user-preferences.queries.spec.ts

import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { activeUserPreferencesByUserId } from './user-preferences.queries';

const dialect = new PgDialect();

function toQuery(condition: SQL | undefined) {
  if (condition === undefined) {
    throw new Error('Expected the query helper to return a SQL condition.');
  }

  return dialect.sqlToQuery(condition);
}

describe('user preferences queries', () => {
  it('creates an active user preferences predicate by user ID', () => {
    const query = toQuery(activeUserPreferencesByUserId('user_123'));

    expect(query.params).toEqual(['user_123']);
    expect(query.sql).toContain('"user_preferences"."user_id" = $1');
    expect(query.sql).toContain(
      '"user_preferences"."deleted_at" is null',
    );
  });

  it('uses the provided user ID as the predicate parameter', () => {
    const userId = 'user_456';

    const query = toQuery(activeUserPreferencesByUserId(userId));

    expect(query.params).toEqual([userId]);
  });

  it('creates independent predicates for different users', () => {
    const firstQuery = toQuery(
      activeUserPreferencesByUserId('user_123'),
    );

    const secondQuery = toQuery(
      activeUserPreferencesByUserId('user_456'),
    );

    expect(firstQuery.params).toEqual(['user_123']);
    expect(secondQuery.params).toEqual(['user_456']);
  });

  it('always excludes soft-deleted user preferences', () => {
    const query = toQuery(activeUserPreferencesByUserId('user_123'));

    expect(query.sql).toContain(
      '"user_preferences"."deleted_at" is null',
    );
  });
});
