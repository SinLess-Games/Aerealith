// libs/db/src/repositories/organization/drizzle-organization.repository.ts

import { asc, eq } from 'drizzle-orm';

import type { DatabaseClient } from '../../client';

import {
  toNewOrganizationMemberRow,
  toNewOrganizationRow,
  toOrganizationMemberRecord,
  toOrganizationMemberUpdateRow,
  toOrganizationRecord,
  toOrganizationUpdateRow,
  type CreateOrganizationMemberRecord,
  type CreateOrganizationRecord,
  type OrganizationMemberRecord,
  type OrganizationRecord,
  type UpdateOrganizationMemberRecord,
  type UpdateOrganizationRecord,
} from '../../mappers/organization';

import {
  activeOrganizationById,
  activeOrganizationBySlug,
  activeOrganizationMemberById,
  activeOrganizationMemberByOrganizationAndUser,
  activeOrganizationMembersByOrganizationId,
  activeOrganizationMembersByUserId,
  existingOrganizationById,
  existingOrganizationBySlug,
  organizationMemberById,
  organizationMemberByOrganizationAndUser,
  organizationMembersByOrganizationId,
  organizationMembersByUserId,
} from '../../queries/organization';

import { organizationMembers } from '../../schema/organization/organization-member.table';

import { organizationsTable } from '../../schema/organization/organization.table';

/**
 * Persistence repository for organizations and organization memberships.
 *
 * Responsibilities:
 *
 *   organizations
 *   organization_members
 *
 * Authorization roles are intentionally not managed here.
 *
 * Organization role assignments belong to:
 *
 *   DrizzleAuthorizationRepository
 *
 * through:
 *
 *   organization_member_roles
 *
 * This keeps organization membership and authorization assignment separate.
 */
export class DrizzleOrganizationRepository {
  constructor(private readonly database: DatabaseClient) {}

  /**
   * Finds an active organization by ID.
   *
   * Suspended, archived, and soft-deleted organizations are excluded.
   */
  async findActiveById(id: string): Promise<OrganizationRecord | null> {
    const [row] = await this.database
      .select()
      .from(organizationsTable)
      .where(activeOrganizationById(id))
      .limit(1);

    return row ? toOrganizationRecord(row) : null;
  }

  /**
   * Finds an active organization by canonical slug.
   *
   * Suspended, archived, and soft-deleted organizations are excluded.
   */
  async findActiveBySlug(slug: string): Promise<OrganizationRecord | null> {
    const [row] = await this.database
      .select()
      .from(organizationsTable)
      .where(activeOrganizationBySlug(slug))
      .limit(1);

    return row ? toOrganizationRecord(row) : null;
  }

  /**
   * Finds a non-deleted organization by ID.
   *
   * Active, suspended, and archived organizations may be returned.
   */
  async findById(id: string): Promise<OrganizationRecord | null> {
    const [row] = await this.database
      .select()
      .from(organizationsTable)
      .where(existingOrganizationById(id))
      .limit(1);

    return row ? toOrganizationRecord(row) : null;
  }

  /**
   * Finds a non-deleted organization by canonical slug.
   *
   * Active, suspended, and archived organizations may be returned.
   */
  async findBySlug(slug: string): Promise<OrganizationRecord | null> {
    const [row] = await this.database
      .select()
      .from(organizationsTable)
      .where(existingOrganizationBySlug(slug))
      .limit(1);

    return row ? toOrganizationRecord(row) : null;
  }

  /**
   * Creates an organization.
   *
   * This method creates only the organization row.
   *
   * Initial ownership must be established atomically by the organization
   * creation transaction:
   *
   *   organization
   *       ↓
   *   creator membership
   *       ↓
   *   owner role assignment
   */
  async create(input: CreateOrganizationRecord): Promise<OrganizationRecord> {
    const [row] = await this.database
      .insert(organizationsTable)
      .values(toNewOrganizationRow(input))
      .returning();

    if (!row) {
      throw new Error('Failed to create organization.');
    }

    return toOrganizationRecord(row);
  }

  /**
   * Updates a non-deleted organization.
   *
   * Soft-deleted organizations cannot be mutated through this method.
   */
  async update(
    id: string,
    input: UpdateOrganizationRecord,
  ): Promise<OrganizationRecord | null> {
    const values = toOrganizationUpdateRow(input);

    if (Object.keys(values).length === 0) {
      return this.findById(id);
    }

    const [row] = await this.database
      .update(organizationsTable)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(existingOrganizationById(id))
      .returning();

    return row ? toOrganizationRecord(row) : null;
  }

  /**
   * Soft-deletes an organization.
   *
   * deletedAt represents deletion independently from lifecycle status.
   *
   * The organization is not automatically changed to "archived" because
   * archival and deletion are separate states.
   */
  async softDelete(id: string): Promise<boolean> {
    const now = new Date();

    const [row] = await this.database
      .update(organizationsTable)
      .set({
        deletedAt: now,

        updatedAt: now,
      })
      .where(existingOrganizationById(id))
      .returning({
        id: organizationsTable.id,
      });

    return row !== undefined;
  }

  /**
   * Finds an organization membership by membership ID.
   *
   * Active and suspended memberships may be returned.
   */
  async findMemberById(id: string): Promise<OrganizationMemberRecord | null> {
    const [row] = await this.database
      .select()
      .from(organizationMembers)
      .where(organizationMemberById(id))
      .limit(1);

    return row ? toOrganizationMemberRecord(row) : null;
  }

  /**
   * Finds an active organization membership by membership ID.
   */
  async findActiveMemberById(
    id: string,
  ): Promise<OrganizationMemberRecord | null> {
    const [row] = await this.database
      .select()
      .from(organizationMembers)
      .where(activeOrganizationMemberById(id))
      .limit(1);

    return row ? toOrganizationMemberRecord(row) : null;
  }

  /**
   * Finds the membership connecting a user to an organization.
   *
   * Active and suspended memberships may be returned.
   */
  async findMember(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMemberRecord | null> {
    const [row] = await this.database
      .select()
      .from(organizationMembers)
      .where(organizationMemberByOrganizationAndUser(organizationId, userId))
      .limit(1);

    return row ? toOrganizationMemberRecord(row) : null;
  }

  /**
   * Finds the active membership connecting a user to an organization.
   *
   * Suspended memberships are excluded.
   */
  async findActiveMember(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMemberRecord | null> {
    const [row] = await this.database
      .select()
      .from(organizationMembers)
      .where(
        activeOrganizationMemberByOrganizationAndUser(organizationId, userId),
      )
      .limit(1);

    return row ? toOrganizationMemberRecord(row) : null;
  }

  /**
   * Lists every membership belonging to an organization.
   *
   * Active and suspended memberships are included.
   */
  async findMembersByOrganizationId(
    organizationId: string,
  ): Promise<readonly OrganizationMemberRecord[]> {
    const rows = await this.database
      .select()
      .from(organizationMembers)
      .where(organizationMembersByOrganizationId(organizationId))
      .orderBy(asc(organizationMembers.joinedAt));

    return rows.map(toOrganizationMemberRecord);
  }

  /**
   * Lists active memberships belonging to an organization.
   */
  async findActiveMembersByOrganizationId(
    organizationId: string,
  ): Promise<readonly OrganizationMemberRecord[]> {
    const rows = await this.database
      .select()
      .from(organizationMembers)
      .where(activeOrganizationMembersByOrganizationId(organizationId))
      .orderBy(asc(organizationMembers.joinedAt));

    return rows.map(toOrganizationMemberRecord);
  }

  /**
   * Lists every organization membership belonging to a user.
   *
   * Active and suspended memberships are included.
   */
  async findMembershipsByUserId(
    userId: string,
  ): Promise<readonly OrganizationMemberRecord[]> {
    const rows = await this.database
      .select()
      .from(organizationMembers)
      .where(organizationMembersByUserId(userId))
      .orderBy(asc(organizationMembers.joinedAt));

    return rows.map(toOrganizationMemberRecord);
  }

  /**
   * Lists active organization memberships belonging to a user.
   *
   * This is useful when determining which organizations a user may currently
   * participate in.
   */
  async findActiveMembershipsByUserId(
    userId: string,
  ): Promise<readonly OrganizationMemberRecord[]> {
    const rows = await this.database
      .select()
      .from(organizationMembers)
      .where(activeOrganizationMembersByUserId(userId))
      .orderBy(asc(organizationMembers.joinedAt));

    return rows.map(toOrganizationMemberRecord);
  }

  /**
   * Adds a user to an organization.
   *
   * This creates membership only.
   *
   * Assigning an organization role is a separate authorization operation.
   */
  async addMember(
    input: CreateOrganizationMemberRecord,
  ): Promise<OrganizationMemberRecord> {
    const [row] = await this.database
      .insert(organizationMembers)
      .values(toNewOrganizationMemberRow(input))
      .returning();

    if (!row) {
      throw new Error('Failed to create organization membership.');
    }

    return toOrganizationMemberRecord(row);
  }

  /**
   * Updates mutable organization-membership state.
   *
   * Membership identity cannot be changed. organizationId and userId are not
   * updateable through this method.
   */
  async updateMember(
    id: string,
    input: UpdateOrganizationMemberRecord,
  ): Promise<OrganizationMemberRecord | null> {
    const values = toOrganizationMemberUpdateRow(input);

    if (Object.keys(values).length === 0) {
      return this.findMemberById(id);
    }

    const [row] = await this.database
      .update(organizationMembers)
      .set({
        ...values,

        updatedAt: new Date(),
      })
      .where(organizationMemberById(id))
      .returning();

    return row ? toOrganizationMemberRecord(row) : null;
  }

  /**
   * Suspends an organization membership without removing the membership or
   * its role assignments.
   *
   * Authorization resolution excludes suspended memberships.
   */
  async suspendMember(id: string): Promise<OrganizationMemberRecord | null> {
    return this.updateMember(id, {
      status: 'suspended',
    });
  }

  /**
   * Reactivates a suspended organization membership.
   */
  async activateMember(id: string): Promise<OrganizationMemberRecord | null> {
    return this.updateMember(id, {
      status: 'active',
    });
  }

  /**
   * Removes an organization membership.
   *
   * organization_member_roles references memberships with ON DELETE CASCADE,
   * so associated organization role assignments are removed with the
   * membership.
   *
   * Historical authorization activity should be retained by the audit/event
   * system rather than by keeping deleted assignment rows.
   */
  async removeMember(id: string): Promise<boolean> {
    const [row] = await this.database
      .delete(organizationMembers)
      .where(eq(organizationMembers.id, id))
      .returning({
        id: organizationMembers.id,
      });

    return row !== undefined;
  }

  /**
   * Runs multiple organization persistence operations atomically.
   *
   * This is intended for workflows such as organization provisioning where
   * organization creation, creator membership, and authorization assignment
   * must succeed or fail together.
   */
  async transaction<T>(
    work: (repository: DrizzleOrganizationRepository) => Promise<T>,
  ): Promise<T> {
    return this.database.transaction(async (transaction) =>
      work(
        new DrizzleOrganizationRepository(
          transaction as unknown as DatabaseClient,
        ),
      ),
    );
  }
}
