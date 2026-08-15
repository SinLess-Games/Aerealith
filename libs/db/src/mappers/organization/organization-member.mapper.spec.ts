import { describe, expect, it } from 'vitest';

import { OrganizationMemberStatus } from '../../schema/organization/organization-member.table';
import {
  isActiveOrganizationMember,
  isSuspendedOrganizationMember,
  toNewOrganizationMemberRow,
  toOrganizationMemberRecord,
  toOrganizationMemberUpdateRow,
} from './organization-member.mapper';

const joinedAt = new Date('2026-08-13T12:00:00.000Z');
const createdAt = new Date('2026-08-13T12:00:00.000Z');
const updatedAt = new Date('2026-08-13T13:00:00.000Z');

function createRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'member-1',
    organizationId: 'organization-1',
    userId: 'user-1',
    status: OrganizationMemberStatus.Active,
    addedByUserId: 'admin-1',
    joinedAt,
    createdAt,
    updatedAt,
    ...overrides,
  } as never;
}

describe('organization member mapper', () => {
  it('maps and validates persisted memberships', () => {
    expect(toOrganizationMemberRecord(createRow())).toEqual({
      id: 'member-1',
      organizationId: 'organization-1',
      userId: 'user-1',
      status: 'active',
      addedByUserId: 'admin-1',
      joinedAt,
      createdAt,
      updatedAt,
    });
    expect(
      toOrganizationMemberRecord(createRow({ addedByUserId: null })),
    ).not.toHaveProperty('addedByUserId');
    expect(() =>
      toOrganizationMemberRecord(createRow({ status: 'invalid' })),
    ).toThrow('Invalid organization member status');
  });

  it('defaults new memberships to active and maps optional provenance', () => {
    expect(
      toNewOrganizationMemberRow({
        organizationId: 'organization-1',
        userId: 'user-1',
      }),
    ).toEqual({
      organizationId: 'organization-1',
      userId: 'user-1',
      status: 'active',
    });
    expect(
      toNewOrganizationMemberRow({
        organizationId: 'organization-1',
        userId: 'user-1',
        status: OrganizationMemberStatus.Suspended,
        addedByUserId: 'admin-1',
      }),
    ).toMatchObject({ status: 'suspended', addedByUserId: 'admin-1' });
  });

  it('maps mutable status and classifies participation', () => {
    expect(toOrganizationMemberUpdateRow({})).toEqual({});
    expect(
      toOrganizationMemberUpdateRow({
        status: OrganizationMemberStatus.Suspended,
      }),
    ).toEqual({ status: 'suspended' });
    expect(isActiveOrganizationMember(createRow())).toBe(true);
    expect(isSuspendedOrganizationMember(createRow())).toBe(false);
    expect(
      isSuspendedOrganizationMember(createRow({ status: 'suspended' })),
    ).toBe(true);
  });
});
