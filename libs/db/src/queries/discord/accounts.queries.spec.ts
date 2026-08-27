import { UserTier } from '@aerealith-ai/core';
import { describe, expect, it } from 'vitest';
import type { DatabaseClient } from '../../client';
import {
  getDiscordAgeVerificationState,
  getDiscordUserEntitlements,
} from './accounts.queries';

function selectDatabase(rows: unknown[]): DatabaseClient {
  const builder: Record<string, unknown> = {};
  builder.from = () => builder;
  builder.innerJoin = () => builder;
  builder.where = () => builder;
  builder.limit = () => Promise.resolve(rows);
  return { select: () => builder } as unknown as DatabaseClient;
}

describe('Discord account queries', () => {
  it('uses the linked canonical users.tier for personal entitlements', async () => {
    const result = await getDiscordUserEntitlements(
      selectDatabase([
        {
          tier: UserTier.Pro,
          userStatus: 'active',
          accountStatus: 'active',
          linkedActive: true,
        },
      ]),
      '100000000000000001',
    );
    expect(result.source).toBe('canonical_user_tier');
    expect(result.tier).toBe(UserTier.Pro);
    expect(result.subscribed).toBe(true);
    expect(result.features).toContain('advanced_analytics');
  });
  it('treats an unlinked account as basic and unsubscribed', async () => {
    const result = await getDiscordUserEntitlements(
      selectDatabase([]),
      '100000000000000002',
    );
    expect(result.linked).toBe(false);
    expect(result.tier).toBe(UserTier.Basic);
    expect(result.subscribed).toBe(false);
  });
  it('returns a safe age projection without evidence references', async () => {
    const result = await getDiscordAgeVerificationState(
      selectDatabase([
        {
          status: 'verified',
          is18Plus: true,
          method: 'provider',
          verifiedAt: new Date(),
          expiresAt: null,
        },
      ]),
      '100000000000000001',
    );
    expect(result?.valid).toBe(true);
    expect(result).not.toHaveProperty('providerReference');
    expect(result).not.toHaveProperty('evidenceObjectReference');
  });
});
