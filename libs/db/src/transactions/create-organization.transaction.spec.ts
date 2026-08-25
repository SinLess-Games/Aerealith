import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DatabaseClient } from '../client';
import { OrganizationMemberStatus } from '../schema/organization/organization-member.table';
import { createOrganizationTransaction } from './create-organization.transaction';

const mocks = vi.hoisted(() => ({
  addMember: vi.fn(),
  assignRole: vi.fn(),
  authorizationConstructor: vi.fn(),
  create: vi.fn(),
  incrementPrincipalVersion: vi.fn(),
  limit: vi.fn(),
  organizationConstructor: vi.fn(),
  transaction: {} as Record<string, unknown>,
  withTransaction: vi.fn(),
}));

vi.mock('../repositories/authorization', () => ({
  DrizzleAuthorizationRepository: function Repository(database: unknown) {
    mocks.authorizationConstructor(database);
    return {
      assignRole: mocks.assignRole,
      incrementPrincipalVersion: mocks.incrementPrincipalVersion,
    };
  },
}));
vi.mock('../repositories/organization', () => ({
  DrizzleOrganizationRepository: function Repository(database: unknown) {
    mocks.organizationConstructor(database);
    return { addMember: mocks.addMember, create: mocks.create };
  },
}));
vi.mock('./with-transaction', () => ({
  withTransaction: mocks.withTransaction,
}));

const database = { transaction: vi.fn() } as unknown as DatabaseClient;
const organization = { id: 'organization-1', name: 'Aerealith' };
const membership = { id: 'member-1', organizationId: 'organization-1' };
const ownerAssignment = { id: 'assignment-1', roleId: 'owner-role' };

describe('createOrganizationTransaction', () => {
  beforeEach(() => {
    mocks.limit
      .mockReset()
      .mockResolvedValue([{ id: 'owner-role', isSystem: true }]);
    const where = vi.fn(() => ({ limit: mocks.limit }));
    const from = vi.fn(() => ({ where }));
    mocks.transaction = { select: vi.fn(() => ({ from })) };
    mocks.create.mockReset().mockResolvedValue(organization);
    mocks.addMember.mockReset().mockResolvedValue(membership);
    mocks.assignRole.mockReset().mockResolvedValue(ownerAssignment);
    mocks.incrementPrincipalVersion.mockReset().mockResolvedValue(1);
    mocks.authorizationConstructor.mockReset();
    mocks.organizationConstructor.mockReset();
    mocks.withTransaction
      .mockReset()
      .mockImplementation(
        async (_database: DatabaseClient, callback: (tx: unknown) => unknown) =>
          callback(mocks.transaction),
      );
  });

  it('creates an organization, active creator membership, and owner assignment', async () => {
    const result = await createOrganizationTransaction(database, {
      creatorUserId: 'user-1',
      organization: { name: 'Aerealith', slug: 'aerealith' },
    });

    expect(result).toEqual({ organization, membership, ownerAssignment });
    expect(mocks.organizationConstructor).toHaveBeenCalledWith(
      mocks.transaction,
    );
    expect(mocks.authorizationConstructor).toHaveBeenCalledWith(
      mocks.transaction,
    );
    expect(mocks.create).toHaveBeenCalledWith({
      createdByUserId: 'user-1',
      name: 'Aerealith',
      slug: 'aerealith',
    });
    expect(mocks.addMember).toHaveBeenCalledWith({
      addedByUserId: 'user-1',
      organizationId: 'organization-1',
      status: OrganizationMemberStatus.Active,
      userId: 'user-1',
    });
    expect(mocks.assignRole).toHaveBeenCalledWith({
      assignedBy: 'user-1',
      principal: { id: 'user-1', type: 'user' },
      roleId: 'owner-role',
      scope: { id: 'organization-1', type: 'organization' },
    });
    expect(mocks.incrementPrincipalVersion).toHaveBeenCalledWith({
      id: 'user-1',
      type: 'user',
    });
  });

  it.each([[[]], [[{ id: 'owner-role', isSystem: false }]]])(
    'rejects a missing canonical system owner role',
    async (roles) => {
      mocks.limit.mockResolvedValue(roles);
      await expect(
        createOrganizationTransaction(database, {
          creatorUserId: 'user-1',
          organization: { name: 'Aerealith', slug: 'aerealith' },
        }),
      ).rejects.toThrow('Organization owner system role not found.');
      expect(mocks.assignRole).not.toHaveBeenCalled();
      expect(mocks.incrementPrincipalVersion).not.toHaveBeenCalled();
    },
  );

  it('propagates provisioning failures without advancing authorization version', async () => {
    const failure = new Error('membership conflict');
    mocks.addMember.mockRejectedValue(failure);
    await expect(
      createOrganizationTransaction(database, {
        creatorUserId: 'user-1',
        organization: { name: 'Aerealith', slug: 'aerealith' },
      }),
    ).rejects.toBe(failure);
    expect(mocks.assignRole).not.toHaveBeenCalled();
    expect(mocks.incrementPrincipalVersion).not.toHaveBeenCalled();
  });
});
