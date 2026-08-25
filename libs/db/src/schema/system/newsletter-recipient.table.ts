import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/** Stores email addresses that explicitly opted in to newsletter delivery. */
export const newsletterRecipientsTable = pgTable(
  'newsletter_recipients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 320 }).notNull(),
    source: varchar('source', { length: 100 }).default('waitlist').notNull(),
    subscribedAt: timestamp('subscribed_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', {
      withTimezone: true,
      mode: 'date',
    }),
  },
  (table) => [
    uniqueIndex('newsletter_recipients_email_unique').on(table.email),
    index('newsletter_recipients_subscribed_at_index').on(table.subscribedAt),
  ],
);

export type NewsletterRecipientRow =
  typeof newsletterRecipientsTable.$inferSelect;

export type NewNewsletterRecipientRow =
  typeof newsletterRecipientsTable.$inferInsert;
