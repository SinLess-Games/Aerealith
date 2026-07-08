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
export declare class UserPreferencesEntity extends BaseEntity {
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
  constructor(input: UserPreferencesInput);
  update(input: UserPreferencesUpdate): void;
  private normalizeOptionalString;
}
