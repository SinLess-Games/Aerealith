// libs/db/src/schema/user/user-profile.table.ts

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

import type {
  Country,
  Gender,
  RomanticOrientation,
  Sex,
  SexAttitude,
  Sexuality,
  UserProfileFieldVisibility,
  UserProfileLanguage,
  UserProfileLink,
} from '@aerealith-ai/core'

import { profileStatusDbEnum } from '../../enums'
import { usersTable } from './user.table'

/**
 * Stores a user's public profile and owner-visible profile details.
 *
 * Profile field visibility controls which values may appear in public API
 * responses. Services must still enforce that visibility before returning data.
 */
export const userProfilesTable = pgTable(
  'user_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, {
        onDelete: 'cascade',
      }),

    handle: varchar('handle', {
      length: 32,
    }).notNull(),

    displayName: varchar('display_name', {
      length: 100,
    }),

    givenName: varchar('given_name', {
      length: 100,
    }),

    middleName: varchar('middle_name', {
      length: 100,
    }),

    familyName: varchar('family_name', {
      length: 100,
    }),

    pronouns: varchar('pronouns', {
      length: 100,
    }),

    avatarUrl: text('avatar_url'),

    bannerUrl: text('banner_url'),

    bio: text('bio'),

    status: profileStatusDbEnum('status').default('pending_setup').notNull(),

    fieldVisibility: jsonb('field_visibility')
      .$type<UserProfileFieldVisibility>()
      .default({})
      .notNull(),

    locationLabel: varchar('location_label', {
      length: 255,
    }),

    country: varchar('country', {
      length: 100,
    }).$type<Country | null>(),

    gender: varchar('gender', {
      length: 100,
    }).$type<Gender | null>(),

    sex: varchar('sex', {
      length: 100,
    }).$type<Sex | null>(),

    sexuality: varchar('sexuality', {
      length: 100,
    }).$type<Sexuality | null>(),

    romanticOrientation: varchar('romantic_orientation', {
      length: 100,
    }).$type<RomanticOrientation | null>(),

    sexAttitude: varchar('sex_attitude', {
      length: 100,
    }).$type<SexAttitude | null>(),

    languages: jsonb('languages')
      .$type<UserProfileLanguage[]>()
      .default([])
      .notNull(),

    websiteUrl: text('website_url'),

    links: jsonb('links').$type<UserProfileLink[]>().default([]).notNull(),

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
    uniqueIndex('user_profiles_user_id_unique').on(table.userId),
    uniqueIndex('user_profiles_handle_unique').on(table.handle),
    index('user_profiles_status_index').on(table.status),
    index('user_profiles_country_index').on(table.country),
    index('user_profiles_created_at_index').on(table.createdAt),
  ],
)

export type UserProfileRow = typeof userProfilesTable.$inferSelect

export type NewUserProfileRow = typeof userProfilesTable.$inferInsert
