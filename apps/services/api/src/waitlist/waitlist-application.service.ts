import {
  DrizzleNewsletterRecipientRepository,
  DrizzleWaitlistRepository,
  type DatabaseClient,
} from '@aerealith-ai/db';

export type JoinWaitlistInput = {
  email: string;
  role?: string | null;
  newsletter: boolean;
};

export type JoinWaitlistResult = {
  joined: true;
  newsletterSubscribed: boolean;
};

export interface WaitlistApplication {
  join(input: JoinWaitlistInput): Promise<JoinWaitlistResult>;
}

/** Coordinates waitlist membership and explicit newsletter consent. */
export class WaitlistApplicationService implements WaitlistApplication {
  private readonly waitlist: DrizzleWaitlistRepository;
  private readonly newsletter: DrizzleNewsletterRecipientRepository;

  constructor(database: DatabaseClient) {
    this.waitlist = new DrizzleWaitlistRepository(database);
    this.newsletter = new DrizzleNewsletterRecipientRepository(database);
  }

  async join(input: JoinWaitlistInput): Promise<JoinWaitlistResult> {
    const existing = await this.waitlist.findByEmail(input.email);

    if (!existing) {
      try {
        await this.waitlist.create({ email: input.email, role: input.role });
      } catch (error) {
        // Concurrent submissions for the same normalized address are also a
        // successful, idempotent join. All other database errors still fail.
        if (!isUniqueViolation(error)) throw error;
      }
    }

    if (input.newsletter) {
      await this.newsletter.subscribe({
        email: input.email,
        source: 'landing_waitlist',
      });
    }

    return {
      joined: true,
      newsletterSubscribed: input.newsletter,
    };
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  );
}
