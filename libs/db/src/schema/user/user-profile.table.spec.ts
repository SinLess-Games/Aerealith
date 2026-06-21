// libs/db/src/schema/user/user-profile.table.spec.ts

import { getTableColumns, getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { userProfilesTable } from './user-profile.table';

describe('userProfilesTable', () => {
  it('uses the correct database table name', () => {
    expect(getTableName(userProfilesTable)).toBe('user_profiles');
  });

  it('defines the required columns', () => {
    const columns = getTableColumns(userProfilesTable);

    expect(Object.keys(columns)).toEqual([
      'id',
      'userId',
      'handle',
      'displayName',
      'givenName',
      'middleName',
      'familyName',
      'pronouns',
      'avatarUrl',
      'bannerUrl',
      'bio',
      'status',
      'fieldVisibility',
      'locationLabel',
      'country',
      'gender',
      'sex',
      'sexuality',
      'romanticOrientation',
      'sexAttitude',
      'languages',
      'websiteUrl',
      'links',
      'createdAt',
      'updatedAt',
      'deletedAt',
    ]);
  });

  it('requires a user ID and profile handle', () => {
    const { userId, handle } = getTableColumns(userProfilesTable);

    expect(userId.notNull).toBe(true);
    expect(userId.hasDefault).toBe(false);

    expect(handle.notNull).toBe(true);
    expect(handle.hasDefault).toBe(false);
  });

  it('uses defaults for profile status and structured profile data', () => {
    const {
      status,
      fieldVisibility,
      languages,
      links,
    } = getTableColumns(userProfilesTable);

    expect(status.notNull).toBe(true);
    expect(status.hasDefault).toBe(true);

    expect(fieldVisibility.notNull).toBe(true);
    expect(fieldVisibility.hasDefault).toBe(true);

    expect(languages.notNull).toBe(true);
    expect(languages.hasDefault).toBe(true);

    expect(links.notNull).toBe(true);
    expect(links.hasDefault).toBe(true);
  });

  it('allows optional profile details', () => {
    const {
      displayName,
      givenName,
      middleName,
      familyName,
      pronouns,
      avatarUrl,
      bannerUrl,
      bio,
      locationLabel,
      country,
      gender,
      sex,
      sexuality,
      romanticOrientation,
      sexAttitude,
      websiteUrl,
    } = getTableColumns(userProfilesTable);

    expect(displayName.notNull).toBe(false);
    expect(givenName.notNull).toBe(false);
    expect(middleName.notNull).toBe(false);
    expect(familyName.notNull).toBe(false);
    expect(pronouns.notNull).toBe(false);
    expect(avatarUrl.notNull).toBe(false);
    expect(bannerUrl.notNull).toBe(false);
    expect(bio.notNull).toBe(false);
    expect(locationLabel.notNull).toBe(false);
    expect(country.notNull).toBe(false);
    expect(gender.notNull).toBe(false);
    expect(sex.notNull).toBe(false);
    expect(sexuality.notNull).toBe(false);
    expect(romanticOrientation.notNull).toBe(false);
    expect(sexAttitude.notNull).toBe(false);
    expect(websiteUrl.notNull).toBe(false);
  });

  it('generates IDs and record timestamps by default', () => {
    const { id, createdAt, updatedAt } = getTableColumns(userProfilesTable);

    expect(id.notNull).toBe(true);
    expect(id.hasDefault).toBe(true);

    expect(createdAt.notNull).toBe(true);
    expect(createdAt.hasDefault).toBe(true);

    expect(updatedAt.notNull).toBe(true);
    expect(updatedAt.hasDefault).toBe(true);
  });

  it('allows soft deletion', () => {
    const { deletedAt } = getTableColumns(userProfilesTable);

    expect(deletedAt.notNull).toBe(false);
  });
});
