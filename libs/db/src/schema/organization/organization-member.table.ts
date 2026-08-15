// libs/db/src/schema/organization/organization-member.table.ts

import { sql } from 'drizzle-orm';
import {
  check,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { usersTable as users } from '../user/user.table';
import { organizationsTable as organizations } from './organization.table';

/**
 * Organization membership states.
 *
 * Active members participate normally in the organization.
 *
 * Suspended members retain their membership record and role assignments,
 * but authorization should deny organization-scoped access until the
 * membership is restored.
 */
export const OrganizationMemberStatus = {
  Active: 'active',
  Suspended: 'suspended',
} as const;

export type OrganizationMemberStatus =
  (typeof OrganizationMemberStatus)[keyof typeof OrganizationMemberStatus];

/**
 * Connects Aerealith users to organizations.
 *
 * This table establishes the organization boundary for a user.
 *
 * Roles are intentionally NOT stored directly on this table.
 *
 * Organization-specific roles are assigned through:
 *
 *   organization_member_roles
 *
 * That gives the authorization model:
 *
 *   users
 *      ↓
 *   organization_members
 *      ↓
 *   organization_member_roles
 *      ↓
 *   roles
 *      ↓
 *   role_permissions
 *      ↓
 *   permissions
 *
 * A single user may belong to many organizations, and each organization
 * may contain many users.
 */
export const organizationMembers = pgTable(
  'organization_members',
  {
    /**
     * Stable membership identifier.
     *
     * Other organization-scoped tables should reference this ID when they
     * need to identify the user's membership rather than the user globally.
     */
    id: uuid('id').defaultRandom().primaryKey(),

    /**
     * Organization this membership belongs to.
     *
     * Deleting the organization deletes all of its memberships.
     */
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    /**
     * User who belongs to the organization.
     *
     * Deleting the user deletes their organization memberships.
     */
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    /**
     * Current membership status.
     *
     * Suspended memberships remain in the database so administrators can
     * restore access without rebuilding role assignments.
     */
    status: varchar('status', {
      length: 32,
    })
      .$type<OrganizationMemberStatus>()
      .default(OrganizationMemberStatus.Active)
      .notNull(),

    /**
     * User responsible for adding this member to the organization.
     *
     * This may be null when the membership was created by:
     *
     * - organization bootstrap/provisioning
     * - a database seed
     * - an automated system process
     *
     * SET NULL preserves the membership if that administrator is later
     * removed from Aerealith.
     */
    addedByUserId: uuid('added_by_user_id').references(() => users.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),

    /**
     * Time at which the user became an organization member.
     *
     * This is distinct from createdAt so membership lifecycle semantics stay
     * explicit if invitation or approval workflows are introduced later.
     */
    joinedAt: timestamp('joined_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),

    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    /**
     * A user may belong to an organization only once.
     *
     * Multiple roles for the same member are handled by
     * organization_member_roles rather than duplicate memberships.
     */
    uniqueIndex('organization_members_organization_user_unique').on(
      table.organizationId,
      table.userId,
    ),

    /**
     * Supports:
     *
     *   "Give me every member of this organization."
     */
    index('organization_members_organization_id_idx').on(table.organizationId),

    /**
     * Supports:
     *
     *   "Which organizations does this user belong to?"
     */
    index('organization_members_user_id_idx').on(table.userId),

    /**
     * Useful for filtering organization members by lifecycle state.
     */
    index('organization_members_organization_status_idx').on(
      table.organizationId,
      table.status,
    ),

    /**
     * Useful for auditing memberships added by a specific administrator.
     */
    index('organization_members_added_by_user_id_idx').on(table.addedByUserId),

    /**
     * Enforce valid membership lifecycle states at the database boundary.
     */
    check(
      'organization_members_status_check',
      sql`${table.status} in ('active', 'suspended')`,
    ),
  ],
);

export type OrganizationMember = typeof organizationMembers.$inferSelect;

export type NewOrganizationMember = typeof organizationMembers.$inferInsert;
