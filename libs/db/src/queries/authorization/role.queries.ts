// libs/db/src/queries/authorization/role.queries.ts

import { and, eq } from 'drizzle-orm';

import type { PermissionScope } from '../../schema/authorization/permissions';

import { roles } from '../../schema/authorization/roles';

/**
 * Matches a role by its database identifier.
 */
export function roleById(id: string) {
  return eq(roles.id, id);
}

/**
 * Matches a role by its authorization scope and canonical slug.
 *
 * Role slugs are unique within a scope rather than globally.
 *
 * Examples:
 *
 *   platform / platform-admin
 *   organization / owner
 *   organization / member
 */
export function roleByScopeSlug(scope: PermissionScope, slug: string) {
  return and(eq(roles.scope, scope), eq(roles.slug, normalizeRoleSlug(slug)));
}

/**
 * Matches every role belonging to an authorization scope.
 */
export function rolesByScope(scope: PermissionScope) {
  return eq(roles.scope, scope);
}

/**
 * Matches system-defined roles across all authorization scopes.
 */
export function systemRoles() {
  return eq(roles.isSystem, true);
}

/**
 * Matches system-defined roles belonging to a specific authorization scope.
 */
export function systemRolesByScope(scope: PermissionScope) {
  return and(rolesByScope(scope), systemRoles());
}

/**
 * Matches roles configured as defaults for a specific authorization scope.
 *
 * The schema prevents platform roles from being default roles, so this is
 * primarily intended for organization-scoped role provisioning.
 */
export function defaultRolesByScope(scope: PermissionScope) {
  return and(rolesByScope(scope), eq(roles.isDefault, true));
}

/**
 * Normalizes role slugs using the same canonical representation persisted by
 * the role mapper.
 *
 * Examples:
 *
 *   "Platform Admin"
 *       -> "platform-admin"
 *
 *   " organization_owner "
 *       -> "organization-owner"
 */
function normalizeRoleSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
