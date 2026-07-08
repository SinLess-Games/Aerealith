import { z } from 'zod';
/**
 * Internal user preferences entity ID.
 */
export declare const UserPreferencesIdSchema: z.ZodUUID;
/**
 * IETF BCP 47 locale code.
 *
 * Examples:
 * - en-US
 * - es-MX
 * - fr-CA
 */
export declare const UserLocaleSchema: z.ZodString;
/**
 * IANA timezone name.
 *
 * Examples:
 * - America/Boise
 * - America/New_York
 * - Europe/London
 */
export declare const UserTimezoneSchema: z.ZodString;
export declare const ContentMaturitySchema: z.ZodEnum<{
  readonly Unspecified: 'unspecified';
  readonly SafeOnly: 'safe_only';
  readonly FamilyFriendly: 'family_friendly';
  readonly Teen: 'teen';
  readonly Mature: 'mature';
  readonly Explicit: 'explicit';
  readonly Restricted: 'restricted';
}>;
export declare const DateFormatSchema: z.ZodEnum<{
  readonly Unspecified: 'unspecified';
  readonly Iso8601: 'yyyy-MM-dd';
  readonly Us: 'MM/dd/yyyy';
  readonly European: 'dd/MM/yyyy';
  readonly Long: 'MMMM d, yyyy';
  readonly ShortMonth: 'MMM d, yyyy';
}>;
export declare const MeasurementSystemSchema: z.ZodEnum<{
  readonly Unspecified: 'unspecified';
  readonly Imperial: 'imperial';
  readonly Metric: 'metric';
  readonly Scientific: 'scientific';
}>;
export declare const NameDisplayOrderSchema: z.ZodEnum<{
  readonly Unspecified: 'unspecified';
  readonly LocaleDefault: 'locale_default';
  readonly DisplayNameOnly: 'display_name_only';
  readonly UsernameOnly: 'username_only';
  readonly GivenFamily: 'given_family';
  readonly FamilyGiven: 'family_given';
  readonly FamilyCommaGiven: 'family_comma_given';
  readonly GivenMiddleFamily: 'given_middle_family';
  readonly GivenMiddleInitialFamily: 'given_middle_initial_family';
  readonly TitleGivenFamily: 'title_given_family';
  readonly GivenFamilySuffix: 'given_family_suffix';
  readonly TitleGivenFamilySuffix: 'title_given_family_suffix';
  readonly Custom: 'custom';
}>;
export declare const TimeFormatSchema: z.ZodEnum<{
  readonly Unspecified: 'unspecified';
  readonly TwelveHour: '12-hour';
  readonly TwentyFourHour: '24-hour';
}>;
export declare const TimezoneGreenwichSchema: z.ZodEnum<{
  readonly GmtMinus1200: 'GMT-12:00';
  readonly GmtMinus1100: 'GMT-11:00';
  readonly GmtMinus1000: 'GMT-10:00';
  readonly GmtMinus0930: 'GMT-09:30';
  readonly GmtMinus0900: 'GMT-09:00';
  readonly GmtMinus0800: 'GMT-08:00';
  readonly GmtMinus0700: 'GMT-07:00';
  readonly GmtMinus0600: 'GMT-06:00';
  readonly GmtMinus0500: 'GMT-05:00';
  readonly GmtMinus0400: 'GMT-04:00';
  readonly GmtMinus0330: 'GMT-03:30';
  readonly GmtMinus0300: 'GMT-03:00';
  readonly GmtMinus0230: 'GMT-02:30';
  readonly GmtMinus0200: 'GMT-02:00';
  readonly GmtMinus0100: 'GMT-01:00';
  readonly GmtPlus0000: 'GMT+00:00';
  readonly GmtPlus0100: 'GMT+01:00';
  readonly GmtPlus0200: 'GMT+02:00';
  readonly GmtPlus0300: 'GMT+03:00';
  readonly GmtPlus0330: 'GMT+03:30';
  readonly GmtPlus0400: 'GMT+04:00';
  readonly GmtPlus0430: 'GMT+04:30';
  readonly GmtPlus0500: 'GMT+05:00';
  readonly GmtPlus0530: 'GMT+05:30';
  readonly GmtPlus0545: 'GMT+05:45';
  readonly GmtPlus0600: 'GMT+06:00';
  readonly GmtPlus0630: 'GMT+06:30';
  readonly GmtPlus0700: 'GMT+07:00';
  readonly GmtPlus0800: 'GMT+08:00';
  readonly GmtPlus0845: 'GMT+08:45';
  readonly GmtPlus0900: 'GMT+09:00';
  readonly GmtPlus0930: 'GMT+09:30';
  readonly GmtPlus1000: 'GMT+10:00';
  readonly GmtPlus1030: 'GMT+10:30';
  readonly GmtPlus1100: 'GMT+11:00';
  readonly GmtPlus1200: 'GMT+12:00';
  readonly GmtPlus1245: 'GMT+12:45';
  readonly GmtPlus1300: 'GMT+13:00';
  readonly GmtPlus1345: 'GMT+13:45';
  readonly GmtPlus1400: 'GMT+14:00';
}>;
export declare const TimezoneUtcSchema: z.ZodEnum<{
  readonly UtcMinus1200: 'UTC-12:00';
  readonly UtcMinus1100: 'UTC-11:00';
  readonly UtcMinus1000: 'UTC-10:00';
  readonly UtcMinus0930: 'UTC-09:30';
  readonly UtcMinus0900: 'UTC-09:00';
  readonly UtcMinus0800: 'UTC-08:00';
  readonly UtcMinus0700: 'UTC-07:00';
  readonly UtcMinus0600: 'UTC-06:00';
  readonly UtcMinus0500: 'UTC-05:00';
  readonly UtcMinus0400: 'UTC-04:00';
  readonly UtcMinus0330: 'UTC-03:30';
  readonly UtcMinus0300: 'UTC-03:00';
  readonly UtcMinus0230: 'UTC-02:30';
  readonly UtcMinus0200: 'UTC-02:00';
  readonly UtcMinus0100: 'UTC-01:00';
  readonly UtcPlus0000: 'UTC+00:00';
  readonly UtcPlus0100: 'UTC+01:00';
  readonly UtcPlus0200: 'UTC+02:00';
  readonly UtcPlus0300: 'UTC+03:00';
  readonly UtcPlus0330: 'UTC+03:30';
  readonly UtcPlus0400: 'UTC+04:00';
  readonly UtcPlus0430: 'UTC+04:30';
  readonly UtcPlus0500: 'UTC+05:00';
  readonly UtcPlus0530: 'UTC+05:30';
  readonly UtcPlus0545: 'UTC+05:45';
  readonly UtcPlus0600: 'UTC+06:00';
  readonly UtcPlus0630: 'UTC+06:30';
  readonly UtcPlus0700: 'UTC+07:00';
  readonly UtcPlus0800: 'UTC+08:00';
  readonly UtcPlus0845: 'UTC+08:45';
  readonly UtcPlus0900: 'UTC+09:00';
  readonly UtcPlus0930: 'UTC+09:30';
  readonly UtcPlus1000: 'UTC+10:00';
  readonly UtcPlus1030: 'UTC+10:30';
  readonly UtcPlus1100: 'UTC+11:00';
  readonly UtcPlus1200: 'UTC+12:00';
  readonly UtcPlus1245: 'UTC+12:45';
  readonly UtcPlus1300: 'UTC+13:00';
  readonly UtcPlus1345: 'UTC+13:45';
  readonly UtcPlus1400: 'UTC+14:00';
}>;
export declare const WeekStartDaySchema: z.ZodEnum<{
  readonly Unspecified: 'unspecified';
  readonly LocaleDefault: 'locale_default';
  readonly Sunday: 'sunday';
  readonly Monday: 'monday';
  readonly Tuesday: 'tuesday';
  readonly Wednesday: 'wednesday';
  readonly Thursday: 'thursday';
  readonly Friday: 'friday';
  readonly Saturday: 'saturday';
  readonly ISO8601: 'iso_8601';
}>;
/**
 * Full internal user preferences entity schema.
 */
export declare const UserPreferencesEntitySchema: z.ZodObject<
  {
    id: z.ZodUUID;
    userId: z.ZodUUID;
    locale: z.ZodNullable<z.ZodString>;
    timezone: z.ZodNullable<z.ZodString>;
    timezoneUtc: z.ZodNullable<
      z.ZodEnum<{
        readonly UtcMinus1200: 'UTC-12:00';
        readonly UtcMinus1100: 'UTC-11:00';
        readonly UtcMinus1000: 'UTC-10:00';
        readonly UtcMinus0930: 'UTC-09:30';
        readonly UtcMinus0900: 'UTC-09:00';
        readonly UtcMinus0800: 'UTC-08:00';
        readonly UtcMinus0700: 'UTC-07:00';
        readonly UtcMinus0600: 'UTC-06:00';
        readonly UtcMinus0500: 'UTC-05:00';
        readonly UtcMinus0400: 'UTC-04:00';
        readonly UtcMinus0330: 'UTC-03:30';
        readonly UtcMinus0300: 'UTC-03:00';
        readonly UtcMinus0230: 'UTC-02:30';
        readonly UtcMinus0200: 'UTC-02:00';
        readonly UtcMinus0100: 'UTC-01:00';
        readonly UtcPlus0000: 'UTC+00:00';
        readonly UtcPlus0100: 'UTC+01:00';
        readonly UtcPlus0200: 'UTC+02:00';
        readonly UtcPlus0300: 'UTC+03:00';
        readonly UtcPlus0330: 'UTC+03:30';
        readonly UtcPlus0400: 'UTC+04:00';
        readonly UtcPlus0430: 'UTC+04:30';
        readonly UtcPlus0500: 'UTC+05:00';
        readonly UtcPlus0530: 'UTC+05:30';
        readonly UtcPlus0545: 'UTC+05:45';
        readonly UtcPlus0600: 'UTC+06:00';
        readonly UtcPlus0630: 'UTC+06:30';
        readonly UtcPlus0700: 'UTC+07:00';
        readonly UtcPlus0800: 'UTC+08:00';
        readonly UtcPlus0845: 'UTC+08:45';
        readonly UtcPlus0900: 'UTC+09:00';
        readonly UtcPlus0930: 'UTC+09:30';
        readonly UtcPlus1000: 'UTC+10:00';
        readonly UtcPlus1030: 'UTC+10:30';
        readonly UtcPlus1100: 'UTC+11:00';
        readonly UtcPlus1200: 'UTC+12:00';
        readonly UtcPlus1245: 'UTC+12:45';
        readonly UtcPlus1300: 'UTC+13:00';
        readonly UtcPlus1345: 'UTC+13:45';
        readonly UtcPlus1400: 'UTC+14:00';
      }>
    >;
    timezoneGreenwich: z.ZodNullable<
      z.ZodEnum<{
        readonly GmtMinus1200: 'GMT-12:00';
        readonly GmtMinus1100: 'GMT-11:00';
        readonly GmtMinus1000: 'GMT-10:00';
        readonly GmtMinus0930: 'GMT-09:30';
        readonly GmtMinus0900: 'GMT-09:00';
        readonly GmtMinus0800: 'GMT-08:00';
        readonly GmtMinus0700: 'GMT-07:00';
        readonly GmtMinus0600: 'GMT-06:00';
        readonly GmtMinus0500: 'GMT-05:00';
        readonly GmtMinus0400: 'GMT-04:00';
        readonly GmtMinus0330: 'GMT-03:30';
        readonly GmtMinus0300: 'GMT-03:00';
        readonly GmtMinus0230: 'GMT-02:30';
        readonly GmtMinus0200: 'GMT-02:00';
        readonly GmtMinus0100: 'GMT-01:00';
        readonly GmtPlus0000: 'GMT+00:00';
        readonly GmtPlus0100: 'GMT+01:00';
        readonly GmtPlus0200: 'GMT+02:00';
        readonly GmtPlus0300: 'GMT+03:00';
        readonly GmtPlus0330: 'GMT+03:30';
        readonly GmtPlus0400: 'GMT+04:00';
        readonly GmtPlus0430: 'GMT+04:30';
        readonly GmtPlus0500: 'GMT+05:00';
        readonly GmtPlus0530: 'GMT+05:30';
        readonly GmtPlus0545: 'GMT+05:45';
        readonly GmtPlus0600: 'GMT+06:00';
        readonly GmtPlus0630: 'GMT+06:30';
        readonly GmtPlus0700: 'GMT+07:00';
        readonly GmtPlus0800: 'GMT+08:00';
        readonly GmtPlus0845: 'GMT+08:45';
        readonly GmtPlus0900: 'GMT+09:00';
        readonly GmtPlus0930: 'GMT+09:30';
        readonly GmtPlus1000: 'GMT+10:00';
        readonly GmtPlus1030: 'GMT+10:30';
        readonly GmtPlus1100: 'GMT+11:00';
        readonly GmtPlus1200: 'GMT+12:00';
        readonly GmtPlus1245: 'GMT+12:45';
        readonly GmtPlus1300: 'GMT+13:00';
        readonly GmtPlus1345: 'GMT+13:45';
        readonly GmtPlus1400: 'GMT+14:00';
      }>
    >;
    dateFormat: z.ZodEnum<{
      readonly Unspecified: 'unspecified';
      readonly Iso8601: 'yyyy-MM-dd';
      readonly Us: 'MM/dd/yyyy';
      readonly European: 'dd/MM/yyyy';
      readonly Long: 'MMMM d, yyyy';
      readonly ShortMonth: 'MMM d, yyyy';
    }>;
    timeFormat: z.ZodEnum<{
      readonly Unspecified: 'unspecified';
      readonly TwelveHour: '12-hour';
      readonly TwentyFourHour: '24-hour';
    }>;
    weekStartDay: z.ZodEnum<{
      readonly Unspecified: 'unspecified';
      readonly LocaleDefault: 'locale_default';
      readonly Sunday: 'sunday';
      readonly Monday: 'monday';
      readonly Tuesday: 'tuesday';
      readonly Wednesday: 'wednesday';
      readonly Thursday: 'thursday';
      readonly Friday: 'friday';
      readonly Saturday: 'saturday';
      readonly ISO8601: 'iso_8601';
    }>;
    nameDisplayOrder: z.ZodEnum<{
      readonly Unspecified: 'unspecified';
      readonly LocaleDefault: 'locale_default';
      readonly DisplayNameOnly: 'display_name_only';
      readonly UsernameOnly: 'username_only';
      readonly GivenFamily: 'given_family';
      readonly FamilyGiven: 'family_given';
      readonly FamilyCommaGiven: 'family_comma_given';
      readonly GivenMiddleFamily: 'given_middle_family';
      readonly GivenMiddleInitialFamily: 'given_middle_initial_family';
      readonly TitleGivenFamily: 'title_given_family';
      readonly GivenFamilySuffix: 'given_family_suffix';
      readonly TitleGivenFamilySuffix: 'title_given_family_suffix';
      readonly Custom: 'custom';
    }>;
    measurementSystem: z.ZodEnum<{
      readonly Unspecified: 'unspecified';
      readonly Imperial: 'imperial';
      readonly Metric: 'metric';
      readonly Scientific: 'scientific';
    }>;
    contentMaturity: z.ZodEnum<{
      readonly Unspecified: 'unspecified';
      readonly SafeOnly: 'safe_only';
      readonly FamilyFriendly: 'family_friendly';
      readonly Teen: 'teen';
      readonly Mature: 'mature';
      readonly Explicit: 'explicit';
      readonly Restricted: 'restricted';
    }>;
    createdAt: z.ZodCoercedDate<unknown>;
    updatedAt: z.ZodCoercedDate<unknown>;
    deletedAt: z.ZodNullable<z.ZodCoercedDate<unknown>>;
  },
  z.core.$strip
>;
/**
 * Data accepted when creating user preferences.
 *
 * All preference fields are optional because `UserPreferencesEntity`
 * provides safe defaults.
 */
export declare const CreateUserPreferencesEntitySchema: z.ZodObject<
  {
    userId: z.ZodUUID;
    locale: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    timezone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    timezoneUtc: z.ZodOptional<
      z.ZodNullable<
        z.ZodEnum<{
          readonly UtcMinus1200: 'UTC-12:00';
          readonly UtcMinus1100: 'UTC-11:00';
          readonly UtcMinus1000: 'UTC-10:00';
          readonly UtcMinus0930: 'UTC-09:30';
          readonly UtcMinus0900: 'UTC-09:00';
          readonly UtcMinus0800: 'UTC-08:00';
          readonly UtcMinus0700: 'UTC-07:00';
          readonly UtcMinus0600: 'UTC-06:00';
          readonly UtcMinus0500: 'UTC-05:00';
          readonly UtcMinus0400: 'UTC-04:00';
          readonly UtcMinus0330: 'UTC-03:30';
          readonly UtcMinus0300: 'UTC-03:00';
          readonly UtcMinus0230: 'UTC-02:30';
          readonly UtcMinus0200: 'UTC-02:00';
          readonly UtcMinus0100: 'UTC-01:00';
          readonly UtcPlus0000: 'UTC+00:00';
          readonly UtcPlus0100: 'UTC+01:00';
          readonly UtcPlus0200: 'UTC+02:00';
          readonly UtcPlus0300: 'UTC+03:00';
          readonly UtcPlus0330: 'UTC+03:30';
          readonly UtcPlus0400: 'UTC+04:00';
          readonly UtcPlus0430: 'UTC+04:30';
          readonly UtcPlus0500: 'UTC+05:00';
          readonly UtcPlus0530: 'UTC+05:30';
          readonly UtcPlus0545: 'UTC+05:45';
          readonly UtcPlus0600: 'UTC+06:00';
          readonly UtcPlus0630: 'UTC+06:30';
          readonly UtcPlus0700: 'UTC+07:00';
          readonly UtcPlus0800: 'UTC+08:00';
          readonly UtcPlus0845: 'UTC+08:45';
          readonly UtcPlus0900: 'UTC+09:00';
          readonly UtcPlus0930: 'UTC+09:30';
          readonly UtcPlus1000: 'UTC+10:00';
          readonly UtcPlus1030: 'UTC+10:30';
          readonly UtcPlus1100: 'UTC+11:00';
          readonly UtcPlus1200: 'UTC+12:00';
          readonly UtcPlus1245: 'UTC+12:45';
          readonly UtcPlus1300: 'UTC+13:00';
          readonly UtcPlus1345: 'UTC+13:45';
          readonly UtcPlus1400: 'UTC+14:00';
        }>
      >
    >;
    timezoneGreenwich: z.ZodOptional<
      z.ZodNullable<
        z.ZodEnum<{
          readonly GmtMinus1200: 'GMT-12:00';
          readonly GmtMinus1100: 'GMT-11:00';
          readonly GmtMinus1000: 'GMT-10:00';
          readonly GmtMinus0930: 'GMT-09:30';
          readonly GmtMinus0900: 'GMT-09:00';
          readonly GmtMinus0800: 'GMT-08:00';
          readonly GmtMinus0700: 'GMT-07:00';
          readonly GmtMinus0600: 'GMT-06:00';
          readonly GmtMinus0500: 'GMT-05:00';
          readonly GmtMinus0400: 'GMT-04:00';
          readonly GmtMinus0330: 'GMT-03:30';
          readonly GmtMinus0300: 'GMT-03:00';
          readonly GmtMinus0230: 'GMT-02:30';
          readonly GmtMinus0200: 'GMT-02:00';
          readonly GmtMinus0100: 'GMT-01:00';
          readonly GmtPlus0000: 'GMT+00:00';
          readonly GmtPlus0100: 'GMT+01:00';
          readonly GmtPlus0200: 'GMT+02:00';
          readonly GmtPlus0300: 'GMT+03:00';
          readonly GmtPlus0330: 'GMT+03:30';
          readonly GmtPlus0400: 'GMT+04:00';
          readonly GmtPlus0430: 'GMT+04:30';
          readonly GmtPlus0500: 'GMT+05:00';
          readonly GmtPlus0530: 'GMT+05:30';
          readonly GmtPlus0545: 'GMT+05:45';
          readonly GmtPlus0600: 'GMT+06:00';
          readonly GmtPlus0630: 'GMT+06:30';
          readonly GmtPlus0700: 'GMT+07:00';
          readonly GmtPlus0800: 'GMT+08:00';
          readonly GmtPlus0845: 'GMT+08:45';
          readonly GmtPlus0900: 'GMT+09:00';
          readonly GmtPlus0930: 'GMT+09:30';
          readonly GmtPlus1000: 'GMT+10:00';
          readonly GmtPlus1030: 'GMT+10:30';
          readonly GmtPlus1100: 'GMT+11:00';
          readonly GmtPlus1200: 'GMT+12:00';
          readonly GmtPlus1245: 'GMT+12:45';
          readonly GmtPlus1300: 'GMT+13:00';
          readonly GmtPlus1345: 'GMT+13:45';
          readonly GmtPlus1400: 'GMT+14:00';
        }>
      >
    >;
    dateFormat: z.ZodOptional<
      z.ZodEnum<{
        readonly Unspecified: 'unspecified';
        readonly Iso8601: 'yyyy-MM-dd';
        readonly Us: 'MM/dd/yyyy';
        readonly European: 'dd/MM/yyyy';
        readonly Long: 'MMMM d, yyyy';
        readonly ShortMonth: 'MMM d, yyyy';
      }>
    >;
    timeFormat: z.ZodOptional<
      z.ZodEnum<{
        readonly Unspecified: 'unspecified';
        readonly TwelveHour: '12-hour';
        readonly TwentyFourHour: '24-hour';
      }>
    >;
    weekStartDay: z.ZodOptional<
      z.ZodEnum<{
        readonly Unspecified: 'unspecified';
        readonly LocaleDefault: 'locale_default';
        readonly Sunday: 'sunday';
        readonly Monday: 'monday';
        readonly Tuesday: 'tuesday';
        readonly Wednesday: 'wednesday';
        readonly Thursday: 'thursday';
        readonly Friday: 'friday';
        readonly Saturday: 'saturday';
        readonly ISO8601: 'iso_8601';
      }>
    >;
    nameDisplayOrder: z.ZodOptional<
      z.ZodEnum<{
        readonly Unspecified: 'unspecified';
        readonly LocaleDefault: 'locale_default';
        readonly DisplayNameOnly: 'display_name_only';
        readonly UsernameOnly: 'username_only';
        readonly GivenFamily: 'given_family';
        readonly FamilyGiven: 'family_given';
        readonly FamilyCommaGiven: 'family_comma_given';
        readonly GivenMiddleFamily: 'given_middle_family';
        readonly GivenMiddleInitialFamily: 'given_middle_initial_family';
        readonly TitleGivenFamily: 'title_given_family';
        readonly GivenFamilySuffix: 'given_family_suffix';
        readonly TitleGivenFamilySuffix: 'title_given_family_suffix';
        readonly Custom: 'custom';
      }>
    >;
    measurementSystem: z.ZodOptional<
      z.ZodEnum<{
        readonly Unspecified: 'unspecified';
        readonly Imperial: 'imperial';
        readonly Metric: 'metric';
        readonly Scientific: 'scientific';
      }>
    >;
    contentMaturity: z.ZodOptional<
      z.ZodEnum<{
        readonly Unspecified: 'unspecified';
        readonly SafeOnly: 'safe_only';
        readonly FamilyFriendly: 'family_friendly';
        readonly Teen: 'teen';
        readonly Mature: 'mature';
        readonly Explicit: 'explicit';
        readonly Restricted: 'restricted';
      }>
    >;
  },
  z.core.$strip
>;
/**
 * Data allowed when updating user preferences.
 */
export declare const UpdateUserPreferencesEntitySchema: z.ZodObject<
  {
    locale: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    timezone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    timezoneUtc: z.ZodOptional<
      z.ZodNullable<
        z.ZodEnum<{
          readonly UtcMinus1200: 'UTC-12:00';
          readonly UtcMinus1100: 'UTC-11:00';
          readonly UtcMinus1000: 'UTC-10:00';
          readonly UtcMinus0930: 'UTC-09:30';
          readonly UtcMinus0900: 'UTC-09:00';
          readonly UtcMinus0800: 'UTC-08:00';
          readonly UtcMinus0700: 'UTC-07:00';
          readonly UtcMinus0600: 'UTC-06:00';
          readonly UtcMinus0500: 'UTC-05:00';
          readonly UtcMinus0400: 'UTC-04:00';
          readonly UtcMinus0330: 'UTC-03:30';
          readonly UtcMinus0300: 'UTC-03:00';
          readonly UtcMinus0230: 'UTC-02:30';
          readonly UtcMinus0200: 'UTC-02:00';
          readonly UtcMinus0100: 'UTC-01:00';
          readonly UtcPlus0000: 'UTC+00:00';
          readonly UtcPlus0100: 'UTC+01:00';
          readonly UtcPlus0200: 'UTC+02:00';
          readonly UtcPlus0300: 'UTC+03:00';
          readonly UtcPlus0330: 'UTC+03:30';
          readonly UtcPlus0400: 'UTC+04:00';
          readonly UtcPlus0430: 'UTC+04:30';
          readonly UtcPlus0500: 'UTC+05:00';
          readonly UtcPlus0530: 'UTC+05:30';
          readonly UtcPlus0545: 'UTC+05:45';
          readonly UtcPlus0600: 'UTC+06:00';
          readonly UtcPlus0630: 'UTC+06:30';
          readonly UtcPlus0700: 'UTC+07:00';
          readonly UtcPlus0800: 'UTC+08:00';
          readonly UtcPlus0845: 'UTC+08:45';
          readonly UtcPlus0900: 'UTC+09:00';
          readonly UtcPlus0930: 'UTC+09:30';
          readonly UtcPlus1000: 'UTC+10:00';
          readonly UtcPlus1030: 'UTC+10:30';
          readonly UtcPlus1100: 'UTC+11:00';
          readonly UtcPlus1200: 'UTC+12:00';
          readonly UtcPlus1245: 'UTC+12:45';
          readonly UtcPlus1300: 'UTC+13:00';
          readonly UtcPlus1345: 'UTC+13:45';
          readonly UtcPlus1400: 'UTC+14:00';
        }>
      >
    >;
    timezoneGreenwich: z.ZodOptional<
      z.ZodNullable<
        z.ZodEnum<{
          readonly GmtMinus1200: 'GMT-12:00';
          readonly GmtMinus1100: 'GMT-11:00';
          readonly GmtMinus1000: 'GMT-10:00';
          readonly GmtMinus0930: 'GMT-09:30';
          readonly GmtMinus0900: 'GMT-09:00';
          readonly GmtMinus0800: 'GMT-08:00';
          readonly GmtMinus0700: 'GMT-07:00';
          readonly GmtMinus0600: 'GMT-06:00';
          readonly GmtMinus0500: 'GMT-05:00';
          readonly GmtMinus0400: 'GMT-04:00';
          readonly GmtMinus0330: 'GMT-03:30';
          readonly GmtMinus0300: 'GMT-03:00';
          readonly GmtMinus0230: 'GMT-02:30';
          readonly GmtMinus0200: 'GMT-02:00';
          readonly GmtMinus0100: 'GMT-01:00';
          readonly GmtPlus0000: 'GMT+00:00';
          readonly GmtPlus0100: 'GMT+01:00';
          readonly GmtPlus0200: 'GMT+02:00';
          readonly GmtPlus0300: 'GMT+03:00';
          readonly GmtPlus0330: 'GMT+03:30';
          readonly GmtPlus0400: 'GMT+04:00';
          readonly GmtPlus0430: 'GMT+04:30';
          readonly GmtPlus0500: 'GMT+05:00';
          readonly GmtPlus0530: 'GMT+05:30';
          readonly GmtPlus0545: 'GMT+05:45';
          readonly GmtPlus0600: 'GMT+06:00';
          readonly GmtPlus0630: 'GMT+06:30';
          readonly GmtPlus0700: 'GMT+07:00';
          readonly GmtPlus0800: 'GMT+08:00';
          readonly GmtPlus0845: 'GMT+08:45';
          readonly GmtPlus0900: 'GMT+09:00';
          readonly GmtPlus0930: 'GMT+09:30';
          readonly GmtPlus1000: 'GMT+10:00';
          readonly GmtPlus1030: 'GMT+10:30';
          readonly GmtPlus1100: 'GMT+11:00';
          readonly GmtPlus1200: 'GMT+12:00';
          readonly GmtPlus1245: 'GMT+12:45';
          readonly GmtPlus1300: 'GMT+13:00';
          readonly GmtPlus1345: 'GMT+13:45';
          readonly GmtPlus1400: 'GMT+14:00';
        }>
      >
    >;
    dateFormat: z.ZodOptional<
      z.ZodEnum<{
        readonly Unspecified: 'unspecified';
        readonly Iso8601: 'yyyy-MM-dd';
        readonly Us: 'MM/dd/yyyy';
        readonly European: 'dd/MM/yyyy';
        readonly Long: 'MMMM d, yyyy';
        readonly ShortMonth: 'MMM d, yyyy';
      }>
    >;
    timeFormat: z.ZodOptional<
      z.ZodEnum<{
        readonly Unspecified: 'unspecified';
        readonly TwelveHour: '12-hour';
        readonly TwentyFourHour: '24-hour';
      }>
    >;
    weekStartDay: z.ZodOptional<
      z.ZodEnum<{
        readonly Unspecified: 'unspecified';
        readonly LocaleDefault: 'locale_default';
        readonly Sunday: 'sunday';
        readonly Monday: 'monday';
        readonly Tuesday: 'tuesday';
        readonly Wednesday: 'wednesday';
        readonly Thursday: 'thursday';
        readonly Friday: 'friday';
        readonly Saturday: 'saturday';
        readonly ISO8601: 'iso_8601';
      }>
    >;
    nameDisplayOrder: z.ZodOptional<
      z.ZodEnum<{
        readonly Unspecified: 'unspecified';
        readonly LocaleDefault: 'locale_default';
        readonly DisplayNameOnly: 'display_name_only';
        readonly UsernameOnly: 'username_only';
        readonly GivenFamily: 'given_family';
        readonly FamilyGiven: 'family_given';
        readonly FamilyCommaGiven: 'family_comma_given';
        readonly GivenMiddleFamily: 'given_middle_family';
        readonly GivenMiddleInitialFamily: 'given_middle_initial_family';
        readonly TitleGivenFamily: 'title_given_family';
        readonly GivenFamilySuffix: 'given_family_suffix';
        readonly TitleGivenFamilySuffix: 'title_given_family_suffix';
        readonly Custom: 'custom';
      }>
    >;
    measurementSystem: z.ZodOptional<
      z.ZodEnum<{
        readonly Unspecified: 'unspecified';
        readonly Imperial: 'imperial';
        readonly Metric: 'metric';
        readonly Scientific: 'scientific';
      }>
    >;
    contentMaturity: z.ZodOptional<
      z.ZodEnum<{
        readonly Unspecified: 'unspecified';
        readonly SafeOnly: 'safe_only';
        readonly FamilyFriendly: 'family_friendly';
        readonly Teen: 'teen';
        readonly Mature: 'mature';
        readonly Explicit: 'explicit';
        readonly Restricted: 'restricted';
      }>
    >;
  },
  z.core.$strip
>;
/**
 * API-safe user preferences response.
 */
export declare const UserPreferencesContractSchema: z.ZodObject<
  {
    id: z.ZodUUID;
    userId: z.ZodUUID;
    locale: z.ZodNullable<z.ZodString>;
    timezone: z.ZodNullable<z.ZodString>;
    timezoneUtc: z.ZodNullable<
      z.ZodEnum<{
        readonly UtcMinus1200: 'UTC-12:00';
        readonly UtcMinus1100: 'UTC-11:00';
        readonly UtcMinus1000: 'UTC-10:00';
        readonly UtcMinus0930: 'UTC-09:30';
        readonly UtcMinus0900: 'UTC-09:00';
        readonly UtcMinus0800: 'UTC-08:00';
        readonly UtcMinus0700: 'UTC-07:00';
        readonly UtcMinus0600: 'UTC-06:00';
        readonly UtcMinus0500: 'UTC-05:00';
        readonly UtcMinus0400: 'UTC-04:00';
        readonly UtcMinus0330: 'UTC-03:30';
        readonly UtcMinus0300: 'UTC-03:00';
        readonly UtcMinus0230: 'UTC-02:30';
        readonly UtcMinus0200: 'UTC-02:00';
        readonly UtcMinus0100: 'UTC-01:00';
        readonly UtcPlus0000: 'UTC+00:00';
        readonly UtcPlus0100: 'UTC+01:00';
        readonly UtcPlus0200: 'UTC+02:00';
        readonly UtcPlus0300: 'UTC+03:00';
        readonly UtcPlus0330: 'UTC+03:30';
        readonly UtcPlus0400: 'UTC+04:00';
        readonly UtcPlus0430: 'UTC+04:30';
        readonly UtcPlus0500: 'UTC+05:00';
        readonly UtcPlus0530: 'UTC+05:30';
        readonly UtcPlus0545: 'UTC+05:45';
        readonly UtcPlus0600: 'UTC+06:00';
        readonly UtcPlus0630: 'UTC+06:30';
        readonly UtcPlus0700: 'UTC+07:00';
        readonly UtcPlus0800: 'UTC+08:00';
        readonly UtcPlus0845: 'UTC+08:45';
        readonly UtcPlus0900: 'UTC+09:00';
        readonly UtcPlus0930: 'UTC+09:30';
        readonly UtcPlus1000: 'UTC+10:00';
        readonly UtcPlus1030: 'UTC+10:30';
        readonly UtcPlus1100: 'UTC+11:00';
        readonly UtcPlus1200: 'UTC+12:00';
        readonly UtcPlus1245: 'UTC+12:45';
        readonly UtcPlus1300: 'UTC+13:00';
        readonly UtcPlus1345: 'UTC+13:45';
        readonly UtcPlus1400: 'UTC+14:00';
      }>
    >;
    timezoneGreenwich: z.ZodNullable<
      z.ZodEnum<{
        readonly GmtMinus1200: 'GMT-12:00';
        readonly GmtMinus1100: 'GMT-11:00';
        readonly GmtMinus1000: 'GMT-10:00';
        readonly GmtMinus0930: 'GMT-09:30';
        readonly GmtMinus0900: 'GMT-09:00';
        readonly GmtMinus0800: 'GMT-08:00';
        readonly GmtMinus0700: 'GMT-07:00';
        readonly GmtMinus0600: 'GMT-06:00';
        readonly GmtMinus0500: 'GMT-05:00';
        readonly GmtMinus0400: 'GMT-04:00';
        readonly GmtMinus0330: 'GMT-03:30';
        readonly GmtMinus0300: 'GMT-03:00';
        readonly GmtMinus0230: 'GMT-02:30';
        readonly GmtMinus0200: 'GMT-02:00';
        readonly GmtMinus0100: 'GMT-01:00';
        readonly GmtPlus0000: 'GMT+00:00';
        readonly GmtPlus0100: 'GMT+01:00';
        readonly GmtPlus0200: 'GMT+02:00';
        readonly GmtPlus0300: 'GMT+03:00';
        readonly GmtPlus0330: 'GMT+03:30';
        readonly GmtPlus0400: 'GMT+04:00';
        readonly GmtPlus0430: 'GMT+04:30';
        readonly GmtPlus0500: 'GMT+05:00';
        readonly GmtPlus0530: 'GMT+05:30';
        readonly GmtPlus0545: 'GMT+05:45';
        readonly GmtPlus0600: 'GMT+06:00';
        readonly GmtPlus0630: 'GMT+06:30';
        readonly GmtPlus0700: 'GMT+07:00';
        readonly GmtPlus0800: 'GMT+08:00';
        readonly GmtPlus0845: 'GMT+08:45';
        readonly GmtPlus0900: 'GMT+09:00';
        readonly GmtPlus0930: 'GMT+09:30';
        readonly GmtPlus1000: 'GMT+10:00';
        readonly GmtPlus1030: 'GMT+10:30';
        readonly GmtPlus1100: 'GMT+11:00';
        readonly GmtPlus1200: 'GMT+12:00';
        readonly GmtPlus1245: 'GMT+12:45';
        readonly GmtPlus1300: 'GMT+13:00';
        readonly GmtPlus1345: 'GMT+13:45';
        readonly GmtPlus1400: 'GMT+14:00';
      }>
    >;
    dateFormat: z.ZodEnum<{
      readonly Unspecified: 'unspecified';
      readonly Iso8601: 'yyyy-MM-dd';
      readonly Us: 'MM/dd/yyyy';
      readonly European: 'dd/MM/yyyy';
      readonly Long: 'MMMM d, yyyy';
      readonly ShortMonth: 'MMM d, yyyy';
    }>;
    timeFormat: z.ZodEnum<{
      readonly Unspecified: 'unspecified';
      readonly TwelveHour: '12-hour';
      readonly TwentyFourHour: '24-hour';
    }>;
    weekStartDay: z.ZodEnum<{
      readonly Unspecified: 'unspecified';
      readonly LocaleDefault: 'locale_default';
      readonly Sunday: 'sunday';
      readonly Monday: 'monday';
      readonly Tuesday: 'tuesday';
      readonly Wednesday: 'wednesday';
      readonly Thursday: 'thursday';
      readonly Friday: 'friday';
      readonly Saturday: 'saturday';
      readonly ISO8601: 'iso_8601';
    }>;
    nameDisplayOrder: z.ZodEnum<{
      readonly Unspecified: 'unspecified';
      readonly LocaleDefault: 'locale_default';
      readonly DisplayNameOnly: 'display_name_only';
      readonly UsernameOnly: 'username_only';
      readonly GivenFamily: 'given_family';
      readonly FamilyGiven: 'family_given';
      readonly FamilyCommaGiven: 'family_comma_given';
      readonly GivenMiddleFamily: 'given_middle_family';
      readonly GivenMiddleInitialFamily: 'given_middle_initial_family';
      readonly TitleGivenFamily: 'title_given_family';
      readonly GivenFamilySuffix: 'given_family_suffix';
      readonly TitleGivenFamilySuffix: 'title_given_family_suffix';
      readonly Custom: 'custom';
    }>;
    measurementSystem: z.ZodEnum<{
      readonly Unspecified: 'unspecified';
      readonly Imperial: 'imperial';
      readonly Metric: 'metric';
      readonly Scientific: 'scientific';
    }>;
    contentMaturity: z.ZodEnum<{
      readonly Unspecified: 'unspecified';
      readonly SafeOnly: 'safe_only';
      readonly FamilyFriendly: 'family_friendly';
      readonly Teen: 'teen';
      readonly Mature: 'mature';
      readonly Explicit: 'explicit';
      readonly Restricted: 'restricted';
    }>;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
  },
  z.core.$strip
>;
export type UserPreferencesEntitySchemaType = z.infer<
  typeof UserPreferencesEntitySchema
>;
export type CreateUserPreferencesEntityInput = z.infer<
  typeof CreateUserPreferencesEntitySchema
>;
export type UpdateUserPreferencesEntityInput = z.infer<
  typeof UpdateUserPreferencesEntitySchema
>;
export type UserPreferencesContractSchemaType = z.infer<
  typeof UserPreferencesContractSchema
>;
