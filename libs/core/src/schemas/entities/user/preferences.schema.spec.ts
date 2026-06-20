// libs/core/src/schemas/entities/user/preferences.schema.spec.ts

import { describe, expect, it } from 'vitest';

import {
  ContentMaturity,
  DateFormat,
  MeasurementSystem,
  NameDisplayOrder,
  TimeFormat,
  TimezoneGreenwich,
  TimezoneUtc,
  WeekStartDay,
} from '../../../enumns';
import {
  ContentMaturitySchema,
  CreateUserPreferencesEntitySchema,
  DateFormatSchema,
  MeasurementSystemSchema,
  NameDisplayOrderSchema,
  TimeFormatSchema,
  TimezoneGreenwichSchema,
  TimezoneUtcSchema,
  UpdateUserPreferencesEntitySchema,
  UserLocaleSchema,
  UserPreferencesContractSchema,
  UserPreferencesEntitySchema,
  UserPreferencesIdSchema,
  UserTimezoneSchema,
  WeekStartDaySchema,
} from './preferences.schema';

const preferencesId = '550e8400-e29b-41d4-a716-446655440000';
const userId = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

function getFirstEnumValue<T extends Record<string, string>>(
  enumObject: T,
): T[keyof T] {
  const value = Object.values(enumObject)[0];

  if (value === undefined) {
    throw new Error('Expected enum to contain at least one value.');
  }

  return value as T[keyof T];
}

describe('UserPreferencesIdSchema', () => {
  it('accepts a valid UUID', () => {
    const result = UserPreferencesIdSchema.safeParse(preferencesId);

    expect(result.success).toBe(true);
  });

  it('rejects an invalid UUID', () => {
    const result = UserPreferencesIdSchema.safeParse('not-a-uuid');

    expect(result.success).toBe(false);
  });
});

describe('UserLocaleSchema', () => {
  it('trims a valid locale', () => {
    const result = UserLocaleSchema.safeParse('  en-US  ');

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toBe('en-US');
    }
  });

  it('rejects a locale shorter than two characters', () => {
    const result = UserLocaleSchema.safeParse('e');

    expect(result.success).toBe(false);
  });

  it('rejects a locale longer than one hundred characters', () => {
    const result = UserLocaleSchema.safeParse('a'.repeat(101));

    expect(result.success).toBe(false);
  });
});

describe('UserTimezoneSchema', () => {
  it('trims a valid IANA timezone', () => {
    const result = UserTimezoneSchema.safeParse('  America/Boise  ');

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toBe('America/Boise');
    }
  });

  it('rejects an empty timezone', () => {
    const result = UserTimezoneSchema.safeParse('   ');

    expect(result.success).toBe(false);
  });

  it('rejects a timezone longer than one hundred characters', () => {
    const result = UserTimezoneSchema.safeParse('a'.repeat(101));

    expect(result.success).toBe(false);
  });
});

describe('preference enum schemas', () => {
  it('accepts every configured content maturity value', () => {
    for (const value of Object.values(ContentMaturity)) {
      expect(ContentMaturitySchema.safeParse(value).success).toBe(true);
    }
  });

  it('accepts every configured date format value', () => {
    for (const value of Object.values(DateFormat)) {
      expect(DateFormatSchema.safeParse(value).success).toBe(true);
    }
  });

  it('accepts every configured measurement system value', () => {
    for (const value of Object.values(MeasurementSystem)) {
      expect(MeasurementSystemSchema.safeParse(value).success).toBe(true);
    }
  });

  it('accepts every configured name display order value', () => {
    for (const value of Object.values(NameDisplayOrder)) {
      expect(NameDisplayOrderSchema.safeParse(value).success).toBe(true);
    }
  });

  it('accepts every configured time format value', () => {
    for (const value of Object.values(TimeFormat)) {
      expect(TimeFormatSchema.safeParse(value).success).toBe(true);
    }
  });

  it('accepts every configured UTC timezone offset value', () => {
    for (const value of Object.values(TimezoneUtc)) {
      expect(TimezoneUtcSchema.safeParse(value).success).toBe(true);
    }
  });

  it('accepts every configured Greenwich timezone offset value', () => {
    for (const value of Object.values(TimezoneGreenwich)) {
      expect(TimezoneGreenwichSchema.safeParse(value).success).toBe(true);
    }
  });

  it('accepts every configured week-start value', () => {
    for (const value of Object.values(WeekStartDay)) {
      expect(WeekStartDaySchema.safeParse(value).success).toBe(true);
    }
  });

  it('rejects unsupported preference enum values', () => {
    expect(ContentMaturitySchema.safeParse('invalid').success).toBe(false);
    expect(DateFormatSchema.safeParse('invalid').success).toBe(false);
    expect(MeasurementSystemSchema.safeParse('invalid').success).toBe(
      false,
    );
    expect(NameDisplayOrderSchema.safeParse('invalid').success).toBe(
      false,
    );
    expect(TimeFormatSchema.safeParse('invalid').success).toBe(false);
    expect(TimezoneUtcSchema.safeParse('invalid').success).toBe(false);
    expect(TimezoneGreenwichSchema.safeParse('invalid').success).toBe(
      false,
    );
    expect(WeekStartDaySchema.safeParse('invalid').success).toBe(false);
  });
});

describe('CreateUserPreferencesEntitySchema', () => {
  it('accepts a user ID with no optional preferences', () => {
    const result = CreateUserPreferencesEntitySchema.safeParse({
      userId,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        userId,
      });
    }
  });

  it('accepts and normalizes complete preference input', () => {
    const timezoneUtc = getFirstEnumValue(TimezoneUtc);
    const timezoneGreenwich = getFirstEnumValue(TimezoneGreenwich);

    const result = CreateUserPreferencesEntitySchema.safeParse({
      userId,
      locale: '  en-US  ',
      timezone: '  America/Boise  ',
      timezoneUtc,
      timezoneGreenwich,
      dateFormat: DateFormat.Iso8601,
      timeFormat: TimeFormat.TwelveHour,
      weekStartDay: WeekStartDay.LocaleDefault,
      nameDisplayOrder: NameDisplayOrder.LocaleDefault,
      measurementSystem: MeasurementSystem.Metric,
      contentMaturity: ContentMaturity.FamilyFriendly,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        userId,
        locale: 'en-US',
        timezone: 'America/Boise',
        timezoneUtc,
        timezoneGreenwich,
        dateFormat: DateFormat.Iso8601,
        timeFormat: TimeFormat.TwelveHour,
        weekStartDay: WeekStartDay.LocaleDefault,
        nameDisplayOrder: NameDisplayOrder.LocaleDefault,
        measurementSystem: MeasurementSystem.Metric,
        contentMaturity: ContentMaturity.FamilyFriendly,
      });
    }
  });

  it('accepts nullable optional values', () => {
    const result = CreateUserPreferencesEntitySchema.safeParse({
      userId,
      locale: null,
      timezone: null,
      timezoneUtc: null,
      timezoneGreenwich: null,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.locale).toBeNull();
      expect(result.data.timezone).toBeNull();
      expect(result.data.timezoneUtc).toBeNull();
      expect(result.data.timezoneGreenwich).toBeNull();
    }
  });

  it('rejects an invalid user ID', () => {
    const result = CreateUserPreferencesEntitySchema.safeParse({
      userId: 'not-a-uuid',
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid preference values', () => {
    const result = CreateUserPreferencesEntitySchema.safeParse({
      userId,
      dateFormat: 'invalid',
    });

    expect(result.success).toBe(false);
  });
});

describe('UpdateUserPreferencesEntitySchema', () => {
  it('accepts a partial preference update', () => {
    const result = UpdateUserPreferencesEntitySchema.safeParse({
      locale: '  fr-CA  ',
      timezone: '  America/Toronto  ',
      dateFormat: DateFormat.Iso8601,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        locale: 'fr-CA',
        timezone: 'America/Toronto',
        dateFormat: DateFormat.Iso8601,
      });
    }
  });

  it('accepts clearing nullable preference values', () => {
    const result = UpdateUserPreferencesEntitySchema.safeParse({
      locale: null,
      timezone: null,
      timezoneUtc: null,
      timezoneGreenwich: null,
    });

    expect(result.success).toBe(true);
  });

  it('accepts an empty update object', () => {
    const result = UpdateUserPreferencesEntitySchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('rejects an invalid locale', () => {
    const result = UpdateUserPreferencesEntitySchema.safeParse({
      locale: 'e',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid timezone offset', () => {
    const result = UpdateUserPreferencesEntitySchema.safeParse({
      timezoneUtc: 'UTC+999',
    });

    expect(result.success).toBe(false);
  });
});

describe('UserPreferencesEntitySchema', () => {
  it('accepts a complete internal user preferences entity', () => {
    const createdAt = new Date('2026-06-20T12:00:00.000Z');
    const updatedAt = new Date('2026-06-20T12:10:00.000Z');
    const timezoneUtc = getFirstEnumValue(TimezoneUtc);
    const timezoneGreenwich = getFirstEnumValue(TimezoneGreenwich);

    const result = UserPreferencesEntitySchema.safeParse({
      id: preferencesId,
      userId,
      locale: '  en-US  ',
      timezone: '  America/Boise  ',
      timezoneUtc,
      timezoneGreenwich,
      dateFormat: DateFormat.Iso8601,
      timeFormat: TimeFormat.TwelveHour,
      weekStartDay: WeekStartDay.LocaleDefault,
      nameDisplayOrder: NameDisplayOrder.LocaleDefault,
      measurementSystem: MeasurementSystem.Metric,
      contentMaturity: ContentMaturity.FamilyFriendly,
      createdAt,
      updatedAt,
      deletedAt: null,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.id).toBe(preferencesId);
      expect(result.data.userId).toBe(userId);
      expect(result.data.locale).toBe('en-US');
      expect(result.data.timezone).toBe('America/Boise');
      expect(result.data.timezoneUtc).toBe(timezoneUtc);
      expect(result.data.timezoneGreenwich).toBe(
        timezoneGreenwich,
      );
      expect(result.data.createdAt).toEqual(createdAt);
      expect(result.data.updatedAt).toEqual(updatedAt);
      expect(result.data.deletedAt).toBeNull();
    }
  });

  it('accepts nullable preference values', () => {
    const result = UserPreferencesEntitySchema.safeParse({
      id: preferencesId,
      userId,
      locale: null,
      timezone: null,
      timezoneUtc: null,
      timezoneGreenwich: null,
      dateFormat: DateFormat.Iso8601,
      timeFormat: TimeFormat.TwelveHour,
      weekStartDay: WeekStartDay.LocaleDefault,
      nameDisplayOrder: NameDisplayOrder.LocaleDefault,
      measurementSystem: MeasurementSystem.Metric,
      contentMaturity: ContentMaturity.FamilyFriendly,
      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: new Date('2026-06-20T12:10:00.000Z'),
      deletedAt: null,
    });

    expect(result.success).toBe(true);
  });

  it('accepts a soft-deleted preferences entity', () => {
    const deletedAt = new Date('2026-06-20T12:20:00.000Z');

    const result = UserPreferencesEntitySchema.safeParse({
      id: preferencesId,
      userId,
      locale: null,
      timezone: null,
      timezoneUtc: null,
      timezoneGreenwich: null,
      dateFormat: DateFormat.Iso8601,
      timeFormat: TimeFormat.TwelveHour,
      weekStartDay: WeekStartDay.LocaleDefault,
      nameDisplayOrder: NameDisplayOrder.LocaleDefault,
      measurementSystem: MeasurementSystem.Metric,
      contentMaturity: ContentMaturity.FamilyFriendly,
      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: deletedAt,
      deletedAt,
    });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid preference entity ID', () => {
    const result = UserPreferencesEntitySchema.safeParse({
      id: 'not-a-uuid',
      userId,
      locale: null,
      timezone: null,
      timezoneUtc: null,
      timezoneGreenwich: null,
      dateFormat: DateFormat.Iso8601,
      timeFormat: TimeFormat.TwelveHour,
      weekStartDay: WeekStartDay.LocaleDefault,
      nameDisplayOrder: NameDisplayOrder.LocaleDefault,
      measurementSystem: MeasurementSystem.Metric,
      contentMaturity: ContentMaturity.FamilyFriendly,
      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: new Date('2026-06-20T12:10:00.000Z'),
      deletedAt: null,
    });

    expect(result.success).toBe(false);
  });

  it('rejects an entity missing required preference fields', () => {
    const result = UserPreferencesEntitySchema.safeParse({
      id: preferencesId,
      userId,
      locale: null,
      timezone: null,
      timezoneUtc: null,
      timezoneGreenwich: null,
      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: new Date('2026-06-20T12:10:00.000Z'),
      deletedAt: null,
    });

    expect(result.success).toBe(false);
  });
});

describe('UserPreferencesContractSchema', () => {
  it('accepts a complete serialized preferences contract', () => {
    const timezoneUtc = getFirstEnumValue(TimezoneUtc);
    const timezoneGreenwich = getFirstEnumValue(TimezoneGreenwich);

    const result = UserPreferencesContractSchema.safeParse({
      id: preferencesId,
      userId,
      locale: '  en-US  ',
      timezone: '  America/Boise  ',
      timezoneUtc,
      timezoneGreenwich,
      dateFormat: DateFormat.Iso8601,
      timeFormat: TimeFormat.TwelveHour,
      weekStartDay: WeekStartDay.LocaleDefault,
      nameDisplayOrder: NameDisplayOrder.LocaleDefault,
      measurementSystem: MeasurementSystem.Metric,
      contentMaturity: ContentMaturity.FamilyFriendly,
      createdAt: '2026-06-20T12:00:00.000Z',
      updatedAt: '2026-06-20T12:10:00.000Z',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        id: preferencesId,
        userId,
        locale: 'en-US',
        timezone: 'America/Boise',
        timezoneUtc,
        timezoneGreenwich,
        dateFormat: DateFormat.Iso8601,
        timeFormat: TimeFormat.TwelveHour,
        weekStartDay: WeekStartDay.LocaleDefault,
        nameDisplayOrder: NameDisplayOrder.LocaleDefault,
        measurementSystem: MeasurementSystem.Metric,
        contentMaturity: ContentMaturity.FamilyFriendly,
        createdAt: '2026-06-20T12:00:00.000Z',
        updatedAt: '2026-06-20T12:10:00.000Z',
      });
    }
  });

  it('accepts a serialized contract with nullable preferences', () => {
    const result = UserPreferencesContractSchema.safeParse({
      id: preferencesId,
      userId,
      locale: null,
      timezone: null,
      timezoneUtc: null,
      timezoneGreenwich: null,
      dateFormat: DateFormat.Iso8601,
      timeFormat: TimeFormat.TwelveHour,
      weekStartDay: WeekStartDay.LocaleDefault,
      nameDisplayOrder: NameDisplayOrder.LocaleDefault,
      measurementSystem: MeasurementSystem.Metric,
      contentMaturity: ContentMaturity.FamilyFriendly,
      createdAt: '2026-06-20T12:00:00.000Z',
      updatedAt: '2026-06-20T12:10:00.000Z',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid serialized timestamp', () => {
    const result = UserPreferencesContractSchema.safeParse({
      id: preferencesId,
      userId,
      locale: null,
      timezone: null,
      timezoneUtc: null,
      timezoneGreenwich: null,
      dateFormat: DateFormat.Iso8601,
      timeFormat: TimeFormat.TwelveHour,
      weekStartDay: WeekStartDay.LocaleDefault,
      nameDisplayOrder: NameDisplayOrder.LocaleDefault,
      measurementSystem: MeasurementSystem.Metric,
      contentMaturity: ContentMaturity.FamilyFriendly,
      createdAt: 'not-a-timestamp',
      updatedAt: '2026-06-20T12:10:00.000Z',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid preference enum value', () => {
    const result = UserPreferencesContractSchema.safeParse({
      id: preferencesId,
      userId,
      locale: null,
      timezone: null,
      timezoneUtc: null,
      timezoneGreenwich: null,
      dateFormat: 'invalid',
      timeFormat: TimeFormat.TwelveHour,
      weekStartDay: WeekStartDay.LocaleDefault,
      nameDisplayOrder: NameDisplayOrder.LocaleDefault,
      measurementSystem: MeasurementSystem.Metric,
      contentMaturity: ContentMaturity.FamilyFriendly,
      createdAt: '2026-06-20T12:00:00.000Z',
      updatedAt: '2026-06-20T12:10:00.000Z',
    });

    expect(result.success).toBe(false);
  });
});
