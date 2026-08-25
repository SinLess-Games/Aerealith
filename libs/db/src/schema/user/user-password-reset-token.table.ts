import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { usersTable } from './user.table';

/**
 * Single-use, hashed tokens used to authorize a password reset.
 *
 * The opaque token is never stored here; callers persist only a secure hash.
 */
export const userPasswordResetTokensTable = pgTable(
  'user_password_reset_tokens',
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
    uniqueIndex('user_password_reset_tokens_token_hash_unique').on(
      table.tokenHash,
    ),
    index('user_password_reset_tokens_user_id_index').on(table.userId),
    index('user_password_reset_tokens_expires_at_index').on(table.expiresAt),
  ],
);

export type UserPasswordResetTokenRow =
  typeof userPasswordResetTokensTable.$inferSelect;
