// libs/db/src/schema/user/user-consent.table.ts

import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { userConsentTypeDbEnum } from '../../enums'
import { usersTable } from './user.table'

/**
 * Stores a user's current consent decision for each consent category.
 *
 * A user has one record per consent type. New consent versions update the
 * existing record instead of creating duplicate active consent records.
 */
export const userConsentsTable = pgTable(
  'user_consents',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, {
        onDelete: 'cascade',
      }),

    type: userConsentTypeDbEnum('type').notNull(),

    version: varchar('version', {
      length: 100,
    }),

    grantedAt: timestamp('granted_at', {
      withTimezone: true,
      mode: 'date',
    }),

    revokedAt: timestamp('revoked_at', {
      withTimezone: true,
      mode: 'date',
    }),

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
    uniqueIndex('user_consents_user_id_type_unique').on(
      table.userId,
      table.type,
    ),
    index('user_consents_user_id_index').on(table.userId),
    index('user_consents_type_index').on(table.type),
    index('user_consents_granted_at_index').on(table.grantedAt),
  ],
)

export type UserConsentRow = typeof userConsentsTable.$inferSelect
export type NewUserConsentRow = typeof userConsentsTable.$inferInsert
