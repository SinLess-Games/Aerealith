// libs/db/src/schema/authorization/authorization.table.ts

import { sql } from 'drizzle-orm';

import {
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { organizationMemberRoles } from './organization-member-role';
import { permissions } from './permissions';
import { platformRoleAssignments } from './platform-role-assignment';
import { rolePermissions } from './role-permissions';
import { roles } from './roles';

/**
 * Authorization schema exports.
 *
 * The primary authorization tables are defined in dedicated schema files:
 *
 *   permissions.ts
 *   roles.ts
 *   role-permissions.ts
 *   platform-role-assignment.ts
 *   organization-member-role.ts
 *
 * This file exposes consistent *Table aliases for consumers of the
 * database package and defines the remaining supporting authorization
 * tables such as role inheritance, role conflicts, and authorization
 * version tracking.
 */

/**
 * Individual capabilities recognized by the authorization system.
 */
export const permissionsTable = permissions;

/**
 * Named collections of permissions.
 */
export const rolesTable = roles;

/**
 * Many-to-many relationship between roles and permissions.
 */
export const rolePermissionsTable = rolePermissions;

/**
 * Platform-level role assignments for users.
 *
 * Examples:
 *
 *   super-admin
 *   platform-admin
 *   support-engineer
 *   security-auditor
 */
export const platformRoleAssignmentsTable = platformRoleAssignments;

/**
 * Organization-scoped role assignments.
 *
 * These assignments operate through an organization membership rather
 * than directly against the global user identity.
 */
export const organizationMemberRolesTable = organizationMemberRoles;

/**
 * Role inheritance.
 *
 * Allows one role to inherit the permissions granted by another role.
 *
 * Example:
 *
 *   platform-admin
 *        ↓
 *   support-engineer
 *
 * A platform administrator could therefore receive all permissions from
 * the support-engineer role in addition to its own permissions.
 *
 * Recursive hierarchy validation belongs in the authorization service.
 */
export const roleInheritanceTable = pgTable(
  'role_inheritance',
  {
    /**
     * Child role receiving inherited permissions.
     */
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    /**
     * Parent role whose permissions are inherited.
     */
    parentRoleId: uuid('parent_role_id')
      .notNull()
      .references(() => roles.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    /**
     * Actor responsible for creating the inheritance relationship.
     *
     * This remains a generic actor identifier because authorization
     * mutations may eventually be initiated by users, services, or
     * trusted system processes.
     */
    createdBy: varchar('created_by', {
      length: 160,
    }).notNull(),

    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    /**
     * The same inheritance relationship may only exist once.
     */
    primaryKey({
      name: 'role_inheritance_primary_key',
      columns: [table.roleId, table.parentRoleId],
    }),

    /**
     * Supports reverse traversal:
     *
     *   "Which roles inherit from this parent?"
     */
    index('role_inheritance_parent_role_id_index').on(table.parentRoleId),

    /**
     * A role cannot directly inherit from itself.
     *
     * Longer cycles such as:
     *
     *   A -> B -> C -> A
     *
     * must still be rejected by the authorization service.
     */
    check(
      'role_inheritance_no_self_reference_check',
      sql`${table.roleId} <> ${table.parentRoleId}`,
    ),
  ],
);

/**
 * Defines mutually incompatible roles.
 *
 * This supports separation-of-duty policies where two roles should never
 * be assigned to the same principal within the relevant authorization
 * boundary.
 *
 * Example:
 *
 *   billing-approver
 *
 * may conflict with:
 *
 *   billing-auditor
 *
 * Conflict enforcement belongs in the authorization service because
 * assignment scope and contextual authorization rules may also matter.
 */
export const roleConflictsTable = pgTable(
  'role_conflicts',
  {
    /**
     * First role participating in the conflict.
     */
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    /**
     * Role that conflicts with roleId.
     */
    conflictingRoleId: uuid('conflicting_role_id')
      .notNull()
      .references(() => roles.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    /**
     * Human-readable explanation of why these roles conflict.
     */
    reason: text('reason').notNull(),

    /**
     * Actor responsible for defining the conflict.
     */
    createdBy: varchar('created_by', {
      length: 160,
    }).notNull(),

    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    /**
     * Prevent duplicate conflict relationships in the same direction.
     *
     * The authorization service should normalize role pairs before
     * insertion so:
     *
     *   A -> B
     *
     * and:
     *
     *   B -> A
     *
     * are not both persisted.
     */
    primaryKey({
      name: 'role_conflicts_primary_key',
      columns: [table.roleId, table.conflictingRoleId],
    }),

    /**
     * Supports reverse conflict lookup.
     */
    index('role_conflicts_conflicting_role_id_index').on(
      table.conflictingRoleId,
    ),

    /**
     * A role cannot conflict with itself.
     */
    check(
      'role_conflicts_no_self_reference_check',
      sql`${table.roleId} <> ${table.conflictingRoleId}`,
    ),
  ],
);

/**
 * Authorization version tracking.
 *
 * Authorization decisions may be cached. Whenever authorization-affecting
 * state changes for a principal, this version should be incremented.
 *
 * Cached authorization can then include:
 *
 *   principal type
 *   principal id
 *   authorization version
 *
 * If the persisted version changes, previously cached authorization is
 * considered stale.
 *
 * This table does NOT grant roles or permissions. It only tracks mutation
 * versions for cache invalidation.
 */
export const principalAuthorizationVersionsTable = pgTable(
  'principal_authorization_versions',
  {
    /**
     * Kind of principal whose authorization version is being tracked.
     *
     * Aerealith currently recognizes users and services.
     */
    principalType: varchar('principal_type', {
      length: 20,
    }).notNull(),

    /**
     * Identifier of the principal.
     *
     * This intentionally remains varchar rather than UUID because not
     * every future principal type is required to use a database UUID.
     */
    principalId: varchar('principal_id', {
      length: 160,
    }).notNull(),

    /**
     * Monotonically increasing authorization version.
     */
    version: integer('version').default(1).notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    /**
     * Each principal owns exactly one authorization version counter.
     */
    primaryKey({
      name: 'principal_authorization_versions_primary_key',
      columns: [table.principalType, table.principalId],
    }),

    /**
     * Only supported principal types may receive authorization-version
     * records.
     */
    check(
      'principal_authorization_versions_principal_type_check',
      sql`${table.principalType} in ('user', 'service')`,
    ),

    /**
     * Authorization versions are always positive.
     */
    check(
      'principal_authorization_versions_version_check',
      sql`${table.version} > 0`,
    ),
  ],
);

/**
 * Permission row types.
 */
export type PermissionRow = typeof permissionsTable.$inferSelect;

export type NewPermissionRow = typeof permissionsTable.$inferInsert;

/**
 * Role row types.
 */
export type RoleRow = typeof rolesTable.$inferSelect;

export type NewRoleRow = typeof rolesTable.$inferInsert;

/**
 * Role-permission relationship row types.
 */
export type RolePermissionRow = typeof rolePermissionsTable.$inferSelect;

export type NewRolePermissionRow = typeof rolePermissionsTable.$inferInsert;

/**
 * Platform role assignment row types.
 */
export type PlatformRoleAssignmentRow =
  typeof platformRoleAssignmentsTable.$inferSelect;

export type NewPlatformRoleAssignmentRow =
  typeof platformRoleAssignmentsTable.$inferInsert;

/**
 * Organization member role assignment row types.
 */
export type OrganizationMemberRoleRow =
  typeof organizationMemberRolesTable.$inferSelect;

export type NewOrganizationMemberRoleRow =
  typeof organizationMemberRolesTable.$inferInsert;

/**
 * Role inheritance row types.
 */
export type RoleInheritanceRow = typeof roleInheritanceTable.$inferSelect;

export type NewRoleInheritanceRow = typeof roleInheritanceTable.$inferInsert;

/**
 * Role conflict row types.
 */
export type RoleConflictRow = typeof roleConflictsTable.$inferSelect;

export type NewRoleConflictRow = typeof roleConflictsTable.$inferInsert;

/**
 * Authorization-version row types.
 */
export type PrincipalAuthorizationVersionRow =
  typeof principalAuthorizationVersionsTable.$inferSelect;

export type NewPrincipalAuthorizationVersionRow =
  typeof principalAuthorizationVersionsTable.$inferInsert;
