// libs/db/src/queries/user/user-consent.queries.spec.ts

import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { UserConsentType } from '@aerealith-ai/core';

import {
  activeUserConsentById,
  activeUserConsentByUserIdAndType,
  activeUserConsentsByUserId,
} from './user-consent.queries';

const dialect = new PgDialect();

function toQuery(condition: SQL | undefined) {
  if (condition === undefined) {
    throw new Error('Expected the query helper to return a SQL condition.');
  }

  return dialect.sqlToQuery(condition);
}

describe('user consent queries', () => {
  it('creates an active user consent predicate by ID', () => {
    const query = toQuery(activeUserConsentById('consent_123'));

    expect(query.params).toEqual(['consent_123']);
    expect(query.sql).toContain('"user_consents"."id" = $1');
    expect(query.sql).toContain('"user_consents"."deleted_at" is null');
  });

  it('creates an active user consent predicate by user ID and type', () => {
    const query = toQuery(
      activeUserConsentByUserIdAndType(
        'user_123',
        UserConsentType.PrivacyPolicy,
      ),
    );

    expect(query.params).toEqual([
      'user_123',
      UserConsentType.PrivacyPolicy,
    ]);

    expect(query.sql).toContain('"user_consents"."user_id" = $1');
    expect(query.sql).toContain('"user_consents"."type" = $2');
    expect(query.sql).toContain('"user_consents"."deleted_at" is null');
  });

  it('creates an active user consent predicate for all consents owned by a user', () => {
    const query = toQuery(activeUserConsentsByUserId('user_123'));

    expect(query.params).toEqual(['user_123']);
    expect(query.sql).toContain('"user_consents"."user_id" = $1');
    expect(query.sql).toContain('"user_consents"."deleted_at" is null');
  });

  it('uses the provided consent ID as the predicate parameter', () => {
    const consentId = 'consent_456';

    const query = toQuery(activeUserConsentById(consentId));

    expect(query.params).toEqual([consentId]);
  });

  it('uses the provided user ID and consent type as predicate parameters', () => {
    const userId = 'user_456';
    const type = UserConsentType.MarketingEmails;

    const query = toQuery(
      activeUserConsentByUserIdAndType(userId, type),
    );

    expect(query.params).toEqual([userId, type]);
  });

  it('always excludes soft-deleted user consents', () => {
    const byIdQuery = toQuery(activeUserConsentById('consent_123'));

    const byUserIdAndTypeQuery = toQuery(
      activeUserConsentByUserIdAndType(
        'user_123',
        UserConsentType.PrivacyPolicy,
      ),
    );

    const byUserIdQuery = toQuery(
      activeUserConsentsByUserId('user_123'),
    );

    expect(byIdQuery.sql).toContain(
      '"user_consents"."deleted_at" is null',
    );

    expect(byUserIdAndTypeQuery.sql).toContain(
      '"user_consents"."deleted_at" is null',
    );

    expect(byUserIdQuery.sql).toContain(
      '"user_consents"."deleted_at" is null',
    );
  });
});
