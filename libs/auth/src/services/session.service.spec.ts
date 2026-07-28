import type { UserSessionContract } from '@aerealith-ai/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthEventPublisher } from '../contracts/auth-event-publisher.interface';
import type { SessionRepository } from '../contracts/session-repository.interface';
import type { TokenGenerator } from '../contracts/token-generator.interface';
import { AuthEvent } from '../enums/auth-event.enum';
import { SessionExpiredError } from '../errors/session-expired.error';
import { SessionRevokedError } from '../errors/session-revoked.error';
import { SessionService } from './session.service';

const now = new Date('2026-07-27T12:00:00.000Z');

describe('SessionService', () => {
  let sessions: SessionRepository;
  let tokens: TokenGenerator;
  let events: AuthEventPublisher;

  beforeEach(() => {
    sessions = {
      findById: vi.fn(),
      findByTokenHash: vi.fn(),
      findAllByUserId: vi.fn().mockResolvedValue([]),
      findHistoryByUserId: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(session()),
      updateActivity: vi.fn().mockResolvedValue(session()),
      revoke: vi.fn().mockResolvedValue(true),
      revokeAllByUserId: vi.fn().mockResolvedValue(2),
    };
    tokens = {
      generate: vi
        .fn()
        .mockResolvedValue({ token: 'raw-token', digest: 'token-hash' }),
      digest: vi.fn().mockResolvedValue('token-hash'),
    };
    events = { publish: vi.fn() };
  });

  it('creates a persisted session and returns the raw token once', async () => {
    const service = createService(sessions, tokens, events);
    const result = await service.create({
      userId: 'user-1',
      deviceName: 'Browser',
      userAgent: 'Agent',
      ipAddress: '127.0.0.1',
      geoIp: { city: 'Denver' },
    });

    expect(tokens.generate).toHaveBeenCalledWith(48);
    expect(sessions.create).toHaveBeenCalledWith({
      userId: 'user-1',
      tokenHash: 'token-hash',
      expiresAt: new Date('2026-07-27T12:01:00.000Z'),
      deviceName: 'Browser',
      userAgent: 'Agent',
      ipAddress: '127.0.0.1',
      geoIp: { city: 'Denver' },
      lastSeenAt: now,
    });
    expect(result).toEqual({ token: 'raw-token', session: session() });
    expect(events.publish).toHaveBeenCalledWith({
      event: AuthEvent.SessionCreated,
      occurredAt: now,
      userId: 'user-1',
      sessionId: 'session-1',
    });
  });

  it('finds active sessions by raw token digest', async () => {
    vi.mocked(sessions.findByTokenHash).mockResolvedValue(session());
    const service = createService(sessions, tokens, events);
    await expect(service.findByToken('raw-token')).resolves.toEqual(session());
    expect(tokens.digest).toHaveBeenCalledWith('raw-token');
    expect(sessions.findByTokenHash).toHaveBeenCalledWith('token-hash');
  });

  it('returns null for unknown tokens', async () => {
    vi.mocked(sessions.findByTokenHash).mockResolvedValue(null);
    await expect(
      createService(sessions, tokens, events).findByToken('missing'),
    ).resolves.toBeNull();
  });

  it('rejects expired and revoked sessions', async () => {
    const service = createService(sessions, tokens, events);
    vi.mocked(sessions.findByTokenHash).mockResolvedValue(
      session({ expiresAt: now.toISOString() }),
    );
    await expect(service.findByToken('expired')).rejects.toBeInstanceOf(
      SessionExpiredError,
    );

    vi.mocked(sessions.findByTokenHash).mockResolvedValue(
      session({ revokedAt: now.toISOString() }),
    );
    await expect(service.findByToken('revoked')).rejects.toBeInstanceOf(
      SessionRevokedError,
    );
  });

  it('delegates listing and activity recording', async () => {
    const active = [session()];
    vi.mocked(sessions.findAllByUserId).mockResolvedValue(active);
    vi.mocked(sessions.findHistoryByUserId).mockResolvedValue(active);
    const service = createService(sessions, tokens, events);

    await expect(service.listForUser('user-1')).resolves.toEqual(active);
    await expect(service.listHistoryForUser('user-1')).resolves.toEqual(active);
    await expect(service.recordActivity('session-1')).resolves.toEqual(
      session(),
    );
    expect(sessions.updateActivity).toHaveBeenCalledWith('session-1', {
      lastSeenAt: now,
    });
  });

  it('publishes only successful revocations', async () => {
    const service = createService(sessions, tokens, events);
    await expect(service.revoke('session-1')).resolves.toBe(true);
    expect(events.publish).toHaveBeenCalledWith({
      event: AuthEvent.SessionRevoked,
      occurredAt: now,
      sessionId: 'session-1',
    });

    vi.mocked(events.publish).mockClear();
    vi.mocked(sessions.revoke).mockResolvedValue(false);
    await expect(service.revoke('missing')).resolves.toBe(false);
    expect(events.publish).not.toHaveBeenCalled();
  });

  it('revokes all sessions with exclusions and emits only for changed rows', async () => {
    const service = createService(sessions, tokens, events);
    await expect(service.revokeAllForUser('user-1', 'session-1')).resolves.toBe(
      2,
    );
    expect(sessions.revokeAllByUserId).toHaveBeenCalledWith(
      'user-1',
      'session-1',
    );
    expect(events.publish).toHaveBeenCalledWith({
      event: AuthEvent.AllSessionsRevoked,
      occurredAt: now,
      userId: 'user-1',
    });

    vi.mocked(events.publish).mockClear();
    vi.mocked(sessions.revokeAllByUserId).mockResolvedValue(0);
    await service.revokeAllForUser('user-1');
    expect(events.publish).not.toHaveBeenCalled();
  });
});

function createService(
  sessions: SessionRepository,
  tokens: TokenGenerator,
  events: AuthEventPublisher,
): SessionService {
  return new SessionService(sessions, tokens, events, {
    now: () => now,
    session: { lifetimeMs: 60_000, tokenEntropyBytes: 48 },
  });
}

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
    expiresAt: '2026-07-27T12:01:00.000Z',
    revokedAt: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  };
}
