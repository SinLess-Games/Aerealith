// libs/db/src/schema/authorization/organization-member-role.ts

import {
  index,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { organizationMembers } from '../organization/organization-member.table';
import { usersTable as users } from '../user/user.table';
import { roles } from './roles';

/**
 * Assigns organization-scoped roles to organization members.
 *
 * This table is intentionally separate from platform_role_assignments.
 *
 * Platform roles answer:
 *
 *   "What can this user do across Aerealith?"
 *
 * Organization member roles answer:
 *
 *   "What can this member do inside this organization?"
 *
 * Examples:
 *
 *   organization member
 *     -> owner
 *
 *   organization member
 *     -> administrator
 *
 *   organization member
 *     -> member
 *
 *   organization member
 *     -> viewer
 *
 * A member may hold multiple organization roles.
 *
 * Authorization should resolve these roles into permissions through the
 * role_permissions table rather than checking role names directly.
 */
export const organizationMemberRoles = pgTable(
  'organization_member_roles',
  {
    /**
     * Organization membership receiving the role.
     *
     * Referencing the membership rather than the user directly guarantees
     * that organization roles can only be assigned to users who are actually
     * members of the organization.
     *
     * Removing the organization membership automatically removes all roles
     * associated with that membership.
     */
    organizationMemberId: uuid('organization_member_id')
      .notNull()
      .references(() => organizationMembers.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    /**
     * Organization-scoped role assigned to the member.
     *
     * The authorization layer must enforce:
     *
     *   role.scope === "organization"
     *
     * because the role scope is stored on the roles table and therefore
     * cannot be validated by this simple foreign-key relationship alone.
     */
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    /**
     * User who granted this role.
     *
     * This is stored as a user rather than an organization member so that
     * platform administrators may also perform authorized administrative
     * assignments when necessary.
     *
     * Null is allowed for:
     *
     * - initial organization provisioning
     * - database seeds
     * - automated role assignment
     * - system migrations
     *
     * SET NULL preserves the assignment if the assigning user is later
     * removed from the platform.
     */
    assignedByUserId: uuid('assigned_by_user_id').references(() => users.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),

    /**
     * Time at which the role was assigned.
     */
    assignedAt: timestamp('assigned_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),

    /**
     * Optional expiration for temporary organization access.
     *
     * Null means the role remains active until explicitly removed.
     *
     * This supports cases such as:
     *
     * - temporary administrators
     * - contractors
     * - temporary support access
     * - incident response
     * - elevated access workflows
     */
    expiresAt: timestamp('expires_at', {
      withTimezone: true,
      mode: 'date',
    }),
  },
  (table) => [
    /**
     * A member may only hold a specific organization role once.
     *
     * The relationship itself is uniquely identified by:
     *
     *   organizationMemberId + roleId
     *
     * so a standalone UUID is unnecessary.
     */
    primaryKey({
      name: 'organization_member_roles_pk',
      columns: [table.organizationMemberId, table.roleId],
    }),

    /**
     * Supports reverse lookups such as:
     *
     *   "Which organization members have this role?"
     */
    index('organization_member_roles_role_id_idx').on(table.roleId),

    /**
     * Useful for auditing role assignments made by a specific user.
     */
    index('organization_member_roles_assigned_by_user_id_idx').on(
      table.assignedByUserId,
    ),

    /**
     * Supports cleanup and security jobs for temporary organization role
     * assignments.
     */
    index('organization_member_roles_expires_at_idx').on(table.expiresAt),
  ],
);

export type OrganizationMemberRole =
  typeof organizationMemberRoles.$inferSelect;

export type NewOrganizationMemberRole =
  typeof organizationMemberRoles.$inferInsert;
