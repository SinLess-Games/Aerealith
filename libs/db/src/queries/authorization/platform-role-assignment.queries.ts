// libs/db/src/queries/authorization/platform-role-assignment.queries.ts

import { and, eq, gt, isNull, or } from 'drizzle-orm';

import { platformRoleAssignments } from '../../schema/authorization/platform-role-assignment';

/**
 * Matches every platform-role assignment belonging to a user.
 *
 * This includes both active and expired assignments.
 */
export function platformRoleAssignmentsByUserId(userId: string) {
  return eq(platformRoleAssignments.userId, userId);
}

/**
 * Matches a specific platform-role assignment.
 *
 * The platform-role assignment table uses the composite identity:
 *
 *   userId + roleId
 */
export function platformRoleAssignment(userId: string, roleId: string) {
  return and(
    eq(platformRoleAssignments.userId, userId),
    eq(platformRoleAssignments.roleId, roleId),
  );
}

/**
 * Matches active platform-role assignments belonging to a user.
 *
 * An assignment is active when:
 *
 *   expiresAt IS NULL
 *
 * or:
 *
 *   expiresAt > now
 *
 * Assignments expiring exactly at `now` are considered expired.
 */
export function activePlatformRoleAssignmentsByUserId(
  userId: string,
  now: Date = new Date(),
) {
  return and(
    platformRoleAssignmentsByUserId(userId),
    activePlatformRoleAssignmentExpiration(now),
  );
}

/**
 * Matches a specific active platform-role assignment.
 */
export function activePlatformRoleAssignment(
  userId: string,
  roleId: string,
  now: Date = new Date(),
) {
  return and(
    platformRoleAssignment(userId, roleId),
    activePlatformRoleAssignmentExpiration(now),
  );
}

/**
 * Matches platform-role assignments created by a specific user.
 *
 * assignedByUserId is provenance only. It does not grant authorization to
 * the assigning user.
 */
export function platformRoleAssignmentsByAssigner(assignedByUserId: string) {
  return eq(platformRoleAssignments.assignedByUserId, assignedByUserId);
}

/**
 * Matches every assignment for a particular platform role.
 *
 * This includes active and expired assignments.
 */
export function platformRoleAssignmentsByRoleId(roleId: string) {
  return eq(platformRoleAssignments.roleId, roleId);
}

/**
 * Matches active assignments for a particular platform role.
 */
export function activePlatformRoleAssignmentsByRoleId(
  roleId: string,
  now: Date = new Date(),
) {
  return and(
    platformRoleAssignmentsByRoleId(roleId),
    activePlatformRoleAssignmentExpiration(now),
  );
}

/**
 * Matches assignments that have no expiration or expire after the supplied
 * timestamp.
 */
function activePlatformRoleAssignmentExpiration(now: Date) {
  return or(
    isNull(platformRoleAssignments.expiresAt),
    gt(platformRoleAssignments.expiresAt, now),
  );
}
