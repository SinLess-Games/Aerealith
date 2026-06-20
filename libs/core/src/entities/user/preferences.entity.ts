// libs/core/src/entities/user/preferences.entity.ts

import {
  ContentMaturity,
  DateFormat,
  MeasurementSystem,
  NameDisplayOrder,
  TimeFormat,
  WeekStartDay,
} from '../../enumns';
import type {
  ContentMaturity as ContentMaturityValue,
  DateFormat as DateFormatValue,
  MeasurementSystem as MeasurementSystemValue,
  NameDisplayOrder as NameDisplayOrderValue,
  TimeFormat as TimeFormatValue,
  TimezoneGreenwich as TimezoneGreenwichValue,
  TimezoneUtc as TimezoneUtcValue,
  WeekStartDay as WeekStartDayValue,
} from '../../enumns';
import { BaseEntity, type BaseEntityInput } from '../base.entity';

export type UserPreferencesInput = BaseEntityInput & {
  userId: string;

  locale?: string | null;
  timezone?: string | null;
  timezoneUtc?: TimezoneUtcValue | null;
  timezoneGreenwich?: TimezoneGreenwichValue | null;

  dateFormat?: DateFormatValue;
  timeFormat?: TimeFormatValue;
  weekStartDay?: WeekStartDayValue;
  nameDisplayOrder?: NameDisplayOrderValue;
  measurementSystem?: MeasurementSystemValue;
  contentMaturity?: ContentMaturityValue;
};

export type UserPreferencesUpdate = Omit<
  Partial<UserPreferencesInput>,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

/**
 * Stores user-specific display, locale, and content preferences.
 *
 * Keep account settings, security options, and notification settings
 * in separate entities.
 */
export class UserPreferencesEntity extends BaseEntity {
  userId: string;

  /**
   * IETF BCP 47 locale code.
   *
   * Example: en-US
   */
  locale: string | null;

  /**
   * IANA timezone name.
   *
   * Example: America/Boise
   */
  timezone: string | null;

  timezoneUtc: TimezoneUtcValue | null;

  timezoneGreenwich: TimezoneGreenwichValue | null;

  dateFormat: DateFormatValue;

  timeFormat: TimeFormatValue;

  weekStartDay: WeekStartDayValue;

  nameDisplayOrder: NameDisplayOrderValue;

  measurementSystem: MeasurementSystemValue;

  contentMaturity: ContentMaturityValue;

  constructor(input: UserPreferencesInput) {
    super(input);

    this.userId = input.userId.trim();

    this.locale = this.normalizeOptionalString(input.locale);
    this.timezone = this.normalizeOptionalString(input.timezone);
    this.timezoneUtc = input.timezoneUtc ?? null;
    this.timezoneGreenwich = input.timezoneGreenwich ?? null;

    this.dateFormat = input.dateFormat ?? DateFormat.Iso8601;
    this.timeFormat = input.timeFormat ?? TimeFormat.TwelveHour;
    this.weekStartDay = input.weekStartDay ?? WeekStartDay.LocaleDefault;
    this.nameDisplayOrder =
      input.nameDisplayOrder ?? NameDisplayOrder.LocaleDefault;
    this.measurementSystem =
      input.measurementSystem ?? MeasurementSystem.Metric;
    this.contentMaturity =
      input.contentMaturity ?? ContentMaturity.FamilyFriendly;
  }

  update(input: UserPreferencesUpdate): void {
    if (input.locale !== undefined) {
      this.locale = this.normalizeOptionalString(input.locale);
    }

    if (input.timezone !== undefined) {
      this.timezone = this.normalizeOptionalString(input.timezone);
    }

    if (input.timezoneUtc !== undefined) {
      this.timezoneUtc = input.timezoneUtc;
    }

    if (input.timezoneGreenwich !== undefined) {
      this.timezoneGreenwich = input.timezoneGreenwich;
    }

    if (input.dateFormat !== undefined) {
      this.dateFormat = input.dateFormat;
    }

    if (input.timeFormat !== undefined) {
      this.timeFormat = input.timeFormat;
    }

    if (input.weekStartDay !== undefined) {
      this.weekStartDay = input.weekStartDay;
    }

    if (input.nameDisplayOrder !== undefined) {
      this.nameDisplayOrder = input.nameDisplayOrder;
    }

    if (input.measurementSystem !== undefined) {
      this.measurementSystem = input.measurementSystem;
    }

    if (input.contentMaturity !== undefined) {
      this.contentMaturity = input.contentMaturity;
    }

    this.touch();
  }

  private normalizeOptionalString(value?: string | null): string | null {
    const normalized = value?.trim();

    return normalized || null;
  }
}