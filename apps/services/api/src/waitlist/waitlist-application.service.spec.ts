import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findByEmail: vi.fn(),
  create: vi.fn(),
  subscribe: vi.fn(),
}));

vi.mock('@aerealith-ai/db', () => ({
  DrizzleWaitlistRepository: class {
    findByEmail = mocks.findByEmail;
    create = mocks.create;
  },
  DrizzleNewsletterRecipientRepository: class {
    subscribe = mocks.subscribe;
  },
}));

import { WaitlistApplicationService } from './waitlist-application.service';

describe('WaitlistApplicationService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a waitlist entry and a recipient after explicit opt-in', async () => {
    mocks.findByEmail.mockResolvedValue(null);
    mocks.create.mockResolvedValue({ id: 'waitlist-1' });
    mocks.subscribe.mockResolvedValue({ id: 'recipient-1' });
    const application = new WaitlistApplicationService({} as never);

    await expect(
      application.join({
        email: 'hello@example.com',
        role: 'Developer',
        newsletter: true,
      }),
    ).resolves.toEqual({ joined: true, newsletterSubscribed: true });

    expect(mocks.create).toHaveBeenCalledWith({
      email: 'hello@example.com',
      role: 'Developer',
    });
    expect(mocks.subscribe).toHaveBeenCalledWith({
      email: 'hello@example.com',
      source: 'landing_waitlist',
    });
  });

  it('keeps newsletter consent optional and waitlist joins idempotent', async () => {
    mocks.findByEmail.mockResolvedValue({ id: 'waitlist-1' });
    const application = new WaitlistApplicationService({} as never);

    await expect(
      application.join({
        email: 'hello@example.com',
        newsletter: false,
      }),
    ).resolves.toEqual({ joined: true, newsletterSubscribed: false });

    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.subscribe).not.toHaveBeenCalled();
  });
});
