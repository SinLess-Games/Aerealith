// libs/core/src/schemas/entities/system/waitlist.schema.spec.ts

import { describe, expect, it } from 'vitest';

import {
  CreateWaitlistEntitySchema,
  WaitlistContractSchema,
  WaitlistEmailSchema,
  WaitlistEntitySchema,
  WaitlistIdSchema,
} from './waitlist.schema';

const waitlistId = '550e8400-e29b-41d4-a716-446655440000';

describe('WaitlistIdSchema', () => {
  it('accepts a valid UUID', () => {
    const result = WaitlistIdSchema.safeParse(waitlistId);

    expect(result.success).toBe(true);
  });

  it('rejects an invalid UUID', () => {
    const result = WaitlistIdSchema.safeParse('not-a-uuid');

    expect(result.success).toBe(false);
  });
});

describe('WaitlistEmailSchema', () => {
  it('normalizes a valid email address', () => {
    const result = WaitlistEmailSchema.safeParse(
      '  Andy@Example.COM  ',
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toBe('andy@example.com');
    }
  });

  it('rejects an invalid email address', () => {
    const result = WaitlistEmailSchema.safeParse('not-an-email');

    expect(result.success).toBe(false);
  });

  it('rejects an empty email address', () => {
    const result = WaitlistEmailSchema.safeParse('');

    expect(result.success).toBe(false);
  });
});

describe('CreateWaitlistEntitySchema', () => {
  it('accepts and normalizes a valid waitlist request', () => {
    const result = CreateWaitlistEntitySchema.safeParse({
      email: '  Andy@Example.COM  ',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        email: 'andy@example.com',
      });
    }
  });

  it('rejects a request without an email address', () => {
    const result = CreateWaitlistEntitySchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it('rejects a request with an invalid email address', () => {
    const result = CreateWaitlistEntitySchema.safeParse({
      email: 'invalid-email',
    });

    expect(result.success).toBe(false);
  });
});

describe('WaitlistEntitySchema', () => {
  it('accepts a valid internal waitlist entity', () => {
    const createdAt = new Date('2026-06-20T12:00:00.000Z');
    const updatedAt = new Date('2026-06-20T12:10:00.000Z');

    const result = WaitlistEntitySchema.safeParse({
      id: waitlistId,
      email: '  Andy@Example.COM  ',
      createdAt,
      updatedAt,
      deletedAt: null,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.id).toBe(waitlistId);
      expect(result.data.email).toBe('andy@example.com');
      expect(result.data.createdAt).toEqual(createdAt);
      expect(result.data.updatedAt).toEqual(updatedAt);
      expect(result.data.deletedAt).toBeNull();
    }
  });

  it('accepts a soft-deleted waitlist entity', () => {
    const deletedAt = new Date('2026-06-20T12:20:00.000Z');

    const result = WaitlistEntitySchema.safeParse({
      id: waitlistId,
      email: 'andy@example.com',
      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: deletedAt,
      deletedAt,
    });

    expect(result.success).toBe(true);
  });

  it('rejects an entity with an invalid ID', () => {
    const result = WaitlistEntitySchema.safeParse({
      id: 'invalid-id',
      email: 'andy@example.com',
      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: new Date('2026-06-20T12:10:00.000Z'),
      deletedAt: null,
    });

    expect(result.success).toBe(false);
  });

  it('rejects an entity with an invalid email address', () => {
    const result = WaitlistEntitySchema.safeParse({
      id: waitlistId,
      email: 'invalid-email',
      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: new Date('2026-06-20T12:10:00.000Z'),
      deletedAt: null,
    });

    expect(result.success).toBe(false);
  });

  it('rejects an entity missing required timestamps', () => {
    const result = WaitlistEntitySchema.safeParse({
      id: waitlistId,
      email: 'andy@example.com',
      deletedAt: null,
    });

    expect(result.success).toBe(false);
  });
});

describe('WaitlistContractSchema', () => {
  it('accepts a valid serialized waitlist contract', () => {
    const result = WaitlistContractSchema.safeParse({
      id: waitlistId,
      email: '  Andy@Example.COM  ',
      createdAt: '2026-06-20T12:00:00.000Z',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        id: waitlistId,
        email: 'andy@example.com',
        createdAt: '2026-06-20T12:00:00.000Z',
      });
    }
  });

  it('rejects a contract with an invalid timestamp', () => {
    const result = WaitlistContractSchema.safeParse({
      id: waitlistId,
      email: 'andy@example.com',
      createdAt: 'not-a-timestamp',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a contract with an invalid email address', () => {
    const result = WaitlistContractSchema.safeParse({
      id: waitlistId,
      email: 'invalid-email',
      createdAt: '2026-06-20T12:00:00.000Z',
    });

    expect(result.success).toBe(false);
  });
});
