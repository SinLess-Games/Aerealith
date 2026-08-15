// libs/db/src/schema/authorization/role-permissions.ts

import {
  index,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { permissions } from './permissions';
import { roles } from './roles';

/**
 * Connects authorization roles to the permissions granted by those roles.
 *
 * A role may contain many permissions, and a permission may be granted
 * through many roles.
 *
 * Example:
 *
 *   organization-admin
 *     -> organization.member.read
 *     -> organization.member.invite
 *     -> organization.member.update
 *     -> organization.agent.read
 *     -> organization.agent.create
 *     -> organization.agent.execute
 *
 * Application authorization should resolve a user's assigned roles into
 * the union of permissions attached through this table.
 */
export const rolePermissions = pgTable(
  'role_permissions',
  {
    /**
     * Role receiving the permission.
     */
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    /**
     * Permission granted to the role.
     */
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    /**
     * When this permission was attached to the role.
     *
     * This is useful for auditing and administration even though the
     * relationship itself does not require a standalone UUID.
     */
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    /**
     * A role may only receive a specific permission once.
     *
     * The composite primary key also makes a separate synthetic UUID
     * unnecessary for this many-to-many relationship.
     */
    primaryKey({
      name: 'role_permissions_pk',
      columns: [table.roleId, table.permissionId],
    }),

    /**
     * The primary key already supports queries beginning with role_id:
     *
     *   WHERE role_id = ?
     *
     * This additional index supports the reverse lookup:
     *
     *   "Which roles grant this permission?"
     */
    index('role_permissions_permission_id_idx').on(table.permissionId),
  ],
);

export type RolePermission = typeof rolePermissions.$inferSelect;

export type NewRolePermission = typeof rolePermissions.$inferInsert;
