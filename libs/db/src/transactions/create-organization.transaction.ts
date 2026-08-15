// libs/db/src/transactions/create-organization.transaction.ts

import type { RoleAssignment } from '@aerealith-ai/authorization';

import type { DatabaseClient } from '../client';

import type {
  CreateOrganizationRecord,
  OrganizationMemberRecord,
  OrganizationRecord,
} from '../mappers/organization';

import { roleByScopeSlug } from '../queries/authorization';

import { DrizzleAuthorizationRepository } from '../repositories/authorization';
import { DrizzleOrganizationRepository } from '../repositories/organization';

import { PermissionScope } from '../schema/authorization/permissions';

import { roles } from '../schema/authorization/roles';

import { OrganizationMemberStatus } from '../schema/organization/organization-member.table';

import { withTransaction } from './with-transaction';

const ORGANIZATION_OWNER_ROLE_SLUG = 'owner';

export interface CreateOrganizationTransactionInput {
  /**
   * User creating the organization.
   *
   * This user becomes:
   *
   *   1. the organization's createdByUserId
   *   2. an active organization member
   *   3. the initial owner-role assignee
   */
  readonly creatorUserId: string;

  /**
   * Organization data to persist.
   *
   * createdByUserId is controlled by this transaction and therefore cannot be
   * supplied independently by the caller.
   */
  readonly organization: Omit<CreateOrganizationRecord, 'createdByUserId'>;
}

export interface CreateOrganizationTransactionResult {
  readonly organization: OrganizationRecord;
  readonly membership: OrganizationMemberRecord;
  readonly ownerAssignment: RoleAssignment;
}

/**
 * Creates a new organization and establishes its initial ownership atomically.
 *
 * The complete provisioning graph is:
 *
 *   organization
 *       ↓
 *   creator organization membership
 *       ↓
 *   organization owner role assignment
 *
 * All writes occur inside one database transaction.
 *
 * If organization creation, membership creation, owner-role lookup, role
 * assignment, or authorization-version mutation fails, the entire operation
 * rolls back.
 *
 * Organization authority is intentionally NOT represented by
 * organizations.createdByUserId.
 *
 * createdByUserId is provenance only.
 *
 * Actual ownership comes from:
 *
 *   organization_members
 *       ↓
 *   organization_member_roles
 *       ↓
 *   roles.slug = "owner"
 */
export async function createOrganizationTransaction(
  database: DatabaseClient,
  input: CreateOrganizationTransactionInput,
): Promise<CreateOrganizationTransactionResult> {
  return withTransaction(database, async (transaction) => {
    const transactionDatabase = transaction as unknown as DatabaseClient;

    const organizationRepository = new DrizzleOrganizationRepository(
      transactionDatabase,
    );

    const authorizationRepository = new DrizzleAuthorizationRepository(
      transactionDatabase,
    );

    /**
     * Create the organization first.
     *
     * createdByUserId is audit/provenance information and is deliberately
     * controlled by the transaction rather than accepting an unrelated user
     * ID from organization input.
     */
    const organization = await organizationRepository.create({
      ...input.organization,

      createdByUserId: input.creatorUserId,
    });

    /**
     * Establish the creator as an active organization member.
     *
     * Organization roles can only be assigned through a membership.
     */
    const membership = await organizationRepository.addMember({
      organizationId: organization.id,

      userId: input.creatorUserId,

      status: OrganizationMemberStatus.Active,

      addedByUserId: input.creatorUserId,
    });

    /**
     * Resolve the canonical organization owner role.
     *
     * The initial system role catalog must contain:
     *
     *   scope = organization
     *   slug  = owner
     */
    const [ownerRole] = await transaction
      .select({
        id: roles.id,

        isSystem: roles.isSystem,
      })
      .from(roles)
      .where(
        roleByScopeSlug(
          PermissionScope.Organization,
          ORGANIZATION_OWNER_ROLE_SLUG,
        ),
      )
      .limit(1);

    if (!ownerRole?.isSystem) {
      throw new Error('Organization owner system role not found.');
    }

    /**
     * Assign the organization-scoped owner role to the creator.
     *
     * DrizzleAuthorizationRepository resolves the membership internally and
     * writes organization_member_roles.
     */
    const ownerAssignment = await authorizationRepository.assignRole({
      principal: {
        id: input.creatorUserId,

        type: 'user',
      },

      roleId: ownerRole.id,

      scope: {
        type: 'organization',

        id: organization.id,
      },

      assignedBy: input.creatorUserId,
    });

    /**
     * Authorization resolution may be cached by principal version.
     *
     * Increment the version in the same transaction so the newly assigned
     * owner permissions cannot commit without also invalidating stale
     * authorization state.
     */
    await authorizationRepository.incrementPrincipalVersion({
      id: input.creatorUserId,

      type: 'user',
    });

    return {
      organization,
      membership,
      ownerAssignment,
    };
  });
}
