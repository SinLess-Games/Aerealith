// libs/db/src/queries/authorization/permission.queries.ts

import { and, eq } from 'drizzle-orm';

import {
  permissions,
  type PermissionScope,
} from '../../schema/authorization/permissions';

/**
 * Matches a permission by its canonical permission key.
 *
 * Permission keys are normalized before comparison so callers do not need to
 * duplicate persistence normalization rules.
 *
 * Example:
 *
 *   " Organization.Member.Invite "
 *       -> "organization.member.invite"
 */
export function permissionByKey(key: string) {
  return eq(permissions.key, normalizePermissionIdentifier(key));
}

/**
 * Matches permissions belonging to a specific authorization scope.
 *
 * Supported normalized scopes are:
 *
 *   platform
 *   organization
 */
export function permissionsByScope(scope: PermissionScope) {
  return eq(permissions.scope, scope);
}

/**
 * Matches a permission by its normalized scope/resource/action identity.
 *
 * The database enforces uniqueness across:
 *
 *   scope
 *   resource
 *   action
 *
 * This predicate therefore identifies at most one permission.
 */
export function permissionByScopeResourceAction(
  scope: PermissionScope,
  resource: string,
  action: string,
) {
  return and(
    eq(permissions.scope, scope),
    eq(permissions.resource, normalizePermissionIdentifier(resource)),
    eq(permissions.action, normalizePermissionIdentifier(action)),
  );
}

/**
 * Matches system-defined permissions.
 *
 * System permissions are managed as part of the platform authorization
 * catalog rather than being arbitrary application-created permissions.
 */
export function systemPermissions() {
  return eq(permissions.isSystem, true);
}

/**
 * Matches system-defined permissions within a specific authorization scope.
 */
export function systemPermissionsByScope(scope: PermissionScope) {
  return and(permissionsByScope(scope), systemPermissions());
}

/**
 * Normalizes persisted permission identifiers.
 *
 * The same canonicalization rule currently applies to:
 *
 *   permission keys
 *   resources
 *   actions
 *
 * Keeping this normalization in one function prevents those persistence
 * rules from drifting apart accidentally.
 */
function normalizePermissionIdentifier(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/^\./, '');
}
