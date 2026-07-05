// libs/db/src/schema/system/waitlist.table.ts

import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

/**
 * Stores email addresses submitted through the public waitlist form.
 *
 * Email addresses are normalized by the core validation schema before
 * they reach this table.
 */
export const waitlistTable = pgTable(
  'waitlist_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    email: varchar('email', {
      length: 320,
    }).notNull(),

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
    uniqueIndex('waitlist_entries_email_unique').on(table.email),
    index('waitlist_entries_created_at_index').on(table.createdAt),
  ],
)

export type WaitlistRow = typeof waitlistTable.$inferSelect
export type NewWaitlistRow = typeof waitlistTable.$inferInsert
