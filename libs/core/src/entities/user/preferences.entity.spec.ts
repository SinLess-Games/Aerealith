// libs/core/src/entities/user/preferences.entity.spec.ts

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ContentMaturity,
  DateFormat,
  MeasurementSystem,
  NameDisplayOrder,
  TimeFormat,
  TimezoneGreenwich,
  TimezoneUtc,
  WeekStartDay,
} from '../../enumns';
import { UserPreferencesEntity } from './preferences.entity';

function getFirstEnumValue<T extends Record<string, string>>(
  enumObject: T,
): T[keyof T] {
  const value = Object.values(enumObject)[0];

  if (value === undefined) {
    throw new Error('Expected enum to contain at least one value.');
  }

  return value as T[keyof T];
}

describe('UserPreferencesEntity', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates preferences with safe defaults', () => {
    const preferences = new UserPreferencesEntity({
      userId: 'user-id',
    });

    expect(preferences.id).toBeTypeOf('string');
    expect(preferences.userId).toBe('user-id');

    expect(preferences.locale).toBeNull();
    expect(preferences.timezone).toBeNull();
    expect(preferences.timezoneUtc).toBeNull();
    expect(preferences.timezoneGreenwich).toBeNull();

    expect(preferences.dateFormat).toBe(DateFormat.Iso8601);
    expect(preferences.timeFormat).toBe(TimeFormat.TwelveHour);
    expect(preferences.weekStartDay).toBe(WeekStartDay.LocaleDefault);
    expect(preferences.nameDisplayOrder).toBe(
      NameDisplayOrder.LocaleDefault,
    );
    expect(preferences.measurementSystem).toBe(
      MeasurementSystem.Metric,
    );
    expect(preferences.contentMaturity).toBe(
      ContentMaturity.FamilyFriendly,
    );
  });

  it('preserves supplied base entity values', () => {
    const createdAt = new Date('2026-06-20T12:00:00.000Z');
    const updatedAt = new Date('2026-06-20T12:30:00.000Z');

    const preferences = new UserPreferencesEntity({
      id: 'preferences-id',
      userId: 'user-id',
      createdAt,
      updatedAt,
      deletedAt: null,
    });

    expect(preferences.id).toBe('preferences-id');
    expect(preferences.createdAt).toBe(createdAt);
    expect(preferences.updatedAt).toBe(updatedAt);
    expect(preferences.deletedAt).toBeNull();
  });

  it('normalizes locale and timezone values', () => {
    const preferences = new UserPreferencesEntity({
      userId: 'user-id',
      locale: '  en-US  ',
      timezone: '  America/Boise  ',
    });

    expect(preferences.locale).toBe('en-US');
    expect(preferences.timezone).toBe('America/Boise');
  });

  it('converts empty locale and timezone values to null', () => {
    const preferences = new UserPreferencesEntity({
      userId: 'user-id',
      locale: '   ',
      timezone: '   ',
    });

    expect(preferences.locale).toBeNull();
    expect(preferences.timezone).toBeNull();
  });

  it('accepts explicit timezone offset preferences', () => {
    const timezoneUtc = getFirstEnumValue(TimezoneUtc);
    const timezoneGreenwich = getFirstEnumValue(TimezoneGreenwich);

    const preferences = new UserPreferencesEntity({
      userId: 'user-id',
      timezoneUtc,
      timezoneGreenwich,
    });

    expect(preferences.timezoneUtc).toBe(timezoneUtc);
    expect(preferences.timezoneGreenwich).toBe(timezoneGreenwich);
  });

  it('uses supplied display and content preferences', () => {
    const preferences = new UserPreferencesEntity({
      userId: 'user-id',
      dateFormat: DateFormat.Us,
      timeFormat: TimeFormat.TwelveHour,
      weekStartDay: WeekStartDay.LocaleDefault,
      nameDisplayOrder: NameDisplayOrder.LocaleDefault,
      measurementSystem: MeasurementSystem.Metric,
      contentMaturity: ContentMaturity.FamilyFriendly,
    });

    expect(preferences.dateFormat).toBe(DateFormat.Us);
    expect(preferences.timeFormat).toBe(TimeFormat.TwelveHour);
    expect(preferences.weekStartDay).toBe(WeekStartDay.LocaleDefault);
    expect(preferences.nameDisplayOrder).toBe(
      NameDisplayOrder.LocaleDefault,
    );
    expect(preferences.measurementSystem).toBe(
      MeasurementSystem.Metric,
    );
    expect(preferences.contentMaturity).toBe(
      ContentMaturity.FamilyFriendly,
    );
  });

  it('updates only supplied values', () => {
    const preferences = new UserPreferencesEntity({
      userId: 'user-id',
      locale: 'en-US',
      timezone: 'America/Boise',
      dateFormat: DateFormat.Iso8601,
      measurementSystem: MeasurementSystem.Metric,
    });

    preferences.update({
      locale: '  fr-CA  ',
      dateFormat: DateFormat.Us,
    });

    expect(preferences.locale).toBe('fr-CA');
    expect(preferences.dateFormat).toBe(DateFormat.Us);

    expect(preferences.timezone).toBe('America/Boise');
    expect(preferences.measurementSystem).toBe(
      MeasurementSystem.Metric,
    );
  });

  it('updates timezone offset preferences', () => {
    const timezoneUtc = getFirstEnumValue(TimezoneUtc);
    const timezoneGreenwich = getFirstEnumValue(TimezoneGreenwich);

    const preferences = new UserPreferencesEntity({
      userId: 'user-id',
    });

    preferences.update({
      timezoneUtc,
      timezoneGreenwich,
    });

    expect(preferences.timezoneUtc).toBe(timezoneUtc);
    expect(preferences.timezoneGreenwich).toBe(timezoneGreenwich);
  });

  it('clears optional locale and timezone values when null is provided', () => {
    const preferences = new UserPreferencesEntity({
      userId: 'user-id',
      locale: 'en-US',
      timezone: 'America/Boise',
      timezoneUtc: getFirstEnumValue(TimezoneUtc),
      timezoneGreenwich: getFirstEnumValue(TimezoneGreenwich),
    });

    preferences.update({
      locale: null,
      timezone: null,
      timezoneUtc: null,
      timezoneGreenwich: null,
    });

    expect(preferences.locale).toBeNull();
    expect(preferences.timezone).toBeNull();
    expect(preferences.timezoneUtc).toBeNull();
    expect(preferences.timezoneGreenwich).toBeNull();
  });

  it('updates updatedAt when preferences change', () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'));

    const preferences = new UserPreferencesEntity({
      userId: 'user-id',
    });

    vi.setSystemTime(new Date('2026-06-20T12:10:00.000Z'));

    preferences.update({
      locale: 'en-US',
    });

    expect(preferences.updatedAt).toEqual(
      new Date('2026-06-20T12:10:00.000Z'),
    );
  });

  it('keeps soft-delete behavior from BaseEntity', () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'));

    const preferences = new UserPreferencesEntity({
      userId: 'user-id',
    });

    vi.setSystemTime(new Date('2026-06-20T12:20:00.000Z'));

    preferences.softDelete();

    expect(preferences.isDeleted).toBe(true);
    expect(preferences.deletedAt).toEqual(
      new Date('2026-06-20T12:20:00.000Z'),
    );
    expect(preferences.updatedAt).toEqual(
      new Date('2026-06-20T12:20:00.000Z'),
    );
  });
});
