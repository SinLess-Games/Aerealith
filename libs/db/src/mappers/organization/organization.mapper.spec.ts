import { describe, expect, it } from 'vitest';

import { OrganizationStatus } from '../../schema/organization/organization.table';
import {
  normalizeOrganizationSlug,
  toNewOrganizationRow,
  toOrganizationRecord,
  toOrganizationUpdateRow,
} from './organization.mapper';

const createdAt = new Date('2026-08-13T12:00:00.000Z');
const updatedAt = new Date('2026-08-13T13:00:00.000Z');

function createRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'organization-1',
    name: 'SinLess Games',
    slug: 'sinless-games',
    description: 'A studio.',
    status: OrganizationStatus.Active,
    createdByUserId: 'user-1',
    metadata: { plan: 'pro' },
    createdAt,
    updatedAt,
    deletedAt: null,
    ...overrides,
  } as never;
}

describe('organization mapper', () => {
  it('maps database rows without leaking nullable fields', () => {
    expect(toOrganizationRecord(createRow())).toEqual({
      id: 'organization-1',
      name: 'SinLess Games',
      slug: 'sinless-games',
      description: 'A studio.',
      status: 'active',
      createdByUserId: 'user-1',
      metadata: { plan: 'pro' },
      createdAt,
      updatedAt,
    });
    expect(
      toOrganizationRecord(
        createRow({ description: null, createdByUserId: null }),
      ),
    ).not.toHaveProperty('description');
    expect(() =>
      toOrganizationRecord(createRow({ status: 'invalid' })),
    ).toThrow('Invalid organization status');
  });

  it('normalizes organization creation values and clones metadata', () => {
    const metadata = { plan: 'pro' };
    const row = toNewOrganizationRow({
      name: ' SinLess Games ',
      slug: ' Aerealith_AI!! ',
      description: '   ',
      createdByUserId: 'user-1',
      metadata,
    });
    expect(row).toEqual({
      name: 'SinLess Games',
      slug: 'aerealith-ai',
      description: null,
      status: 'active',
      createdByUserId: 'user-1',
      metadata: { plan: 'pro' },
    });
    expect(row.metadata).not.toBe(metadata);
    expect(normalizeOrganizationSlug(' --Aerealith__AI!!-- ')).toBe(
      'aerealith-ai',
    );
  });

  it('maps partial updates and supports clearing descriptions', () => {
    expect(toOrganizationUpdateRow({})).toEqual({});
    expect(
      toOrganizationUpdateRow({
        name: ' Updated ',
        slug: ' Updated_Slug ',
        description: null,
        status: OrganizationStatus.Suspended,
        metadata: { plan: 'free' },
      }),
    ).toEqual({
      name: 'Updated',
      slug: 'updated-slug',
      description: null,
      status: 'suspended',
      metadata: { plan: 'free' },
    });
  });
});
