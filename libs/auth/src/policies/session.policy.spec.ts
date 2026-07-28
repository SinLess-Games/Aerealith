import type { UserSessionContract } from '@aerealith-ai/core';
import { describe, expect, it } from 'vitest';

import { SessionStatus } from '../enums/session-status.enum';
import { SessionPolicy } from './session.policy';

const now = new Date('2026-07-27T12:00:00.000Z');

describe('SessionPolicy', () => {
  it('resolves options and calculates expiration', () => {
    const policy = new SessionPolicy({
      lifetimeMs: 60_000,
      tokenEntropyBytes: 48,
    });
    expect(policy.lifetimeMs).toBe(60_000);
    expect(policy.tokenEntropyBytes).toBe(48);
    expect(policy.expiresAt(now).toISOString()).toBe(
      '2026-07-27T12:01:00.000Z',
    );
  });

  it('derives active, expired, and revoked states', () => {
    const policy = new SessionPolicy();
    expect(
      policy.status(session({ expiresAt: '2026-07-27T12:01:00.000Z' }), now),
    ).toBe(SessionStatus.Active);
    expect(policy.status(session({ expiresAt: now.toISOString() }), now)).toBe(
      SessionStatus.Expired,
    );
    expect(
      policy.status(
        session({
          expiresAt: '2026-07-27T12:01:00.000Z',
          revokedAt: now.toISOString(),
        }),
        now,
      ),
    ).toBe(SessionStatus.Revoked);
  });
});

function session(
  overrides: Partial<UserSessionContract> = {},
): UserSessionContract {
  return {
    id: 'session-1',
    deviceName: null,
    userAgent: null,
    ipAddress: null,
    geoIp: null,
    lastSeenAt: now.toISOString(),
    expiresAt: '2026-07-28T12:00:00.000Z',
    revokedAt: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  };
}
