// libs/db/src/mappers/user/user-profile.mapper.ts

import {
  ProfileStatus,
  UserProfileEntity,
  type UserProfileContract,
} from '@aerealith-ai/core';

import type {
  NewUserProfileRow,
  UserProfileRow,
} from '../../schema';

/**
 * Converts a database user-profile row into the core entity.
 */
export function toUserProfileEntity(
  row: UserProfileRow,
): UserProfileEntity {
  return new UserProfileEntity({
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

    status: toProfileStatus(row.status),
    fieldVisibility: row.fieldVisibility,

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
  });
}

/**
 * Converts a core user-profile entity into an owner-safe profile contract.
 *
 * Public profile responses must still apply field visibility rules in the
 * service layer before returning data.
 */
export function toUserProfileContract(
  entity: UserProfileEntity,
): UserProfileContract {
  return {
    id: entity.id,
    userId: entity.userId,

    handle: entity.handle,

    displayName: entity.displayName,
    givenName: entity.givenName,
    middleName: entity.middleName,
    familyName: entity.familyName,
    pronouns: entity.pronouns,

    avatarUrl: entity.avatarUrl,
    bannerUrl: entity.bannerUrl,
    bio: entity.bio,

    status: entity.status,
    fieldVisibility: entity.fieldVisibility,

    locationLabel: entity.locationLabel,
    country: entity.country,

    gender: entity.gender,
    sex: entity.sex,
    sexuality: entity.sexuality,
    romanticOrientation: entity.romanticOrientation,
    sexAttitude: entity.sexAttitude,

    languages: entity.languages,
    websiteUrl: entity.websiteUrl,
    links: entity.links,

    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

/**
 * Converts a core user-profile entity into a database insert row.
 *
 * The database generates the record ID and timestamps.
 */
export function toNewUserProfileRow(
  entity: UserProfileEntity,
): NewUserProfileRow {
  return {
    userId: entity.userId,

    handle: entity.handle,

    displayName: entity.displayName,
    givenName: entity.givenName,
    middleName: entity.middleName,
    familyName: entity.familyName,
    pronouns: entity.pronouns,

    avatarUrl: entity.avatarUrl,
    bannerUrl: entity.bannerUrl,
    bio: entity.bio,

    status: entity.status,
    fieldVisibility: entity.fieldVisibility,

    locationLabel: entity.locationLabel,
    country: entity.country,

    gender: entity.gender,
    sex: entity.sex,
    sexuality: entity.sexuality,
    romanticOrientation: entity.romanticOrientation,
    sexAttitude: entity.sexAttitude,

    languages: entity.languages,
    websiteUrl: entity.websiteUrl,
    links: entity.links,
  };
}

function toProfileStatus(
  value: string,
): (typeof ProfileStatus)[keyof typeof ProfileStatus] {
  const values = Object.values(ProfileStatus);

  if (values.includes(value as never)) {
    return value as (typeof ProfileStatus)[keyof typeof ProfileStatus];
  }

  throw new Error(`Invalid user profile status in database: ${value}`);
}
