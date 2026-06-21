// libs/db/src/schema/user/user-account.table.ts

import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { userAccountStatusDbEnum } from '../../enums';
import { usersTable } from './user.table';

/**
 * Stores external accounts linked to an Aerealith user.
 *
 * Examples:
 * - GitHub
 * - Google
 * - Discord
 * - Steam
 *
 * Provider account IDs remain database-internal and must not be returned
 * through normal API account-management responses.
 */
export const userAccountsTable = pgTable(
  'user_accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, {
        onDelete: 'cascade',
      }),

    provider: varchar('provider', {
      length: 100,
    }).notNull(),

    accountId: varchar('account_id', {
      length: 255,
    }).notNull(),

    displayName: varchar('display_name', {
      length: 255,
    }).notNull(),

    managementUrl: text('management_url'),

    status: userAccountStatusDbEnum('status')
      .default('active')
      .notNull(),

    connectedAt: timestamp('connected_at', {
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
    uniqueIndex('user_accounts_provider_account_id_unique').on(
      table.provider,
      table.accountId,
    ),
    index('user_accounts_user_id_index').on(table.userId),
    index('user_accounts_status_index').on(table.status),
    index('user_accounts_connected_at_index').on(table.connectedAt),
  ],
);

export type UserAccountRow = typeof userAccountsTable.$inferSelect;
export type NewUserAccountRow = typeof userAccountsTable.$inferInsert;
