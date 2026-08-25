import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { usersTable } from './user.table';

/** Single-use, hashed tokens used to prove ownership of an email address. */
export const userEmailVerificationTokensTable = pgTable(
  'user_email_verification_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    consumedAt: timestamp('consumed_at', {
      withTimezone: true,
      mode: 'date',
    }),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('user_email_verification_tokens_token_hash_unique').on(
      table.tokenHash,
    ),
    index('user_email_verification_tokens_user_id_index').on(table.userId),
    index('user_email_verification_tokens_expires_at_index').on(
      table.expiresAt,
    ),
  ],
);

export type UserEmailVerificationTokenRow =
  typeof userEmailVerificationTokensTable.$inferSelect;
