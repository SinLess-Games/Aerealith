// libs/db/src/mappers/user/user-profile.mapper.spec.ts

import { UserProfileEntity } from '@aerealith-ai/core';
import { describe, expect, it } from 'vitest';

import type { UserProfileRow } from '../../schema';
import {
  toNewUserProfileRow,
  toUserProfileContract,
  toUserProfileEntity,
} from './user-profile.mapper';

const defaultFieldVisibility = {
  avatarUrl: 'public',
  bannerUrl: 'public',
  bio: 'public',
  country: 'public',
  createdAt: 'public',
  displayName: 'public',
  handle: 'public',
  languages: 'public',
  links: 'public',
  locationLabel: 'public',
  pronouns: 'public',
  websiteUrl: 'public',
} as UserProfileRow['fieldVisibility'];

function createUserProfileRow(
  overrides: Partial<UserProfileRow> = {},
): UserProfileRow {
  return {
    id: 'profile_123',
    userId: 'user_123',

    handle: 'sinless777',

    displayName: 'Sinless',
    givenName: 'Andy',
    middleName: null,
    familyName: 'Pierce',
    pronouns: null,

    avatarUrl: 'https://cdn.aerealith.com/avatars/sinless777.png',
    bannerUrl: 'https://cdn.aerealith.com/banners/sinless777.png',
    bio: 'Building Aerealith.',

    status: 'pending_setup' as UserProfileRow['status'],
    fieldVisibility: {} as UserProfileRow['fieldVisibility'],

    locationLabel: 'Twin Falls, Idaho',
    country: 'US' as UserProfileRow['country'],

    gender: null,
    sex: null,
    sexuality: null,
    romanticOrientation: null,
    sexAttitude: null,

    languages: [] as UserProfileRow['languages'],
    websiteUrl: 'https://aerealith.com',
    links: [] as UserProfileRow['links'],

    createdAt: new Date('2026-06-20T00:00:00.000Z'),
    updatedAt: new Date('2026-06-20T00:00:00.000Z'),
    deletedAt: null,

    ...overrides,
  };
}

describe('user profile mapper', () => {
  it('converts a database row into a user profile entity', () => {
    const row = createUserProfileRow();

    const entity = toUserProfileEntity(row);

    expect(entity).toBeInstanceOf(UserProfileEntity);

    expect(entity).toEqual(
      expect.objectContaining({
        id: row.id,
        userId: row.userId,

        handle: row.handle,

        displayName: row.displayName,
        givenName: row.givenName,
        middleName: row.middleName,
        familyName: row.familyName,
        pronouns: row.pronouns,

        avatarUrl: row.avatarUrl,
        bannerUrl: row.bannerUrl,
        bio: row.bio,

        status: row.status,
        fieldVisibility: defaultFieldVisibility,

        locationLabel: row.locationLabel,
        country: row.country,

        gender: row.gender,
        sex: row.sex,
        sexuality: row.sexuality,
        romanticOrientation: row.romanticOrientation,
        sexAttitude: row.sexAttitude,

        languages: row.languages,
        websiteUrl: row.websiteUrl,
        links: row.links,

        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt,
      }),
    );
  });

  it('applies default visibility rules when the stored visibility map is empty', () => {
    const entity = toUserProfileEntity(
      createUserProfileRow({
        fieldVisibility: {} as UserProfileRow['fieldVisibility'],
      }),
    );

    expect(entity.fieldVisibility).toEqual(defaultFieldVisibility);
  });

  it('preserves nullable profile fields when converting to an entity', () => {
    const row = createUserProfileRow({
      middleName: null,
      pronouns: null,
      avatarUrl: null,
      bannerUrl: null,
      bio: null,
      locationLabel: null,
      country: null,
      gender: null,
      sex: null,
      sexuality: null,
      romanticOrientation: null,
      sexAttitude: null,
      websiteUrl: null,
    });

    const entity = toUserProfileEntity(row);

    expect(entity.middleName).toBeNull();
    expect(entity.pronouns).toBeNull();
    expect(entity.avatarUrl).toBeNull();
    expect(entity.bannerUrl).toBeNull();
    expect(entity.bio).toBeNull();
    expect(entity.locationLabel).toBeNull();
    expect(entity.country).toBeNull();
    expect(entity.websiteUrl).toBeNull();
  });

  it('preserves a soft-deletion timestamp when converting to an entity', () => {
    const deletedAt = new Date('2026-06-21T00:00:00.000Z');

    const entity = toUserProfileEntity(
      createUserProfileRow({
        deletedAt,
      }),
    );

    expect(entity.deletedAt).toBe(deletedAt);
  });

  it('converts a user profile entity into a database insert row', () => {
    const row = createUserProfileRow();
    const entity = toUserProfileEntity(row);

    const newRow = toNewUserProfileRow(entity);

    expect(newRow).toEqual({
      userId: row.userId,

      handle: row.handle,

      displayName: row.displayName,
      givenName: row.givenName,
      middleName: row.middleName,
      familyName: row.familyName,
      pronouns: row.pronouns,

      avatarUrl: row.avatarUrl,
      bannerUrl: row.bannerUrl,
      bio: row.bio,

      status: row.status,
      fieldVisibility: defaultFieldVisibility,

      locationLabel: row.locationLabel,
      country: row.country,

      gender: row.gender,
      sex: row.sex,
      sexuality: row.sexuality,
      romanticOrientation: row.romanticOrientation,
      sexAttitude: row.sexAttitude,

      languages: row.languages,
      websiteUrl: row.websiteUrl,
      links: row.links,
    });
  });

  it('converts an entity into a user profile contract', () => {
    const row = createUserProfileRow();
    const entity = toUserProfileEntity(row);

    const contract = toUserProfileContract(entity);

    expect(contract).toEqual(
      expect.objectContaining({
        id: row.id,
        userId: row.userId,

        handle: row.handle,

        displayName: row.displayName,
        givenName: row.givenName,
        middleName: row.middleName,
        familyName: row.familyName,
        pronouns: row.pronouns,

        avatarUrl: row.avatarUrl,
        bannerUrl: row.bannerUrl,
        bio: row.bio,

        status: row.status,
        fieldVisibility: defaultFieldVisibility,

        locationLabel: row.locationLabel,
        country: row.country,

        gender: row.gender,
        sex: row.sex,
        sexuality: row.sexuality,
        romanticOrientation: row.romanticOrientation,
        sexAttitude: row.sexAttitude,

        languages: row.languages,
        websiteUrl: row.websiteUrl,
        links: row.links,

        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }),
    );
  });

  it('does not expose the soft-deletion timestamp in the contract', () => {
    const entity = toUserProfileEntity(
      createUserProfileRow({
        deletedAt: new Date('2026-06-21T00:00:00.000Z'),
      }),
    );

    const contract = toUserProfileContract(entity);

    expect(contract).not.toHaveProperty('deletedAt');
  });

  it('preserves profile status through every mapper boundary', () => {
    const row = createUserProfileRow({
      status: 'active' as UserProfileRow['status'],
    });

    const entity = toUserProfileEntity(row);
    const contract = toUserProfileContract(entity);

    expect(entity.status).toBe('active');
    expect(contract.status).toBe('active');
  });

  it('preserves profile links and language preferences through every mapper boundary', () => {
    const languages: UserProfileRow['languages'] = [];

    const links = [
      {
        label: 'Website',
        url: 'https://aerealith.com',
      },
      {
        label: 'GitHub',
        url: 'https://github.com/Sinless777',
      },
    ] as UserProfileRow['links'];

    const row = createUserProfileRow({
      languages,
      links,
    });

    const entity = toUserProfileEntity(row);
    const contract = toUserProfileContract(entity);

    expect(entity.languages).toEqual(languages);
    expect(entity.links).toEqual(links);

    expect(contract.languages).toEqual(languages);
    expect(contract.links).toEqual(links);
  });
});
