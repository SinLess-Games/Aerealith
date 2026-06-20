// libs/core/src/entities/user/profile.entity.spec.ts

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ProfileFieldVisibility,
  ProfileStatus,
} from '../../enumns';
import { UserProfileEntity } from './profile.entity';

describe('UserProfileEntity', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a profile with safe defaults', () => {
    const profile = new UserProfileEntity({
      userId: 'user-id',
      handle: 'Andy_Pierce',
    });

    expect(profile.id).toBeTypeOf('string');
    expect(profile.userId).toBe('user-id');
    expect(profile.handle).toBe('andy_pierce');

    expect(profile.displayName).toBeNull();
    expect(profile.givenName).toBeNull();
    expect(profile.middleName).toBeNull();
    expect(profile.familyName).toBeNull();
    expect(profile.pronouns).toBeNull();

    expect(profile.avatarUrl).toBeNull();
    expect(profile.bannerUrl).toBeNull();
    expect(profile.bio).toBeNull();

    expect(profile.status).toBe(ProfileStatus.PendingSetup);
    expect(profile.locationLabel).toBeNull();
    expect(profile.country).toBeNull();

    expect(profile.languages).toEqual([]);
    expect(profile.websiteUrl).toBeNull();
    expect(profile.links).toEqual([]);
  });

  it('preserves supplied base entity values', () => {
    const createdAt = new Date('2026-06-20T12:00:00.000Z');
    const updatedAt = new Date('2026-06-20T12:30:00.000Z');

    const profile = new UserProfileEntity({
      id: 'profile-id',
      userId: 'user-id',
      handle: 'andy',
      createdAt,
      updatedAt,
      deletedAt: null,
    });

    expect(profile.id).toBe('profile-id');
    expect(profile.createdAt).toBe(createdAt);
    expect(profile.updatedAt).toBe(updatedAt);
    expect(profile.deletedAt).toBeNull();
  });

  it('normalizes the profile handle', () => {
    const profile = new UserProfileEntity({
      userId: 'user-id',
      handle: '  Andy_Pierce  ',
    });

    expect(profile.handle).toBe('andy_pierce');
  });

  it('normalizes optional strings and converts empty values to null', () => {
    const profile = new UserProfileEntity({
      userId: 'user-id',
      handle: 'andy',
      displayName: '  Andy Pierce  ',
      pronouns: '   ',
      bio: '  Building Aerealith.  ',
      locationLabel: '   ',
      websiteUrl: '  https://aerealith.com  ',
    });

    expect(profile.displayName).toBe('Andy Pierce');
    expect(profile.pronouns).toBeNull();
    expect(profile.bio).toBe('Building Aerealith.');
    expect(profile.locationLabel).toBeNull();
    expect(profile.websiteUrl).toBe('https://aerealith.com');
  });

  it('uses default field visibility values', () => {
    const profile = new UserProfileEntity({
      userId: 'user-id',
      handle: 'andy',
    });

    expect(profile.getFieldVisibility('handle')).toBe(
      ProfileFieldVisibility.Public,
    );
    expect(profile.getFieldVisibility('bio')).toBe(
      ProfileFieldVisibility.Public,
    );
    expect(profile.getFieldVisibility('gender')).toBe(
      ProfileFieldVisibility.Private,
    );
  });

  it('merges supplied field visibility overrides with defaults', () => {
    const profile = new UserProfileEntity({
      userId: 'user-id',
      handle: 'andy',
      fieldVisibility: {
        bio: ProfileFieldVisibility.Private,
      },
    });

    expect(profile.getFieldVisibility('bio')).toBe(
      ProfileFieldVisibility.Private,
    );
    expect(profile.getFieldVisibility('handle')).toBe(
      ProfileFieldVisibility.Public,
    );
  });

  it('updates a single field visibility override', () => {
    const profile = new UserProfileEntity({
      userId: 'user-id',
      handle: 'andy',
    });

    profile.setFieldVisibility(
      'bio',
      ProfileFieldVisibility.Private,
    );

    expect(profile.getFieldVisibility('bio')).toBe(
      ProfileFieldVisibility.Private,
    );
  });

  it('updates only supplied profile fields', () => {
    const profile = new UserProfileEntity({
      userId: 'user-id',
      handle: 'andy',
      displayName: 'Andy',
      bio: 'Original bio.',
      websiteUrl: 'https://aerealith.com',
    });

    profile.update({
      displayName: '  Andy Pierce  ',
      bio: '  Updated bio.  ',
    });

    expect(profile.displayName).toBe('Andy Pierce');
    expect(profile.bio).toBe('Updated bio.');

    expect(profile.handle).toBe('andy');
    expect(profile.websiteUrl).toBe('https://aerealith.com');
  });

  it('can clear optional profile fields with null', () => {
    const profile = new UserProfileEntity({
      userId: 'user-id',
      handle: 'andy',
      displayName: 'Andy',
      bio: 'Original bio.',
      websiteUrl: 'https://aerealith.com',
    });

    profile.update({
      displayName: null,
      bio: null,
      websiteUrl: null,
    });

    expect(profile.displayName).toBeNull();
    expect(profile.bio).toBeNull();
    expect(profile.websiteUrl).toBeNull();
  });

  it('replaces profile languages', () => {
    const profile = new UserProfileEntity({
      userId: 'user-id',
      handle: 'andy',
    });

    profile.setLanguages([
      {
        language: 'eng',
        isPrimary: true,
      },
    ]);

    expect(profile.languages).toEqual([
      {
        language: 'eng',
        isPrimary: true,
      },
    ]);
  });

  it('replaces and normalizes profile links', () => {
    const profile = new UserProfileEntity({
      userId: 'user-id',
      handle: 'andy',
    });

    profile.setLinks([
      {
        platform: 'github',
        url: '  https://github.com/sinless777  ',
        label: '  GitHub  ',
      },
    ]);

    expect(profile.links).toEqual([
      {
        platform: 'github',
        url: 'https://github.com/sinless777',
        label: 'GitHub',
      },
    ]);
  });

  it('updates updatedAt when profile data changes', () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'));

    const profile = new UserProfileEntity({
      userId: 'user-id',
      handle: 'andy',
    });

    vi.setSystemTime(new Date('2026-06-20T12:10:00.000Z'));

    profile.update({
      displayName: 'Andy Pierce',
    });

    expect(profile.updatedAt).toEqual(
      new Date('2026-06-20T12:10:00.000Z'),
    );
  });

  it('keeps soft-delete behavior from BaseEntity', () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'));

    const profile = new UserProfileEntity({
      userId: 'user-id',
      handle: 'andy',
    });

    vi.setSystemTime(new Date('2026-06-20T12:20:00.000Z'));

    profile.softDelete();

    expect(profile.isDeleted).toBe(true);
    expect(profile.deletedAt).toEqual(
      new Date('2026-06-20T12:20:00.000Z'),
    );
    expect(profile.updatedAt).toEqual(
      new Date('2026-06-20T12:20:00.000Z'),
    );
  });
});
