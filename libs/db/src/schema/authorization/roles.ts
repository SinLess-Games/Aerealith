// libs/db/src/schema/authorization/roles.ts

import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import {
  PermissionScope,
  type PermissionScope as PermissionScopeType,
} from './permissions';

/**
 * Authorization roles.
 *
 * Roles are named collections of permissions.
 *
 * Examples:
 *
 * Platform:
 *
 *   super-admin
 *   platform-admin
 *   support-engineer
 *   security-auditor
 *   billing-admin
 *
 * Organization:
 *
 *   owner
 *   admin
 *   manager
 *   member
 *   viewer
 *
 * Application code should authorize against permissions rather than
 * directly checking these role names.
 *
 * Example:
 *
 *   Good:
 *
 *     authorization.can('organization.member.invite')
 *
 *   Avoid:
 *
 *     user.role === 'admin'
 */
export const roles = pgTable(
  'roles',
  {
    /**
     * Internal role identifier.
     *
     * Assignments and role-permission relationships should reference
     * this UUID.
     */
    id: uuid('id').defaultRandom().primaryKey(),

    /**
     * Human-readable role name.
     *
     * Examples:
     *
     *   Super Administrator
     *   Support Engineer
     *   Organization Owner
     */
    name: varchar('name', {
      length: 100,
    }).notNull(),

    /**
     * Stable machine-readable identifier.
     *
     * Examples:
     *
     *   super-admin
     *   support-engineer
     *   owner
     *   member
     *
     * Authorization logic should generally operate on permissions rather
     * than this slug. The slug is useful for seeding, administration,
     * defaults, and role assignment.
     */
    slug: varchar('slug', {
      length: 100,
    }).notNull(),

    /**
     * Defines where this role may be assigned.
     *
     * Platform roles control Aerealith itself.
     *
     * Organization roles control resources inside an organization or
     * workspace.
     */
    scope: varchar('scope', {
      length: 32,
    })
      .$type<PermissionScopeType>()
      .notNull(),

    /**
     * Human-readable explanation of the role's purpose.
     *
     * This can be displayed in administrative interfaces when assigning
     * roles to users or organization members.
     */
    description: text('description'),

    /**
     * Marks roles owned by Aerealith.
     *
     * System roles should not normally be renamed or deleted through
     * customer-facing APIs.
     *
     * Examples:
     *
     *   super-admin
     *   platform-admin
     *   owner
     *   member
     */
    isSystem: boolean('is_system').default(false).notNull(),

    /**
     * Indicates that the role may be assigned automatically.
     *
     * For example, a new organization member could automatically receive
     * the organization "member" role.
     *
     * Platform roles should generally never be marked as default.
     */
    isDefault: boolean('is_default').default(false).notNull(),

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
     * A role slug is unique within its authorization scope.
     *
     * This allows:
     *
     *   platform.super-admin
     *   organization.owner
     *
     * without requiring the scope to be repeated inside the slug itself.
     */
    uniqueIndex('roles_scope_slug_unique').on(table.scope, table.slug),

    /**
     * Useful when listing roles available for a particular authorization
     * boundary.
     */
    index('roles_scope_idx').on(table.scope),

    /**
     * Useful for administration interfaces and system-role filtering.
     */
    index('roles_scope_system_idx').on(table.scope, table.isSystem),

    /**
     * Keep role scope values aligned with permission scope values without
     * introducing a database enum dependency.
     */
    check(
      'roles_scope_check',
      sql`${table.scope} in (${PermissionScope.Platform}, ${PermissionScope.Organization})`,
    ),

    /**
     * Platform roles must never be automatically assigned.
     *
     * This prevents a configuration error from accidentally making a
     * privileged platform role a default role.
     */
    check(
      'roles_platform_not_default_check',
      sql`${table.scope} <> ${PermissionScope.Platform} or ${table.isDefault} = false`,
    ),
  ],
);

export type Role = typeof roles.$inferSelect;

export type NewRole = typeof roles.$inferInsert;
