// libs/db/src/schema/authorization/permissions.ts

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

/**
 * Permission scopes define where a permission is valid.
 *
 * Platform permissions operate across Aerealith itself.
 *
 * Organization permissions are evaluated within a specific
 * organization/workspace context.
 */
export const PermissionScope = {
  Platform: 'platform',
  Organization: 'organization',
} as const;

export type PermissionScope =
  (typeof PermissionScope)[keyof typeof PermissionScope];

/**
 * Authorization permissions.
 *
 * Permissions describe capabilities rather than roles.
 *
 * Examples:
 *
 *   platform.user.read
 *   platform.user.write
 *   platform.session.revoke
 *
 *   organization.member.read
 *   organization.member.invite
 *   organization.member.remove
 *   organization.agent.execute
 *
 * Roles will later be connected to these permissions through
 * the role_permissions join table.
 */
export const permissions = pgTable(
  'permissions',
  {
    /**
     * Internal database identifier.
     *
     * Permission checks should normally use `key` rather than this UUID.
     */
    id: uuid('id').defaultRandom().primaryKey(),

    /**
     * Stable permission identifier used throughout the application.
     *
     * Examples:
     *
     *   platform.user.read
     *   organization.member.invite
     */
    key: varchar('key', {
      length: 160,
    }).notNull(),

    /**
     * The authorization boundary this permission belongs to.
     */
    scope: varchar('scope', {
      length: 32,
    })
      .$type<PermissionScope>()
      .notNull(),

    /**
     * Resource this permission operates on.
     *
     * Examples:
     *
     *   user
     *   member
     *   agent
     *   knowledge
     *   billing
     *   session
     */
    resource: varchar('resource', {
      length: 64,
    }).notNull(),

    /**
     * Action that may be performed against the resource.
     *
     * Examples:
     *
     *   read
     *   create
     *   update
     *   delete
     *   invite
     *   execute
     *   revoke
     */
    action: varchar('action', {
      length: 64,
    }).notNull(),

    /**
     * Human-readable explanation displayed in administration
     * interfaces and documentation.
     */
    description: text('description'),

    /**
     * System permissions are owned by Aerealith and should not
     * normally be renamed or deleted through customer-facing APIs.
     */
    isSystem: boolean('is_system').default(false).notNull(),

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
     * Permission keys are globally unique.
     */
    uniqueIndex('permissions_key_unique').on(table.key),

    /**
     * Prevent duplicate semantic permissions such as two
     * organization/member/invite records.
     */
    uniqueIndex('permissions_scope_resource_action_unique').on(
      table.scope,
      table.resource,
      table.action,
    ),

    /**
     * Frequently useful when resolving or displaying permissions.
     */
    index('permissions_scope_idx').on(table.scope),

    index('permissions_resource_idx').on(table.resource),

    /**
     * Keep the database constrained without introducing a
     * Postgres enum dependency.
     */
    check(
      'permissions_scope_check',
      sql`${table.scope} in ('platform', 'organization')`,
    ),
  ],
);

export type Permission = typeof permissions.$inferSelect;

export type NewPermission = typeof permissions.$inferInsert;
