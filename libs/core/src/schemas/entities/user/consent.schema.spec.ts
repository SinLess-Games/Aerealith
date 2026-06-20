// libs/core/src/schemas/entities/user/consent.schema.spec.ts

import { describe, expect, it } from 'vitest';

import { UserConsentType } from '../../../entities';
import {
  CreateUserConsentEntitySchema,
  UpdateUserConsentContractSchema,
  UpdateUserConsentEntitySchema,
  UserConsentContractSchema,
  UserConsentEntitySchema,
  UserConsentIdSchema,
  UserConsentTypeSchema,
  UserConsentVersionSchema,
} from './consent.schema';

const consentId = '550e8400-e29b-41d4-a716-446655440000';
const userId = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

describe('UserConsentIdSchema', () => {
  it('accepts a valid UUID', () => {
    const result = UserConsentIdSchema.safeParse(consentId);

    expect(result.success).toBe(true);
  });

  it('rejects an invalid UUID', () => {
    const result = UserConsentIdSchema.safeParse('not-a-uuid');

    expect(result.success).toBe(false);
  });
});

describe('UserConsentVersionSchema', () => {
  it('trims a valid consent version', () => {
    const result = UserConsentVersionSchema.safeParse('  2026-06-20  ');

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toBe('2026-06-20');
    }
  });

  it('rejects an empty consent version', () => {
    const result = UserConsentVersionSchema.safeParse('   ');

    expect(result.success).toBe(false);
  });

  it('rejects a consent version longer than one hundred characters', () => {
    const result = UserConsentVersionSchema.safeParse('a'.repeat(101));

    expect(result.success).toBe(false);
  });
});

describe('UserConsentTypeSchema', () => {
  it('accepts every supported consent type', () => {
    for (const consentType of Object.values(UserConsentType)) {
      const result = UserConsentTypeSchema.safeParse(consentType);

      expect(result.success).toBe(true);
    }
  });

  it('rejects an unsupported consent type', () => {
    const result = UserConsentTypeSchema.safeParse('unknown_consent_type');

    expect(result.success).toBe(false);
  });
});

describe('CreateUserConsentEntitySchema', () => {
  it('accepts valid consent creation input', () => {
    const grantedAt = new Date('2026-06-20T12:00:00.000Z');

    const result = CreateUserConsentEntitySchema.safeParse({
      userId,
      type: UserConsentType.TermsOfService,
      version: '  2026-06-20  ',
      grantedAt,
      revokedAt: null,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        userId,
        type: UserConsentType.TermsOfService,
        version: '2026-06-20',
        grantedAt,
        revokedAt: null,
      });
    }
  });

  it('accepts optional consent creation fields', () => {
    const result = CreateUserConsentEntitySchema.safeParse({
      userId,
      type: UserConsentType.PrivacyPolicy,
    });

    expect(result.success).toBe(true);
  });

  it('accepts a nullable consent version', () => {
    const result = CreateUserConsentEntitySchema.safeParse({
      userId,
      type: UserConsentType.Analytics,
      version: null,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.version).toBeNull();
    }
  });

  it('rejects an invalid user ID', () => {
    const result = CreateUserConsentEntitySchema.safeParse({
      userId: 'not-a-uuid',
      type: UserConsentType.PrivacyPolicy,
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid consent type', () => {
    const result = CreateUserConsentEntitySchema.safeParse({
      userId,
      type: 'unknown_consent_type',
    });

    expect(result.success).toBe(false);
  });
});

describe('UpdateUserConsentEntitySchema', () => {
  it('accepts a grant update', () => {
    const result = UpdateUserConsentEntitySchema.safeParse({
      version: '  2026-06-20  ',
      granted: true,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        version: '2026-06-20',
        granted: true,
      });
    }
  });

  it('accepts a revoke update', () => {
    const result = UpdateUserConsentEntitySchema.safeParse({
      granted: false,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.granted).toBe(false);
    }
  });

  it('accepts clearing the consent version', () => {
    const result = UpdateUserConsentEntitySchema.safeParse({
      version: null,
      granted: true,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.version).toBeNull();
    }
  });

  it('rejects an update without granted', () => {
    const result = UpdateUserConsentEntitySchema.safeParse({
      version: '2026-06-20',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an empty version', () => {
    const result = UpdateUserConsentEntitySchema.safeParse({
      version: '   ',
      granted: true,
    });

    expect(result.success).toBe(false);
  });
});

describe('UserConsentEntitySchema', () => {
  it('accepts a valid internal consent entity', () => {
    const grantedAt = new Date('2026-06-20T12:00:00.000Z');
    const createdAt = new Date('2026-06-20T12:00:00.000Z');
    const updatedAt = new Date('2026-06-20T12:10:00.000Z');

    const result = UserConsentEntitySchema.safeParse({
      id: consentId,
      userId,
      type: UserConsentType.TermsOfService,
      version: '  2026-06-20  ',
      grantedAt,
      revokedAt: null,
      createdAt,
      updatedAt,
      deletedAt: null,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.id).toBe(consentId);
      expect(result.data.userId).toBe(userId);
      expect(result.data.type).toBe(UserConsentType.TermsOfService);
      expect(result.data.version).toBe('2026-06-20');
      expect(result.data.grantedAt).toEqual(grantedAt);
      expect(result.data.revokedAt).toBeNull();
      expect(result.data.createdAt).toEqual(createdAt);
      expect(result.data.updatedAt).toEqual(updatedAt);
      expect(result.data.deletedAt).toBeNull();
    }
  });

  it('accepts a revoked consent entity', () => {
    const revokedAt = new Date('2026-06-20T12:20:00.000Z');

    const result = UserConsentEntitySchema.safeParse({
      id: consentId,
      userId,
      type: UserConsentType.MarketingEmails,
      version: '2026-06-20',
      grantedAt: new Date('2026-06-20T12:00:00.000Z'),
      revokedAt,
      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: revokedAt,
      deletedAt: null,
    });

    expect(result.success).toBe(true);
  });

  it('accepts a soft-deleted consent entity', () => {
    const deletedAt = new Date('2026-06-20T12:30:00.000Z');

    const result = UserConsentEntitySchema.safeParse({
      id: consentId,
      userId,
      type: UserConsentType.Cookies,
      version: null,
      grantedAt: null,
      revokedAt: null,
      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: deletedAt,
      deletedAt,
    });

    expect(result.success).toBe(true);
  });

  it('rejects an entity with an invalid consent ID', () => {
    const result = UserConsentEntitySchema.safeParse({
      id: 'not-a-uuid',
      userId,
      type: UserConsentType.PrivacyPolicy,
      version: '2026-06-20',
      grantedAt: null,
      revokedAt: null,
      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: new Date('2026-06-20T12:10:00.000Z'),
      deletedAt: null,
    });

    expect(result.success).toBe(false);
  });

  it('rejects an entity with an invalid user ID', () => {
    const result = UserConsentEntitySchema.safeParse({
      id: consentId,
      userId: 'not-a-uuid',
      type: UserConsentType.PrivacyPolicy,
      version: '2026-06-20',
      grantedAt: null,
      revokedAt: null,
      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: new Date('2026-06-20T12:10:00.000Z'),
      deletedAt: null,
    });

    expect(result.success).toBe(false);
  });

  it('rejects an entity missing required timestamps', () => {
    const result = UserConsentEntitySchema.safeParse({
      id: consentId,
      userId,
      type: UserConsentType.PrivacyPolicy,
      version: '2026-06-20',
      grantedAt: null,
      revokedAt: null,
      deletedAt: null,
    });

    expect(result.success).toBe(false);
  });
});

describe('UserConsentContractSchema', () => {
  it('accepts a valid serialized consent contract', () => {
    const result = UserConsentContractSchema.safeParse({
      id: consentId,
      userId,
      type: UserConsentType.TermsOfService,
      version: '  2026-06-20  ',
      grantedAt: '2026-06-20T12:00:00.000Z',
      revokedAt: null,
      createdAt: '2026-06-20T12:00:00.000Z',
      updatedAt: '2026-06-20T12:10:00.000Z',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        id: consentId,
        userId,
        type: UserConsentType.TermsOfService,
        version: '2026-06-20',
        grantedAt: '2026-06-20T12:00:00.000Z',
        revokedAt: null,
        createdAt: '2026-06-20T12:00:00.000Z',
        updatedAt: '2026-06-20T12:10:00.000Z',
      });
    }
  });

  it('accepts a revoked serialized consent contract', () => {
    const result = UserConsentContractSchema.safeParse({
      id: consentId,
      userId,
      type: UserConsentType.Analytics,
      version: null,
      grantedAt: '2026-06-20T12:00:00.000Z',
      revokedAt: '2026-06-20T12:30:00.000Z',
      createdAt: '2026-06-20T12:00:00.000Z',
      updatedAt: '2026-06-20T12:30:00.000Z',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a contract with an invalid serialized timestamp', () => {
    const result = UserConsentContractSchema.safeParse({
      id: consentId,
      userId,
      type: UserConsentType.PrivacyPolicy,
      version: '2026-06-20',
      grantedAt: 'not-a-timestamp',
      revokedAt: null,
      createdAt: '2026-06-20T12:00:00.000Z',
      updatedAt: '2026-06-20T12:10:00.000Z',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a contract with an invalid consent type', () => {
    const result = UserConsentContractSchema.safeParse({
      id: consentId,
      userId,
      type: 'unknown_consent_type',
      version: '2026-06-20',
      grantedAt: null,
      revokedAt: null,
      createdAt: '2026-06-20T12:00:00.000Z',
      updatedAt: '2026-06-20T12:10:00.000Z',
    });

    expect(result.success).toBe(false);
  });
});

describe('UpdateUserConsentContractSchema', () => {
  it('accepts a valid grant request', () => {
    const result = UpdateUserConsentContractSchema.safeParse({
      type: UserConsentType.PrivacyPolicy,
      version: '  2026-06-20  ',
      granted: true,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        type: UserConsentType.PrivacyPolicy,
        version: '2026-06-20',
        granted: true,
      });
    }
  });

  it('accepts a valid revoke request', () => {
    const result = UpdateUserConsentContractSchema.safeParse({
      type: UserConsentType.MarketingEmails,
      granted: false,
    });

    expect(result.success).toBe(true);
  });

  it('accepts a nullable version', () => {
    const result = UpdateUserConsentContractSchema.safeParse({
      type: UserConsentType.Analytics,
      version: null,
      granted: true,
    });

    expect(result.success).toBe(true);
  });

  it('rejects a request without a consent type', () => {
    const result = UpdateUserConsentContractSchema.safeParse({
      granted: true,
    });

    expect(result.success).toBe(false);
  });

  it('rejects a request without granted', () => {
    const result = UpdateUserConsentContractSchema.safeParse({
      type: UserConsentType.Analytics,
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid consent type', () => {
    const result = UpdateUserConsentContractSchema.safeParse({
      type: 'unknown_consent_type',
      granted: true,
    });

    expect(result.success).toBe(false);
  });
});
