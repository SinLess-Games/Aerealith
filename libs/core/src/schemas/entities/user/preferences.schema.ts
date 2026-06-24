import { z } from 'zod'

import {
  ContentMaturity,
  DateFormat,
  MeasurementSystem,
  NameDisplayOrder,
  TimeFormat,
  TimezoneGreenwich,
  TimezoneUtc,
  WeekStartDay,
} from '../../../enumns'

/**
 * Internal user preferences entity ID.
 */
export const UserPreferencesIdSchema = z.uuid()

/**
 * IETF BCP 47 locale code.
 *
 * Examples:
 * - en-US
 * - es-MX
 * - fr-CA
 */
export const UserLocaleSchema = z.string().trim().min(2).max(100)

/**
 * IANA timezone name.
 *
 * Examples:
 * - America/Boise
 * - America/New_York
 * - Europe/London
 */
export const UserTimezoneSchema = z.string().trim().min(1).max(100)

export const ContentMaturitySchema = z.enum(ContentMaturity)

export const DateFormatSchema = z.enum(DateFormat)

export const MeasurementSystemSchema = z.enum(MeasurementSystem)

export const NameDisplayOrderSchema = z.enum(NameDisplayOrder)

export const TimeFormatSchema = z.enum(TimeFormat)

export const TimezoneGreenwichSchema = z.enum(TimezoneGreenwich)

export const TimezoneUtcSchema = z.enum(TimezoneUtc)

export const WeekStartDaySchema = z.enum(WeekStartDay)

/**
 * Full internal user preferences entity schema.
 */
export const UserPreferencesEntitySchema = z.object({
  id: UserPreferencesIdSchema,
  userId: z.uuid(),

  locale: UserLocaleSchema.nullable(),
  timezone: UserTimezoneSchema.nullable(),
  timezoneUtc: TimezoneUtcSchema.nullable(),
  timezoneGreenwich: TimezoneGreenwichSchema.nullable(),

  dateFormat: DateFormatSchema,
  timeFormat: TimeFormatSchema,
  weekStartDay: WeekStartDaySchema,
  nameDisplayOrder: NameDisplayOrderSchema,
  measurementSystem: MeasurementSystemSchema,
  contentMaturity: ContentMaturitySchema,

  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

/**
 * Data accepted when creating user preferences.
 *
 * All preference fields are optional because `UserPreferencesEntity`
 * provides safe defaults.
 */
export const CreateUserPreferencesEntitySchema = z.object({
  userId: z.uuid(),

  locale: UserLocaleSchema.nullable().optional(),
  timezone: UserTimezoneSchema.nullable().optional(),
  timezoneUtc: TimezoneUtcSchema.nullable().optional(),
  timezoneGreenwich: TimezoneGreenwichSchema.nullable().optional(),

  dateFormat: DateFormatSchema.optional(),
  timeFormat: TimeFormatSchema.optional(),
  weekStartDay: WeekStartDaySchema.optional(),
  nameDisplayOrder: NameDisplayOrderSchema.optional(),
  measurementSystem: MeasurementSystemSchema.optional(),
  contentMaturity: ContentMaturitySchema.optional(),
})

/**
 * Data allowed when updating user preferences.
 */
export const UpdateUserPreferencesEntitySchema = z.object({
  locale: UserLocaleSchema.nullable().optional(),
  timezone: UserTimezoneSchema.nullable().optional(),
  timezoneUtc: TimezoneUtcSchema.nullable().optional(),
  timezoneGreenwich: TimezoneGreenwichSchema.nullable().optional(),

  dateFormat: DateFormatSchema.optional(),
  timeFormat: TimeFormatSchema.optional(),
  weekStartDay: WeekStartDaySchema.optional(),
  nameDisplayOrder: NameDisplayOrderSchema.optional(),
  measurementSystem: MeasurementSystemSchema.optional(),
  contentMaturity: ContentMaturitySchema.optional(),
})

/**
 * API-safe user preferences response.
 */
export const UserPreferencesContractSchema = z.object({
  id: UserPreferencesIdSchema,
  userId: z.uuid(),

  locale: UserLocaleSchema.nullable(),
  timezone: UserTimezoneSchema.nullable(),
  timezoneUtc: TimezoneUtcSchema.nullable(),
  timezoneGreenwich: TimezoneGreenwichSchema.nullable(),

  dateFormat: DateFormatSchema,
  timeFormat: TimeFormatSchema,
  weekStartDay: WeekStartDaySchema,
  nameDisplayOrder: NameDisplayOrderSchema,
  measurementSystem: MeasurementSystemSchema,
  contentMaturity: ContentMaturitySchema,

  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export type UserPreferencesEntitySchemaType = z.infer<
  typeof UserPreferencesEntitySchema
>

export type CreateUserPreferencesEntityInput = z.infer<
  typeof CreateUserPreferencesEntitySchema
>

export type UpdateUserPreferencesEntityInput = z.infer<
  typeof UpdateUserPreferencesEntitySchema
>

export type UserPreferencesContractSchemaType = z.infer<
  typeof UserPreferencesContractSchema
>
