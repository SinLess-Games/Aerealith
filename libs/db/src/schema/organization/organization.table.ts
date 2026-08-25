// libs/db/src/schema/organization/organization.table.ts

import { sql } from 'drizzle-orm';
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { usersTable as users } from '../user/user.table';

/**
 * Organization lifecycle states.
 *
 * Active organizations operate normally.
 *
 * Suspended organizations remain intact but organization-scoped
 * authorization should deny normal access until the organization is
 * restored.
 *
 * Archived organizations are retained for historical and audit purposes
 * but should not normally accept new activity.
 */
export const OrganizationStatus = {
  Active: 'active',
  Suspended: 'suspended',
  Archived: 'archived',
} as const;

export type OrganizationStatus =
  (typeof OrganizationStatus)[keyof typeof OrganizationStatus];

/**
 * Stores Aerealith organizations/workspaces.
 *
 * Organizations are authorization boundaries containing:
 *
 * - members
 * - organization-scoped roles
 * - agents
 * - knowledge bases
 * - integrations
 * - API resources
 * - billing resources
 *
 * Ownership is intentionally NOT stored directly on this table.
 *
 * The organization owner is represented through:
 *
 *   organizations
 *        ↓
 *   organization_members
 *        ↓
 *   organization_member_roles
 *        ↓
 *   roles
 *
 * This avoids creating two competing authorization models.
 */
export const organizationsTable = pgTable(
  'organizations',
  {
    /**
     * Stable organization identifier.
     */
    id: uuid('id').defaultRandom().primaryKey(),

    /**
     * Human-readable organization name.
     *
     * Examples:
     *
     *   SinLess Games
     *   Acme Corporation
     *   Andy's Workspace
     */
    name: varchar('name', {
      length: 160,
    }).notNull(),

    /**
     * Stable URL-safe organization identifier.
     *
     * Examples:
     *
     *   sinless-games
     *   acme-corporation
     *   andy
     *
     * This may later be used for routes such as:
     *
     *   /organizations/sinless-games
     *
     * or:
     *
     *   /workspace/sinless-games
     */
    slug: varchar('slug', {
      length: 100,
    }).notNull(),

    /**
     * Optional human-readable description.
     */
    description: text('description'),

    /**
     * Current organization lifecycle state.
     */
    status: varchar('status', {
      length: 32,
    })
      .$type<OrganizationStatus>()
      .default(OrganizationStatus.Active)
      .notNull(),

    /**
     * User responsible for creating the organization.
     *
     * IMPORTANT:
     *
     * This is audit/provenance information only.
     *
     * It does NOT mean this user currently owns or administers the
     * organization.
     *
     * Authorization is determined by organization membership and
     * organization role assignments.
     *
     * SET NULL allows the organization to survive if the original creator
     * account is later deleted.
     */
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),

    /**
     * Extensible organization metadata.
     *
     * This is useful for non-authoritative information that does not yet
     * justify a dedicated column or table.
     *
     * Authorization rules should not rely on arbitrary metadata values
     * unless they are explicitly validated by the application.
     */
    metadata: jsonb('metadata')
      .$type<Record<string, unknown>>()
      .default({})
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

    /**
     * Soft-deletion timestamp.
     *
     * Keeping the row allows audit records and historical references to
     * retain their organization relationship.
     */
    deletedAt: timestamp('deleted_at', {
      withTimezone: true,
      mode: 'date',
    }),
  },
  (table) => [
    /**
     * Organization slugs identify organizations globally.
     *
     * If Aerealith later supports organization aliases or custom domains,
     * those should live in separate tables rather than weakening this
     * canonical identifier.
     */
    uniqueIndex('organizations_slug_unique').on(table.slug),

    /**
     * Supports filtering organizations by lifecycle state.
     */
    index('organizations_status_idx').on(table.status),

    /**
     * Useful for administrative/audit queries such as:
     *
     *   "Which organizations did this user originally create?"
     */
    index('organizations_created_by_user_id_idx').on(table.createdByUserId),

    /**
     * Supports administrative ordering and reporting.
     */
    index('organizations_created_at_idx').on(table.createdAt),

    /**
     * Helps queries distinguish active records from soft-deleted
     * organizations.
     */
    index('organizations_deleted_at_idx').on(table.deletedAt),

    /**
     * Enforce recognized lifecycle states at the database boundary.
     */
    check(
      'organizations_status_check',
      sql`${table.status} in ('active', 'suspended', 'archived')`,
    ),

    /**
     * Prevent blank organization names.
     */
    check(
      'organizations_name_not_blank_check',
      sql`length(trim(${table.name})) > 0`,
    ),

    /**
     * Prevent blank canonical slugs.
     */
    check(
      'organizations_slug_not_blank_check',
      sql`length(trim(${table.slug})) > 0`,
    ),
  ],
);

export type OrganizationRow = typeof organizationsTable.$inferSelect;

export type NewOrganizationRow = typeof organizationsTable.$inferInsert;
