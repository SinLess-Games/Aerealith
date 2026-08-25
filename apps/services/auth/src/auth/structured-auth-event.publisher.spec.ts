import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthEvent, AuthFailureReason } from '@aerealith-ai/auth';

import { StructuredAuthEventPublisher } from './structured-auth-event.publisher';

describe('StructuredAuthEventPublisher', () => {
  afterEach(() => vi.restoreAllMocks());

  it('emits structured metadata without serializing arbitrary event fields', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const publisher = new StructuredAuthEventPublisher();

    publisher.publish({
      event: AuthEvent.PasswordAuthenticationSucceeded,
      occurredAt: new Date('2026-08-13T12:00:00.000Z'),
      userId: 'user-1',
      sessionId: 'session-1',
      reason: AuthFailureReason.InvalidCredentials,
    });

    expect(info).toHaveBeenCalledOnce();
    expect(JSON.parse(String(info.mock.calls[0]?.[0]))).toEqual({
      event: 'auth.security_event',
      authEvent: 'auth.password.succeeded',
      occurredAt: '2026-08-13T12:00:00.000Z',
      userId: 'user-1',
      sessionId: 'session-1',
      reason: 'invalid_credentials',
    });
  });
});
