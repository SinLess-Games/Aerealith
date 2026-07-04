// libs/db/src/schema/user/user-session.table.ts

import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import type { UserSessionGeoIp } from '@aerealith-ai/core'

import { usersTable } from './user.table'

/**
 * Stores authenticated user sessions.
 *
 * Only hashed session tokens are stored. Never persist or return raw tokens.
 * GeoIP coordinates are internal persistence data and must be removed from
 * normal session-management API responses.
 */
export const userSessionsTable = pgTable(
  'user_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, {
        onDelete: 'cascade',
      }),

    tokenHash: text('token_hash').notNull(),

    deviceName: varchar('device_name', {
      length: 255,
    }),

    userAgent: text('user_agent'),

    ipAddress: varchar('ip_address', {
      length: 45,
    }),

    geoIp: jsonb('geo_ip').$type<UserSessionGeoIp | null>(),

    lastSeenAt: timestamp('last_seen_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),

    expiresAt: timestamp('expires_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),

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
    uniqueIndex('user_sessions_token_hash_unique').on(table.tokenHash),

    index('user_sessions_user_id_index').on(table.userId),

    index('user_sessions_user_id_revoked_at_index').on(
      table.userId,
      table.revokedAt,
    ),

    index('user_sessions_expires_at_index').on(table.expiresAt),

    index('user_sessions_last_seen_at_index').on(table.lastSeenAt),
  ],
)

export type UserSessionRow = typeof userSessionsTable.$inferSelect

export type NewUserSessionRow = typeof userSessionsTable.$inferInsert
