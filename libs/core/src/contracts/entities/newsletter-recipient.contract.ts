/**
 * An email address that explicitly consented to receive the newsletter.
 */
export type NewsletterRecipientContract = {
  id: string;
  email: string;
  source: string;
  subscribedAt: string;
  createdAt: string;
};

/**
 * Data required to subscribe an email address to the newsletter.
 */
export type SubscribeNewsletterContract = {
  email: string;
  source?: string;
};
