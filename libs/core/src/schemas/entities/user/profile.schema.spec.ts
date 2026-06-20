// libs/core/src/schemas/entities/user/profile.schema.spec.ts

import { describe, expect, it } from 'vitest';

import {
  Country,
  Gender,
  LanguageProficiency,
  Languages,
  ProfileFieldVisibility,
  ProfileLinkPlatform,
  ProfileStatus,
  RomanticOrientation,
  Sex,
  SexAttitude,
  Sexuality,
} from '../../../enumns';
import {
  CreateUserProfileEntitySchema,
  PublicUserProfileContractSchema,
  UpdateUserProfileEntitySchema,
  UserProfileBioSchema,
  UserProfileContractSchema,
  UserProfileEntitySchema,
  UserProfileFieldSchema,
  UserProfileFieldVisibilitySchema,
  UserProfileHandleSchema,
  UserProfileIdSchema,
  UserProfileLanguageSchema,
  UserProfileLinkSchema,
  UserProfileLocationSchema,
  UserProfileNameSchema,
  UserProfilePronounsSchema,
  UserProfileUrlSchema,
} from './profile.schema';

const profileId = '550e8400-e29b-41d4-a716-446655440000';
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

describe('UserProfileIdSchema', () => {
  it('accepts a valid UUID', () => {
    const result = UserProfileIdSchema.safeParse(profileId);

    expect(result.success).toBe(true);
  });

  it('rejects an invalid UUID', () => {
    const result = UserProfileIdSchema.safeParse('not-a-uuid');

    expect(result.success).toBe(false);
  });
});

describe('profile field schemas', () => {
  it('normalizes a valid profile handle', () => {
    const result = UserProfileHandleSchema.safeParse('  Andy_Pierce  ');

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toBe('andy_pierce');
    }
  });

  it('rejects a profile handle shorter than three characters', () => {
    const result = UserProfileHandleSchema.safeParse('ab');

    expect(result.success).toBe(false);
  });

  it('rejects a profile handle with unsupported characters', () => {
    const result = UserProfileHandleSchema.safeParse('andy pierce');

    expect(result.success).toBe(false);
  });

  it('trims a valid profile name', () => {
    const result = UserProfileNameSchema.safeParse('  Andy Pierce  ');

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toBe('Andy Pierce');
    }
  });

  it('rejects an empty profile name', () => {
    const result = UserProfileNameSchema.safeParse('   ');

    expect(result.success).toBe(false);
  });

  it('trims valid pronouns', () => {
    const result = UserProfilePronounsSchema.safeParse('  he/him  ');

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toBe('he/him');
    }
  });

  it('rejects empty pronouns', () => {
    const result = UserProfilePronounsSchema.safeParse('   ');

    expect(result.success).toBe(false);
  });

  it('trims a valid profile bio', () => {
    const result = UserProfileBioSchema.safeParse(
      '  Building Aerealith.  ',
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toBe('Building Aerealith.');
    }
  });

  it('accepts an empty profile bio', () => {
    const result = UserProfileBioSchema.safeParse('');

    expect(result.success).toBe(true);
  });

  it('rejects a profile bio longer than two thousand characters', () => {
    const result = UserProfileBioSchema.safeParse('a'.repeat(2_001));

    expect(result.success).toBe(false);
  });

  it('trims a valid profile location', () => {
    const result = UserProfileLocationSchema.safeParse(
      '  Twin Falls, Idaho  ',
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toBe('Twin Falls, Idaho');
    }
  });

  it('rejects an empty profile location', () => {
    const result = UserProfileLocationSchema.safeParse('   ');

    expect(result.success).toBe(false);
  });

  it('trims and accepts a valid profile URL', () => {
    const result = UserProfileUrlSchema.safeParse(
      '  https://aerealith.com  ',
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toBe('https://aerealith.com');
    }
  });

  it('rejects an invalid profile URL', () => {
    const result = UserProfileUrlSchema.safeParse('not-a-url');

    expect(result.success).toBe(false);
  });
});

describe('UserProfileLinkSchema', () => {
  const platform = getFirstEnumValue(ProfileLinkPlatform);

  it('accepts and normalizes a valid profile link', () => {
    const result = UserProfileLinkSchema.safeParse({
      platform,
      url: '  https://example.com/andy  ',
      label: '  My profile  ',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        platform,
        url: 'https://example.com/andy',
        label: 'My profile',
      });
    }
  });

  it('accepts a profile link without a label', () => {
    const result = UserProfileLinkSchema.safeParse({
      platform,
      url: 'https://example.com/andy',
    });

    expect(result.success).toBe(true);
  });

  it('accepts a null profile link label', () => {
    const result = UserProfileLinkSchema.safeParse({
      platform,
      url: 'https://example.com/andy',
      label: null,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.label).toBeNull();
    }
  });

  it('rejects an unsupported profile-link platform', () => {
    const result = UserProfileLinkSchema.safeParse({
      platform: 'not-a-real-platform',
      url: 'https://example.com/andy',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid profile-link URL', () => {
    const result = UserProfileLinkSchema.safeParse({
      platform,
      url: 'not-a-url',
    });

    expect(result.success).toBe(false);
  });
});

describe('UserProfileLanguageSchema', () => {
  const language = getFirstEnumValue(Languages);
  const proficiency = getFirstEnumValue(LanguageProficiency);

  it('accepts a valid profile language', () => {
    const result = UserProfileLanguageSchema.safeParse({
      language,
      proficiency,
      isPrimary: true,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        language,
        proficiency,
        isPrimary: true,
      });
    }
  });

  it('accepts a profile language with only the language value', () => {
    const result = UserProfileLanguageSchema.safeParse({
      language,
    });

    expect(result.success).toBe(true);
  });

  it('rejects an unsupported language', () => {
    const result = UserProfileLanguageSchema.safeParse({
      language: 'not-a-language',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an unsupported language proficiency', () => {
    const result = UserProfileLanguageSchema.safeParse({
      language,
      proficiency: 'not-a-proficiency',
    });

    expect(result.success).toBe(false);
  });
});

describe('profile visibility schemas', () => {
  it('accepts every profile field', () => {
    const profileFields = [
      'handle',
      'displayName',
      'givenName',
      'middleName',
      'familyName',
      'pronouns',
      'avatarUrl',
      'bannerUrl',
      'bio',
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
    ];

    for (const field of profileFields) {
      expect(UserProfileFieldSchema.safeParse(field).success).toBe(true);
    }
  });

  it('rejects an unsupported profile field', () => {
    const result = UserProfileFieldSchema.safeParse('passwordHash');

    expect(result.success).toBe(false);
  });

  it('accepts a partial per-field visibility object', () => {
    const result = UserProfileFieldVisibilitySchema.safeParse({
      handle: ProfileFieldVisibility.Public,
      gender: ProfileFieldVisibility.Private,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        handle: ProfileFieldVisibility.Public,
        gender: ProfileFieldVisibility.Private,
      });
    }
  });

  it('accepts an empty per-field visibility object', () => {
    const result = UserProfileFieldVisibilitySchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('rejects an unsupported profile visibility value', () => {
    const result = UserProfileFieldVisibilitySchema.safeParse({
      handle: 'not-a-visibility-value',
    });

    expect(result.success).toBe(false);
  });
});

describe('CreateUserProfileEntitySchema', () => {
  const country = getFirstEnumValue(Country);
  const gender = getFirstEnumValue(Gender);
  const sex = getFirstEnumValue(Sex);
  const sexuality = getFirstEnumValue(Sexuality);
  const romanticOrientation = getFirstEnumValue(RomanticOrientation);
  const sexAttitude = getFirstEnumValue(SexAttitude);
  const language = getFirstEnumValue(Languages);
  const proficiency = getFirstEnumValue(LanguageProficiency);
  const platform = getFirstEnumValue(ProfileLinkPlatform);

  it('accepts and normalizes complete profile creation input', () => {
    const result = CreateUserProfileEntitySchema.safeParse({
      userId,
      handle: '  Andy_Pierce  ',

      displayName: '  Andy Pierce  ',
      givenName: '  Andy  ',
      middleName: '  Andrew  ',
      familyName: '  Pierce  ',
      pronouns: '  he/him  ',

      avatarUrl: '  https://example.com/avatar.png  ',
      bannerUrl: '  https://example.com/banner.png  ',
      bio: '  Building Aerealith.  ',

      status: ProfileStatus.Active,
      fieldVisibility: {
        bio: ProfileFieldVisibility.Private,
      },

      locationLabel: '  Twin Falls, Idaho  ',
      country,

      gender,
      sex,
      sexuality,
      romanticOrientation,
      sexAttitude,

      languages: [
        {
          language,
          proficiency,
          isPrimary: true,
        },
      ],

      websiteUrl: '  https://aerealith.com  ',
      links: [
        {
          platform,
          url: '  https://example.com/andy  ',
          label: '  Example profile  ',
        },
      ],
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        userId,
        handle: 'andy_pierce',

        displayName: 'Andy Pierce',
        givenName: 'Andy',
        middleName: 'Andrew',
        familyName: 'Pierce',
        pronouns: 'he/him',

        avatarUrl: 'https://example.com/avatar.png',
        bannerUrl: 'https://example.com/banner.png',
        bio: 'Building Aerealith.',

        status: ProfileStatus.Active,
        fieldVisibility: {
          bio: ProfileFieldVisibility.Private,
        },

        locationLabel: 'Twin Falls, Idaho',
        country,

        gender,
        sex,
        sexuality,
        romanticOrientation,
        sexAttitude,

        languages: [
          {
            language,
            proficiency,
            isPrimary: true,
          },
        ],

        websiteUrl: 'https://aerealith.com',
        links: [
          {
            platform,
            url: 'https://example.com/andy',
            label: 'Example profile',
          },
        ],
      });
    }
  });

  it('accepts the minimum profile creation payload', () => {
    const result = CreateUserProfileEntitySchema.safeParse({
      userId,
      handle: 'andy',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        userId,
        handle: 'andy',
      });
    }
  });

  it('accepts nullable optional profile values', () => {
    const result = CreateUserProfileEntitySchema.safeParse({
      userId,
      handle: 'andy',

      displayName: null,
      givenName: null,
      middleName: null,
      familyName: null,
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

    expect(result.success).toBe(true);
  });

  it('rejects an invalid user ID', () => {
    const result = CreateUserProfileEntitySchema.safeParse({
      userId: 'not-a-uuid',
      handle: 'andy',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid profile handle', () => {
    const result = CreateUserProfileEntitySchema.safeParse({
      userId,
      handle: 'and!',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an unsupported profile status', () => {
    const result = CreateUserProfileEntitySchema.safeParse({
      userId,
      handle: 'andy',
      status: 'not-a-profile-status',
    });

    expect(result.success).toBe(false);
  });
});

describe('UpdateUserProfileEntitySchema', () => {
  it('accepts a partial profile update', () => {
    const result = UpdateUserProfileEntitySchema.safeParse({
      displayName: '  Andy Pierce  ',
      bio: '  Updated bio.  ',
      locationLabel: '  Twin Falls, Idaho  ',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        displayName: 'Andy Pierce',
        bio: 'Updated bio.',
        locationLabel: 'Twin Falls, Idaho',
      });
    }
  });

  it('accepts clearing nullable profile fields', () => {
    const result = UpdateUserProfileEntitySchema.safeParse({
      displayName: null,
      bio: null,
      websiteUrl: null,
    });

    expect(result.success).toBe(true);
  });

  it('accepts an empty profile update', () => {
    const result = UpdateUserProfileEntitySchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('rejects an invalid profile URL update', () => {
    const result = UpdateUserProfileEntitySchema.safeParse({
      avatarUrl: 'not-a-url',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid profile-link update', () => {
    const result = UpdateUserProfileEntitySchema.safeParse({
      links: [
        {
          platform: 'not-a-real-platform',
          url: 'https://example.com/andy',
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});

describe('UserProfileEntitySchema', () => {
  const country = getFirstEnumValue(Country);
  const gender = getFirstEnumValue(Gender);
  const sex = getFirstEnumValue(Sex);
  const sexuality = getFirstEnumValue(Sexuality);
  const romanticOrientation = getFirstEnumValue(RomanticOrientation);
  const sexAttitude = getFirstEnumValue(SexAttitude);
  const language = getFirstEnumValue(Languages);
  const proficiency = getFirstEnumValue(LanguageProficiency);
  const platform = getFirstEnumValue(ProfileLinkPlatform);

  it('accepts a complete internal profile entity', () => {
    const createdAt = new Date('2026-06-20T12:00:00.000Z');
    const updatedAt = new Date('2026-06-20T12:10:00.000Z');

    const result = UserProfileEntitySchema.safeParse({
      id: profileId,
      userId,

      handle: '  Andy_Pierce  ',

      displayName: '  Andy Pierce  ',
      givenName: '  Andy  ',
      middleName: null,
      familyName: '  Pierce  ',
      pronouns: '  he/him  ',

      avatarUrl: '  https://example.com/avatar.png  ',
      bannerUrl: null,
      bio: '  Building Aerealith.  ',

      status: ProfileStatus.Active,
      fieldVisibility: {
        bio: ProfileFieldVisibility.Private,
      },

      locationLabel: '  Twin Falls, Idaho  ',
      country,

      gender,
      sex,
      sexuality,
      romanticOrientation,
      sexAttitude,

      languages: [
        {
          language,
          proficiency,
          isPrimary: true,
        },
      ],

      websiteUrl: '  https://aerealith.com  ',
      links: [
        {
          platform,
          url: '  https://example.com/andy  ',
          label: '  Example profile  ',
        },
      ],

      createdAt,
      updatedAt,
      deletedAt: null,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.id).toBe(profileId);
      expect(result.data.userId).toBe(userId);

      expect(result.data.handle).toBe('andy_pierce');
      expect(result.data.displayName).toBe('Andy Pierce');
      expect(result.data.givenName).toBe('Andy');
      expect(result.data.middleName).toBeNull();
      expect(result.data.familyName).toBe('Pierce');
      expect(result.data.pronouns).toBe('he/him');

      expect(result.data.avatarUrl).toBe(
        'https://example.com/avatar.png',
      );
      expect(result.data.bannerUrl).toBeNull();
      expect(result.data.bio).toBe('Building Aerealith.');

      expect(result.data.locationLabel).toBe('Twin Falls, Idaho');
      expect(result.data.country).toBe(country);

      expect(result.data.websiteUrl).toBe('https://aerealith.com');
      expect(result.data.createdAt).toEqual(createdAt);
      expect(result.data.updatedAt).toEqual(updatedAt);
      expect(result.data.deletedAt).toBeNull();
    }
  });

  it('accepts nullable optional profile fields', () => {
    const result = UserProfileEntitySchema.safeParse({
      id: profileId,
      userId,

      handle: 'andy',

      displayName: null,
      givenName: null,
      middleName: null,
      familyName: null,
      pronouns: null,

      avatarUrl: null,
      bannerUrl: null,
      bio: null,

      status: ProfileStatus.PendingSetup,
      fieldVisibility: {},

      locationLabel: null,
      country: null,

      gender: null,
      sex: null,
      sexuality: null,
      romanticOrientation: null,
      sexAttitude: null,

      languages: [],

      websiteUrl: null,
      links: [],

      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: new Date('2026-06-20T12:10:00.000Z'),
      deletedAt: null,
    });

    expect(result.success).toBe(true);
  });

  it('accepts a soft-deleted profile entity', () => {
    const deletedAt = new Date('2026-06-20T12:20:00.000Z');

    const result = UserProfileEntitySchema.safeParse({
      id: profileId,
      userId,

      handle: 'andy',

      displayName: null,
      givenName: null,
      middleName: null,
      familyName: null,
      pronouns: null,

      avatarUrl: null,
      bannerUrl: null,
      bio: null,

      status: ProfileStatus.Archived,
      fieldVisibility: {},

      locationLabel: null,
      country: null,

      gender: null,
      sex: null,
      sexuality: null,
      romanticOrientation: null,
      sexAttitude: null,

      languages: [],

      websiteUrl: null,
      links: [],

      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: deletedAt,
      deletedAt,
    });

    expect(result.success).toBe(true);
  });

  it('rejects an entity with an invalid profile ID', () => {
    const result = UserProfileEntitySchema.safeParse({
      id: 'not-a-uuid',
      userId,

      handle: 'andy',

      displayName: null,
      givenName: null,
      middleName: null,
      familyName: null,
      pronouns: null,

      avatarUrl: null,
      bannerUrl: null,
      bio: null,

      status: ProfileStatus.PendingSetup,
      fieldVisibility: {},

      locationLabel: null,
      country: null,

      gender: null,
      sex: null,
      sexuality: null,
      romanticOrientation: null,
      sexAttitude: null,

      languages: [],

      websiteUrl: null,
      links: [],

      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: new Date('2026-06-20T12:10:00.000Z'),
      deletedAt: null,
    });

    expect(result.success).toBe(false);
  });

  it('rejects an entity missing required profile fields', () => {
    const result = UserProfileEntitySchema.safeParse({
      id: profileId,
      userId,
      handle: 'andy',
      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: new Date('2026-06-20T12:10:00.000Z'),
      deletedAt: null,
    });

    expect(result.success).toBe(false);
  });
});

describe('PublicUserProfileContractSchema', () => {
  const country = getFirstEnumValue(Country);
  const language = getFirstEnumValue(Languages);
  const platform = getFirstEnumValue(ProfileLinkPlatform);

  it('accepts a valid public profile contract', () => {
    const result = PublicUserProfileContractSchema.safeParse({
      userId,
      handle: '  Andy_Pierce  ',

      displayName: '  Andy Pierce  ',
      pronouns: '  he/him  ',

      avatarUrl: '  https://example.com/avatar.png  ',
      bannerUrl: null,
      bio: '  Building Aerealith.  ',

      locationLabel: '  Twin Falls, Idaho  ',
      country,

      languages: [
        {
          language,
          isPrimary: true,
        },
      ],

      websiteUrl: '  https://aerealith.com  ',
      links: [
        {
          platform,
          url: '  https://example.com/andy  ',
        },
      ],

      createdAt: '2026-06-20T12:00:00.000Z',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        userId,
        handle: 'andy_pierce',

        displayName: 'Andy Pierce',
        pronouns: 'he/him',

        avatarUrl: 'https://example.com/avatar.png',
        bannerUrl: null,
        bio: 'Building Aerealith.',

        locationLabel: 'Twin Falls, Idaho',
        country,

        languages: [
          {
            language,
            isPrimary: true,
          },
        ],

        websiteUrl: 'https://aerealith.com',
        links: [
          {
            platform,
            url: 'https://example.com/andy',
          },
        ],

        createdAt: '2026-06-20T12:00:00.000Z',
      });
    }
  });

  it('rejects a public profile contract with invalid serialized dates', () => {
    const result = PublicUserProfileContractSchema.safeParse({
      userId,
      handle: 'andy',

      displayName: null,
      pronouns: null,

      avatarUrl: null,
      bannerUrl: null,
      bio: null,

      locationLabel: null,
      country: null,

      languages: [],

      websiteUrl: null,
      links: [],

      createdAt: 'not-a-timestamp',
    });

    expect(result.success).toBe(false);
  });
});

describe('UserProfileContractSchema', () => {
  const country = getFirstEnumValue(Country);
  const gender = getFirstEnumValue(Gender);
  const sex = getFirstEnumValue(Sex);
  const sexuality = getFirstEnumValue(Sexuality);
  const romanticOrientation = getFirstEnumValue(RomanticOrientation);
  const sexAttitude = getFirstEnumValue(SexAttitude);

  it('accepts a complete owner or admin profile contract', () => {
    const result = UserProfileContractSchema.safeParse({
      id: profileId,
      userId,

      handle: '  Andy_Pierce  ',

      displayName: '  Andy Pierce  ',
      pronouns: '  he/him  ',

      avatarUrl: null,
      bannerUrl: null,
      bio: '  Building Aerealith.  ',

      locationLabel: '  Twin Falls, Idaho  ',
      country,

      languages: [],

      websiteUrl: null,
      links: [],

      createdAt: '2026-06-20T12:00:00.000Z',

      givenName: '  Andy  ',
      middleName: null,
      familyName: '  Pierce  ',

      status: ProfileStatus.Active,
      fieldVisibility: {
        bio: ProfileFieldVisibility.Private,
      },

      gender,
      sex,
      sexuality,
      romanticOrientation,
      sexAttitude,

      updatedAt: '2026-06-20T12:10:00.000Z',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.handle).toBe('andy_pierce');
      expect(result.data.displayName).toBe('Andy Pierce');
      expect(result.data.givenName).toBe('Andy');
      expect(result.data.familyName).toBe('Pierce');
      expect(result.data.bio).toBe('Building Aerealith.');
      expect(result.data.locationLabel).toBe('Twin Falls, Idaho');
      expect(result.data.createdAt).toBe(
        '2026-06-20T12:00:00.000Z',
      );
      expect(result.data.updatedAt).toBe(
        '2026-06-20T12:10:00.000Z',
      );
    }
  });

  it('rejects an owner profile contract with an invalid status', () => {
    const result = UserProfileContractSchema.safeParse({
      id: profileId,
      userId,

      handle: 'andy',

      displayName: null,
      pronouns: null,

      avatarUrl: null,
      bannerUrl: null,
      bio: null,

      locationLabel: null,
      country: null,

      languages: [],

      websiteUrl: null,
      links: [],

      createdAt: '2026-06-20T12:00:00.000Z',

      givenName: null,
      middleName: null,
      familyName: null,

      status: 'not-a-profile-status',
      fieldVisibility: {},

      gender: null,
      sex: null,
      sexuality: null,
      romanticOrientation: null,
      sexAttitude: null,

      updatedAt: '2026-06-20T12:10:00.000Z',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an owner profile contract without its internal profile ID', () => {
    const result = UserProfileContractSchema.safeParse({
      userId,

      handle: 'andy',

      displayName: null,
      pronouns: null,

      avatarUrl: null,
      bannerUrl: null,
      bio: null,

      locationLabel: null,
      country: null,

      languages: [],

      websiteUrl: null,
      links: [],

      createdAt: '2026-06-20T12:00:00.000Z',

      givenName: null,
      middleName: null,
      familyName: null,

      status: ProfileStatus.PendingSetup,
      fieldVisibility: {},

      gender: null,
      sex: null,
      sexuality: null,
      romanticOrientation: null,
      sexAttitude: null,

      updatedAt: '2026-06-20T12:10:00.000Z',
    });

    expect(result.success).toBe(false);
  });
});
