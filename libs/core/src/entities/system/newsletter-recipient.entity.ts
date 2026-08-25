import { BaseEntity, type BaseEntityInput } from '../base.entity';

export type NewsletterRecipientInput = BaseEntityInput & {
  email: string;
  source?: string;
  subscribedAt?: Date;
};

/**
 * An explicitly opted-in newsletter recipient.
 *
 * Keeping newsletter consent separate from the waitlist prevents a waitlist
 * submission from being treated as marketing consent unless the checkbox was
 * selected.
 */
export class NewsletterRecipientEntity extends BaseEntity {
  email: string;
  source: string;
  subscribedAt: Date;

  constructor(input: NewsletterRecipientInput) {
    super(input);
    this.email = input.email.trim().toLowerCase();
    this.source = input.source?.trim() || 'waitlist';
    this.subscribedAt = input.subscribedAt ?? this.createdAt;
  }

  resubscribe(source = this.source): void {
    this.source = source.trim() || 'waitlist';
    this.subscribedAt = new Date();
    this.deletedAt = null;
    this.touch();
  }
}
