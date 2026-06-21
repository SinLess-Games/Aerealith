// libs/db/src/repositories/user/drizzle-user-preferences.repository.ts

import { and, eq, isNull } from 'drizzle-orm';

import type {
  ContentMaturity,
  DateFormat,
  MeasurementSystem,
  NameDisplayOrder,
  TimeFormat,
  TimezoneGreenwich,
  TimezoneUtc,
  UserPreferencesContract,
  WeekStartDay,
} from '@aerealith-ai/core';

import type { DatabaseClient } from '../../client';
import {
  type NewUserPreferencesRow,
  type UserPreferencesRow,
  userPreferencesTable,
} from '../../schema';

export type CreateUserPreferencesInput = {
  userId: string;
  locale?: string | null;
  timezone?: string | null;
  timezoneUtc?: TimezoneUtc | null;
  timezoneGreenwich?: TimezoneGreenwich | null;
  dateFormat?: DateFormat;
  timeFormat?: TimeFormat;
  weekStartDay?: WeekStartDay;
  nameDisplayOrder?: NameDisplayOrder;
  measurementSystem?: MeasurementSystem;
  contentMaturity?: ContentMaturity;
};

export type UpdateUserPreferencesInput = Omit<
  Partial<CreateUserPreferencesInput>,
  'userId'
>;

/**
 * Drizzle persistence for a user's locale and display preferences.
 *
 * Each user has one active preferences record.
 */
export class DrizzleUserPreferencesRepository {
  constructor(private readonly database: DatabaseClient) {}

  async findByUserId(
    userId: string,
  ): Promise<UserPreferencesContract | null> {
    const [row] = await this.database
      .select()
      .from(userPreferencesTable)
      .where(
        and(
          eq(userPreferencesTable.userId, userId),
          isNull(userPreferencesTable.deletedAt),
        ),
      )
      .limit(1);

    return row ? toUserPreferencesContract(row) : null;
  }

  async create(
    input: CreateUserPreferencesInput,
  ): Promise<UserPreferencesContract> {
    const [row] = await this.database
      .insert(userPreferencesTable)
      .values(toNewUserPreferencesRow(input))
      .returning();

    if (!row) {
      throw new Error('Failed to create user preferences.');
    }

    return toUserPreferencesContract(row);
  }

  async update(
    userId: string,
    input: UpdateUserPreferencesInput,
  ): Promise<UserPreferencesContract | null> {
    const values = createUpdateValues(input);

    if (Object.keys(values).length === 0) {
      return this.findByUserId(userId);
    }

    const [row] = await this.database
      .update(userPreferencesTable)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userPreferencesTable.userId, userId),
          isNull(userPreferencesTable.deletedAt),
        ),
      )
      .returning();

    return row ? toUserPreferencesContract(row) : null;
  }

  async softDeleteByUserId(userId: string): Promise<boolean> {
    const now = new Date();

    const [row] = await this.database
      .update(userPreferencesTable)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(userPreferencesTable.userId, userId),
          isNull(userPreferencesTable.deletedAt),
        ),
      )
      .returning({
        id: userPreferencesTable.id,
      });

    return row !== undefined;
  }
}

function toNewUserPreferencesRow(
  input: CreateUserPreferencesInput,
): NewUserPreferencesRow {
  return {
    userId: input.userId.trim(),
    locale: normalizeOptionalString(input.locale),
    timezone: normalizeOptionalString(input.timezone),
    timezoneUtc: input.timezoneUtc ?? null,
    timezoneGreenwich: input.timezoneGreenwich ?? null,
    dateFormat: input.dateFormat,
    timeFormat: input.timeFormat,
    weekStartDay: input.weekStartDay,
    nameDisplayOrder: input.nameDisplayOrder,
    measurementSystem: input.measurementSystem,
    contentMaturity: input.contentMaturity,
  };
}

function createUpdateValues(
  input: UpdateUserPreferencesInput,
): Partial<NewUserPreferencesRow> {
  const values: Partial<NewUserPreferencesRow> = {};

  if (input.locale !== undefined) {
    values.locale = normalizeOptionalString(input.locale);
  }

  if (input.timezone !== undefined) {
    values.timezone = normalizeOptionalString(input.timezone);
  }

  if (input.timezoneUtc !== undefined) {
    values.timezoneUtc = input.timezoneUtc;
  }

  if (input.timezoneGreenwich !== undefined) {
    values.timezoneGreenwich = input.timezoneGreenwich;
  }

  if (input.dateFormat !== undefined) {
    values.dateFormat = input.dateFormat;
  }

  if (input.timeFormat !== undefined) {
    values.timeFormat = input.timeFormat;
  }

  if (input.weekStartDay !== undefined) {
    values.weekStartDay = input.weekStartDay;
  }

  if (input.nameDisplayOrder !== undefined) {
    values.nameDisplayOrder = input.nameDisplayOrder;
  }

  if (input.measurementSystem !== undefined) {
    values.measurementSystem = input.measurementSystem;
  }

  if (input.contentMaturity !== undefined) {
    values.contentMaturity = input.contentMaturity;
  }

  return values;
}

function toUserPreferencesContract(
  row: UserPreferencesRow,
): UserPreferencesContract {
  return {
    id: row.id,
    userId: row.userId,

    locale: row.locale,
    timezone: row.timezone,
    timezoneUtc: row.timezoneUtc,
    timezoneGreenwich: row.timezoneGreenwich,

    dateFormat: row.dateFormat,
    timeFormat: row.timeFormat,
    weekStartDay: row.weekStartDay,
    nameDisplayOrder: row.nameDisplayOrder,
    measurementSystem: row.measurementSystem,
    contentMaturity: row.contentMaturity,

    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function normalizeOptionalString(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim();

  return normalized || null;
}
