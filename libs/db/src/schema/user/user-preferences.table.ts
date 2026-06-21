// libs/db/src/schema/user/user-preferences.table.ts

import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import {
  ContentMaturity,
  DateFormat,
  MeasurementSystem,
  NameDisplayOrder,
  TimeFormat,
  WeekStartDay,
  type TimezoneGreenwich,
  type TimezoneUtc,
} from '@aerealith-ai/core';

import { usersTable } from './user.table';

/**
 * Stores a user's locale, date, time, measurement, and content preferences.
 *
 * Application enums remain validated in core. These values are stored as
 * varchar columns so adding a new preference value does not require a
 * PostgreSQL enum migration.
 */
export const userPreferencesTable = pgTable(
  'user_preferences',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, {
        onDelete: 'cascade',
      }),

    locale: varchar('locale', {
      length: 100,
    }),

    timezone: varchar('timezone', {
      length: 100,
    }),

    timezoneUtc: varchar('timezone_utc', {
      length: 16,
    }).$type<TimezoneUtc | null>(),

    timezoneGreenwich: varchar('timezone_greenwich', {
      length: 16,
    }).$type<TimezoneGreenwich | null>(),

    dateFormat: varchar('date_format', {
      length: 50,
    })
      .$type<DateFormat>()
      .default(DateFormat.Iso8601)
      .notNull(),

    timeFormat: varchar('time_format', {
      length: 50,
    })
      .$type<TimeFormat>()
      .default(TimeFormat.TwelveHour)
      .notNull(),

    weekStartDay: varchar('week_start_day', {
      length: 50,
    })
      .$type<WeekStartDay>()
      .default(WeekStartDay.LocaleDefault)
      .notNull(),

    nameDisplayOrder: varchar('name_display_order', {
      length: 50,
    })
      .$type<NameDisplayOrder>()
      .default(NameDisplayOrder.LocaleDefault)
      .notNull(),

    measurementSystem: varchar('measurement_system', {
      length: 50,
    })
      .$type<MeasurementSystem>()
      .default(MeasurementSystem.Metric)
      .notNull(),

    contentMaturity: varchar('content_maturity', {
      length: 50,
    })
      .$type<ContentMaturity>()
      .default(ContentMaturity.FamilyFriendly)
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
    uniqueIndex('user_preferences_user_id_unique').on(table.userId),
    index('user_preferences_locale_index').on(table.locale),
  ],
);

export type UserPreferencesRow =
  typeof userPreferencesTable.$inferSelect;

export type NewUserPreferencesRow =
  typeof userPreferencesTable.$inferInsert;
