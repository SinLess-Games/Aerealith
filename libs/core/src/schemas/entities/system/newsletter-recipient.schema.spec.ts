import { describe, expect, it } from 'vitest';

import {
  CreateNewsletterRecipientEntitySchema,
  NewsletterRecipientEntitySchema,
} from './newsletter-recipient.schema';

describe('newsletter recipient schemas', () => {
  it('normalizes valid subscription input', () => {
    expect(
      CreateNewsletterRecipientEntitySchema.parse({
        email: '  News@Example.com ',
        source: 'landing_waitlist',
      }),
    ).toEqual({ email: 'news@example.com', source: 'landing_waitlist' });
  });

  it('validates the persisted entity shape', () => {
    expect(
      NewsletterRecipientEntitySchema.safeParse({
        id: '0d065b5d-ce46-4707-86ca-f2ed9bcf9290',
        email: 'news@example.com',
        source: 'landing_waitlist',
        subscribedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }).success,
    ).toBe(true);
  });
});
