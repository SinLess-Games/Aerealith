'use strict';
// libs/core/src/entities/user/preferences.entity.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.UserPreferencesEntity = void 0;
const enumns_1 = require('../../enumns');
const base_entity_1 = require('../base.entity');
/**
 * Stores user-specific display, locale, and content preferences.
 *
 * Keep account settings, security options, and notification settings
 * in separate entities.
 */
class UserPreferencesEntity extends base_entity_1.BaseEntity {
  userId;
  /**
   * IETF BCP 47 locale code.
   *
   * Example: en-US
   */
  locale;
  /**
   * IANA timezone name.
   *
   * Example: America/Boise
   */
  timezone;
  timezoneUtc;
  timezoneGreenwich;
  dateFormat;
  timeFormat;
  weekStartDay;
  nameDisplayOrder;
  measurementSystem;
  contentMaturity;
  constructor(input) {
    super(input);
    this.userId = input.userId.trim();
    this.locale = this.normalizeOptionalString(input.locale);
    this.timezone = this.normalizeOptionalString(input.timezone);
    this.timezoneUtc = input.timezoneUtc ?? null;
    this.timezoneGreenwich = input.timezoneGreenwich ?? null;
    this.dateFormat = input.dateFormat ?? enumns_1.DateFormat.Iso8601;
    this.timeFormat = input.timeFormat ?? enumns_1.TimeFormat.TwelveHour;
    this.weekStartDay =
      input.weekStartDay ?? enumns_1.WeekStartDay.LocaleDefault;
    this.nameDisplayOrder =
      input.nameDisplayOrder ?? enumns_1.NameDisplayOrder.LocaleDefault;
    this.measurementSystem =
      input.measurementSystem ?? enumns_1.MeasurementSystem.Metric;
    this.contentMaturity =
      input.contentMaturity ?? enumns_1.ContentMaturity.FamilyFriendly;
  }
  update(input) {
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
  normalizeOptionalString(value) {
    const normalized = value?.trim();
    return normalized || null;
  }
}
exports.UserPreferencesEntity = UserPreferencesEntity;
//# sourceMappingURL=preferences.entity.js.map
