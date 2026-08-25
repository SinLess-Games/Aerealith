// libs/db/src/queries/authorization/authorization.queries.ts

import { and, eq, or } from 'drizzle-orm';

import {
  principalAuthorizationVersionsTable,
  roleConflictsTable,
  roleInheritanceTable,
  rolePermissionsTable,
} from '../../schema/authorization/authorization.table';

export type AuthorizationPrincipalType = 'user' | 'service';

/**
 * Matches a specific role-permission relationship.
 */
export function rolePermission(roleId: string, permissionId: string) {
  return and(
    eq(rolePermissionsTable.roleId, roleId),
    eq(rolePermissionsTable.permissionId, permissionId),
  );
}

/**
 * Matches every permission relationship belonging to a role.
 */
export function rolePermissionsByRoleId(roleId: string) {
  return eq(rolePermissionsTable.roleId, roleId);
}

/**
 * Matches every role relationship containing a permission.
 */
export function rolePermissionsByPermissionId(permissionId: string) {
  return eq(rolePermissionsTable.permissionId, permissionId);
}

/**
 * Matches direct parent-role relationships for a role.
 */
export function roleParentsByRoleId(roleId: string) {
  return eq(roleInheritanceTable.roleId, roleId);
}

/**
 * Matches roles that directly inherit from a parent role.
 */
export function roleChildrenByParentRoleId(parentRoleId: string) {
  return eq(roleInheritanceTable.parentRoleId, parentRoleId);
}

/**
 * Matches a specific direct role-inheritance relationship.
 */
export function roleInheritance(roleId: string, parentRoleId: string) {
  return and(
    eq(roleInheritanceTable.roleId, roleId),
    eq(roleInheritanceTable.parentRoleId, parentRoleId),
  );
}

/**
 * Matches every conflict involving a role.
 *
 * Role conflicts are treated as symmetric at the query boundary, regardless
 * of which side of the persisted relationship contains the supplied role.
 */
export function roleConflictsByRoleId(roleId: string) {
  return or(
    eq(roleConflictsTable.roleId, roleId),
    eq(roleConflictsTable.conflictingRoleId, roleId),
  );
}

/**
 * Matches a conflict between two roles in either persisted direction.
 */
export function roleConflict(firstRoleId: string, secondRoleId: string) {
  return or(
    and(
      eq(roleConflictsTable.roleId, firstRoleId),
      eq(roleConflictsTable.conflictingRoleId, secondRoleId),
    ),
    and(
      eq(roleConflictsTable.roleId, secondRoleId),
      eq(roleConflictsTable.conflictingRoleId, firstRoleId),
    ),
  );
}

/**
 * Matches the authorization-version record for a principal.
 *
 * Authorization versions allow cached authorization state to be invalidated
 * whenever a principal's effective permissions change.
 */
export function principalAuthorizationVersion(
  principalType: AuthorizationPrincipalType,
  principalId: string,
) {
  return and(
    eq(principalAuthorizationVersionsTable.principalType, principalType),
    eq(principalAuthorizationVersionsTable.principalId, principalId),
  );
}
