// libs/db/src/queries/user/user-session.queries.spec.ts

import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import {
  activeUserSessionById,
  activeUserSessionsByUserId,
} from './user-session.queries';

const dialect = new PgDialect();

function toQuery(condition: SQL | undefined) {
  if (condition === undefined) {
    throw new Error('Expected the query helper to return a SQL condition.');
  }

  return dialect.sqlToQuery(condition);
}

describe('user session queries', () => {
  it('creates an active user session predicate by ID', () => {
    const query = toQuery(activeUserSessionById('session_123'));

    expect(query.params[0]).toBe('session_123');
    expect(query.sql).toContain('"user_sessions"."id" = $1');
    expect(query.sql).toContain('"user_sessions"."deleted_at" is null');
    expect(query.sql).toContain('"user_sessions"."revoked_at" is null');
    expect(query.sql).toContain('"user_sessions"."expires_at"');
  });

  it('creates active user session predicates by user ID', () => {
    const query = toQuery(activeUserSessionsByUserId('user_123'));

    expect(query.params[0]).toBe('user_123');
    expect(query.sql).toContain('"user_sessions"."user_id" = $1');
    expect(query.sql).toContain('"user_sessions"."deleted_at" is null');
    expect(query.sql).toContain('"user_sessions"."revoked_at" is null');
    expect(query.sql).toContain('"user_sessions"."expires_at"');
  });

  it('uses the provided session ID as the first predicate parameter', () => {
    const sessionId = 'session_456';

    const query = toQuery(activeUserSessionById(sessionId));

    expect(query.params[0]).toBe(sessionId);
  });

  it('uses the provided user ID as the first predicate parameter', () => {
    const userId = 'user_456';

    const query = toQuery(activeUserSessionsByUserId(userId));

    expect(query.params[0]).toBe(userId);
  });

  it('always excludes soft-deleted, revoked, and expired sessions', () => {
    const byIdQuery = toQuery(activeUserSessionById('session_123'));

    const byUserIdQuery = toQuery(
      activeUserSessionsByUserId('user_123'),
    );

    for (const query of [byIdQuery, byUserIdQuery]) {
      expect(query.sql).toContain(
        '"user_sessions"."deleted_at" is null',
      );

      expect(query.sql).toContain(
        '"user_sessions"."revoked_at" is null',
      );

      expect(query.sql).toContain('"user_sessions"."expires_at"');
      expect(query.sql).toMatch(/"user_sessions"\."expires_at"\s*>\s*\$\d+/);
    }
  });
});
