import { describe, expect, it } from 'vitest';

import { NewsletterRecipientEntity } from './newsletter-recipient.entity';

describe('NewsletterRecipientEntity', () => {
  it('normalizes an opted-in email address and records its source', () => {
    const recipient = new NewsletterRecipientEntity({
      email: '  News@Example.com ',
      source: ' landing_waitlist ',
    });

    expect(recipient.email).toBe('news@example.com');
    expect(recipient.source).toBe('landing_waitlist');
    expect(recipient.subscribedAt).toEqual(recipient.createdAt);
  });

  it('can restore a previously removed recipient', () => {
    const recipient = new NewsletterRecipientEntity({
      email: 'news@example.com',
      deletedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    recipient.resubscribe('footer');

    expect(recipient.deletedAt).toBeNull();
    expect(recipient.source).toBe('footer');
  });
});
