'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.UserPreferencesContractSchema =
  exports.UpdateUserPreferencesEntitySchema =
  exports.CreateUserPreferencesEntitySchema =
  exports.UserPreferencesEntitySchema =
  exports.WeekStartDaySchema =
  exports.TimezoneUtcSchema =
  exports.TimezoneGreenwichSchema =
  exports.TimeFormatSchema =
  exports.NameDisplayOrderSchema =
  exports.MeasurementSystemSchema =
  exports.DateFormatSchema =
  exports.ContentMaturitySchema =
  exports.UserTimezoneSchema =
  exports.UserLocaleSchema =
  exports.UserPreferencesIdSchema =
    void 0;
const zod_1 = require('zod');
const enumns_1 = require('../../../enumns');
/**
 * Internal user preferences entity ID.
 */
exports.UserPreferencesIdSchema = zod_1.z.uuid();
/**
 * IETF BCP 47 locale code.
 *
 * Examples:
 * - en-US
 * - es-MX
 * - fr-CA
 */
exports.UserLocaleSchema = zod_1.z.string().trim().min(2).max(100);
/**
 * IANA timezone name.
 *
 * Examples:
 * - America/Boise
 * - America/New_York
 * - Europe/London
 */
exports.UserTimezoneSchema = zod_1.z.string().trim().min(1).max(100);
exports.ContentMaturitySchema = zod_1.z.enum(enumns_1.ContentMaturity);
exports.DateFormatSchema = zod_1.z.enum(enumns_1.DateFormat);
exports.MeasurementSystemSchema = zod_1.z.enum(enumns_1.MeasurementSystem);
exports.NameDisplayOrderSchema = zod_1.z.enum(enumns_1.NameDisplayOrder);
exports.TimeFormatSchema = zod_1.z.enum(enumns_1.TimeFormat);
exports.TimezoneGreenwichSchema = zod_1.z.enum(enumns_1.TimezoneGreenwich);
exports.TimezoneUtcSchema = zod_1.z.enum(enumns_1.TimezoneUtc);
exports.WeekStartDaySchema = zod_1.z.enum(enumns_1.WeekStartDay);
/**
 * Full internal user preferences entity schema.
 */
exports.UserPreferencesEntitySchema = zod_1.z.object({
  id: exports.UserPreferencesIdSchema,
  userId: zod_1.z.uuid(),
  locale: exports.UserLocaleSchema.nullable(),
  timezone: exports.UserTimezoneSchema.nullable(),
  timezoneUtc: exports.TimezoneUtcSchema.nullable(),
  timezoneGreenwich: exports.TimezoneGreenwichSchema.nullable(),
  dateFormat: exports.DateFormatSchema,
  timeFormat: exports.TimeFormatSchema,
  weekStartDay: exports.WeekStartDaySchema,
  nameDisplayOrder: exports.NameDisplayOrderSchema,
  measurementSystem: exports.MeasurementSystemSchema,
  contentMaturity: exports.ContentMaturitySchema,
  createdAt: zod_1.z.coerce.date(),
  updatedAt: zod_1.z.coerce.date(),
  deletedAt: zod_1.z.coerce.date().nullable(),
});
/**
 * Data accepted when creating user preferences.
 *
 * All preference fields are optional because `UserPreferencesEntity`
 * provides safe defaults.
 */
exports.CreateUserPreferencesEntitySchema = zod_1.z.object({
  userId: zod_1.z.uuid(),
  locale: exports.UserLocaleSchema.nullable().optional(),
  timezone: exports.UserTimezoneSchema.nullable().optional(),
  timezoneUtc: exports.TimezoneUtcSchema.nullable().optional(),
  timezoneGreenwich: exports.TimezoneGreenwichSchema.nullable().optional(),
  dateFormat: exports.DateFormatSchema.optional(),
  timeFormat: exports.TimeFormatSchema.optional(),
  weekStartDay: exports.WeekStartDaySchema.optional(),
  nameDisplayOrder: exports.NameDisplayOrderSchema.optional(),
  measurementSystem: exports.MeasurementSystemSchema.optional(),
  contentMaturity: exports.ContentMaturitySchema.optional(),
});
/**
 * Data allowed when updating user preferences.
 */
exports.UpdateUserPreferencesEntitySchema = zod_1.z.object({
  locale: exports.UserLocaleSchema.nullable().optional(),
  timezone: exports.UserTimezoneSchema.nullable().optional(),
  timezoneUtc: exports.TimezoneUtcSchema.nullable().optional(),
  timezoneGreenwich: exports.TimezoneGreenwichSchema.nullable().optional(),
  dateFormat: exports.DateFormatSchema.optional(),
  timeFormat: exports.TimeFormatSchema.optional(),
  weekStartDay: exports.WeekStartDaySchema.optional(),
  nameDisplayOrder: exports.NameDisplayOrderSchema.optional(),
  measurementSystem: exports.MeasurementSystemSchema.optional(),
  contentMaturity: exports.ContentMaturitySchema.optional(),
});
/**
 * API-safe user preferences response.
 */
exports.UserPreferencesContractSchema = zod_1.z.object({
  id: exports.UserPreferencesIdSchema,
  userId: zod_1.z.uuid(),
  locale: exports.UserLocaleSchema.nullable(),
  timezone: exports.UserTimezoneSchema.nullable(),
  timezoneUtc: exports.TimezoneUtcSchema.nullable(),
  timezoneGreenwich: exports.TimezoneGreenwichSchema.nullable(),
  dateFormat: exports.DateFormatSchema,
  timeFormat: exports.TimeFormatSchema,
  weekStartDay: exports.WeekStartDaySchema,
  nameDisplayOrder: exports.NameDisplayOrderSchema,
  measurementSystem: exports.MeasurementSystemSchema,
  contentMaturity: exports.ContentMaturitySchema,
  createdAt: zod_1.z.iso.datetime(),
  updatedAt: zod_1.z.iso.datetime(),
});
//# sourceMappingURL=preferences.schema.js.map
