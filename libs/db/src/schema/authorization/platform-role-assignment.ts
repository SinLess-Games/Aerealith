// libs/db/src/schema/authorization/platform-role-assignment.ts

import {
  index,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { usersTable as users } from '../user/user.table';
import { roles } from './roles';

/**
 * Assigns platform-scoped roles to Aerealith users.
 *
 * Platform roles operate across the Aerealith platform itself and are
 * intentionally separate from organization/workspace role assignments.
 *
 * Examples:
 *
 *   user
 *     -> super-admin
 *
 *   user
 *     -> platform-admin
 *
 *   user
 *     -> support-engineer
 *
 *   user
 *     -> security-auditor
 *
 * A user may have multiple platform roles.
 *
 * Authorization should ultimately resolve these roles into permissions
 * through the role_permissions table rather than checking role names
 * directly.
 */
export const platformRoleAssignments = pgTable(
  'platform_role_assignments',
  {
    /**
     * User receiving the platform role.
     *
     * Removing the user removes all of their platform role assignments.
     */
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    /**
     * Platform-scoped role assigned to the user.
     *
     * The authorization service must ensure that the referenced role has:
     *
     *   scope = "platform"
     *
     * That rule cannot be cleanly expressed as a simple foreign-key
     * constraint because role scope lives on the roles table.
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
     * This may be null for:
     *
     * - database seeds
     * - bootstrap operations
     * - automated platform provisioning
     *
     * Using SET NULL preserves the assignment's audit metadata if the
     * administrator who created it is later deleted.
     */
    assignedByUserId: uuid('assigned_by_user_id').references(() => users.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),

    /**
     * Time at which this role assignment became active.
     */
    assignedAt: timestamp('assigned_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),

    /**
     * Optional expiration for temporary privileged access.
     *
     * Null means the assignment remains active until explicitly removed.
     *
     * This becomes particularly useful for temporary:
     *
     * - support access
     * - incident response
     * - security investigation access
     * - administrative elevation
     */
    expiresAt: timestamp('expires_at', {
      withTimezone: true,
      mode: 'date',
    }),
  },
  (table) => [
    /**
     * A user may only hold a particular platform role once.
     *
     * This relationship does not require its own UUID because the pair:
     *
     *   userId + roleId
     *
     * uniquely identifies the assignment.
     */
    primaryKey({
      name: 'platform_role_assignments_pk',
      columns: [table.userId, table.roleId],
    }),

    /**
     * Supports reverse lookups such as:
     *
     *   "Which users are Super Administrators?"
     */
    index('platform_role_assignments_role_id_idx').on(table.roleId),

    /**
     * Useful for finding assignments granted by a particular
     * administrator.
     */
    index('platform_role_assignments_assigned_by_user_id_idx').on(
      table.assignedByUserId,
    ),

    /**
     * Useful for maintenance tasks that find temporary assignments that
     * have expired or are approaching expiration.
     */
    index('platform_role_assignments_expires_at_idx').on(table.expiresAt),
  ],
);

export type PlatformRoleAssignment =
  typeof platformRoleAssignments.$inferSelect;

export type NewPlatformRoleAssignment =
  typeof platformRoleAssignments.$inferInsert;
