import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
};

export const permissionsTable = pgTable(
  'permissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    key: varchar('key', { length: 160 }).notNull(),
    resource: varchar('resource', { length: 80 }).notNull(),
    action: varchar('action', { length: 80 }).notNull(),
    displayName: varchar('display_name', { length: 160 }).notNull(),
    description: text('description'),
    system: boolean('system').default(false).notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('permissions_key_unique').on(table.key),
    index('permissions_resource_action_index').on(table.resource, table.action),
    check(
      'permissions_key_format_check',
      sql`${table.key} ~ '^[a-z][a-z0-9_-]*(\\.[a-z][a-z0-9_-]*)+$'`,
    ),
  ],
);

export const rolesTable = pgTable(
  'roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    key: varchar('key', { length: 100 }).notNull(),
    displayName: varchar('display_name', { length: 160 }).notNull(),
    description: text('description'),
    system: boolean('system').default(false).notNull(),
    assignable: boolean('assignable').default(true).notNull(),
    administrativeRank: integer('administrative_rank').default(0).notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('roles_key_unique').on(table.key),
    check(
      'roles_administrative_rank_check',
      sql`${table.administrativeRank} >= 0`,
    ),
  ],
);

export const rolePermissionsTable = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => rolesTable.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissionsTable.id, { onDelete: 'cascade' }),
    assignedBy: varchar('assigned_by', { length: 160 }).notNull(),
    assignedAt: timestamp('assigned_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      name: 'role_permissions_primary_key',
      columns: [table.roleId, table.permissionId],
    }),
    index('role_permissions_permission_id_index').on(table.permissionId),
  ],
);

export const roleInheritanceTable = pgTable(
  'role_inheritance',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => rolesTable.id, { onDelete: 'cascade' }),
    parentRoleId: uuid('parent_role_id')
      .notNull()
      .references(() => rolesTable.id, { onDelete: 'cascade' }),
    createdBy: varchar('created_by', { length: 160 }).notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      name: 'role_inheritance_primary_key',
      columns: [table.roleId, table.parentRoleId],
    }),
    index('role_inheritance_parent_role_id_index').on(table.parentRoleId),
    check(
      'role_inheritance_no_self_reference_check',
      sql`${table.roleId} <> ${table.parentRoleId}`,
    ),
  ],
);

export const principalRolesTable = pgTable(
  'principal_roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    principalType: varchar('principal_type', { length: 20 }).notNull(),
    principalId: varchar('principal_id', { length: 160 }).notNull(),
    roleId: uuid('role_id')
      .notNull()
      .references(() => rolesTable.id, { onDelete: 'restrict' }),
    scopeType: varchar('scope_type', { length: 32 }).notNull(),
    scopeId: varchar('scope_id', { length: 160 }),
    assignedBy: varchar('assigned_by', { length: 160 }).notNull(),
    assignedAt: timestamp('assigned_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
    revokedBy: varchar('revoked_by', { length: 160 }),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
    revocationReason: text('revocation_reason'),
    metadata: jsonb('metadata')
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    activeKey: varchar('active_key', { length: 560 }),
  },
  (table) => [
    uniqueIndex('principal_roles_active_key_unique').on(table.activeKey),
    index('principal_roles_principal_index').on(
      table.principalType,
      table.principalId,
    ),
    index('principal_roles_role_id_index').on(table.roleId),
    index('principal_roles_expires_at_index').on(table.expiresAt),
    check(
      'principal_roles_principal_type_check',
      sql`${table.principalType} in ('user', 'service')`,
    ),
    check(
      'principal_roles_scope_type_check',
      sql`${table.scopeType} in ('global', 'organization', 'workspace', 'project', 'discord_guild', 'resource')`,
    ),
    check(
      'principal_roles_global_scope_check',
      sql`(${table.scopeType} = 'global' and ${table.scopeId} is null) or (${table.scopeType} <> 'global' and ${table.scopeId} is not null)`,
    ),
  ],
);

export const roleConflictsTable = pgTable(
  'role_conflicts',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => rolesTable.id, { onDelete: 'cascade' }),
    conflictingRoleId: uuid('conflicting_role_id')
      .notNull()
      .references(() => rolesTable.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    createdBy: varchar('created_by', { length: 160 }).notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      name: 'role_conflicts_primary_key',
      columns: [table.roleId, table.conflictingRoleId],
    }),
    check(
      'role_conflicts_no_self_reference_check',
      sql`${table.roleId} <> ${table.conflictingRoleId}`,
    ),
  ],
);

export const principalAuthorizationVersionsTable = pgTable(
  'principal_authorization_versions',
  {
    principalType: varchar('principal_type', { length: 20 }).notNull(),
    principalId: varchar('principal_id', { length: 160 }).notNull(),
    version: integer('version').default(1).notNull(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      name: 'principal_authorization_versions_primary_key',
      columns: [table.principalType, table.principalId],
    }),
    check(
      'principal_authorization_versions_principal_type_check',
      sql`${table.principalType} in ('user', 'service')`,
    ),
    check(
      'principal_authorization_versions_version_check',
      sql`${table.version} > 0`,
    ),
  ],
);

export type PermissionRow = typeof permissionsTable.$inferSelect;
export type RoleRow = typeof rolesTable.$inferSelect;
export type PrincipalRoleRow = typeof principalRolesTable.$inferSelect;
