import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiKeys: [] as string[],
  send: vi.fn(),
}));

vi.mock('resend', () => ({
  Resend: class {
    readonly emails = { send: mocks.send };

    constructor(apiKey: string) {
      mocks.apiKeys.push(apiKey);
    }
  },
}));

import {
  ConsoleEmailVerificationSender,
  ConsolePasswordResetSender,
  ResendEmailVerificationSender,
  ResendPasswordResetSender,
} from './resend-email-verification.sender';

describe('email senders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.apiKeys.length = 0;
    mocks.send.mockResolvedValue({ error: null });
  });

  it('sends a verification message through Resend', async () => {
    const sender = new ResendEmailVerificationSender(
      're_test',
      'Aerealith <noreply@example.com>',
    );

    await sender.send({
      email: 'person@example.com',
      displayName: 'Person',
      verificationUrl: 'https://example.com/verify?token=opaque',
      expiresInHours: 24,
    });

    expect(mocks.apiKeys).toEqual(['re_test']);
    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Aerealith <noreply@example.com>',
        to: 'person@example.com',
        subject: expect.stringMatching(/verify/i),
        html: expect.stringContaining(
          'https://example.com/verify?token=opaque',
        ),
        text: expect.stringContaining(
          'https://example.com/verify?token=opaque',
        ),
      }),
    );
  });

  it('sends password-reset content through Resend', async () => {
    const sender = new ResendPasswordResetSender(
      're_test',
      'noreply@example.com',
    );

    await sender.send({
      email: 'person@example.com',
      resetUrl: 'https://example.com/reset?token=opaque',
      expiresInHours: 1,
    });

    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'person@example.com',
        subject: expect.stringMatching(/reset/i),
        text: expect.stringContaining('reset your Aerealith password'),
      }),
    );
  });

  it.each([
    [
      'verification',
      () =>
        new ResendEmailVerificationSender(
          're_test',
          'noreply@example.com',
        ).send({
          email: 'person@example.com',
          verificationUrl: 'https://example.com/verify',
          expiresInHours: 24,
        }),
    ],
    [
      'password reset',
      () =>
        new ResendPasswordResetSender('re_test', 'noreply@example.com').send({
          email: 'person@example.com',
          resetUrl: 'https://example.com/reset',
          expiresInHours: 1,
        }),
    ],
  ])('reports a rejected %s message', async (_kind, send) => {
    mocks.send.mockResolvedValue({
      error: { message: 'provider unavailable' },
    });
    await expect(send()).rejects.toThrow('provider unavailable');
  });

  it('keeps development fallback senders silent', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await new ConsoleEmailVerificationSender().send();
    await new ConsolePasswordResetSender().send();

    expect(info).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });
});
