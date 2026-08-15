// libs/db/src/queries/authorization/organization-member-role.queries.ts

import { and, eq, gt, isNull, or } from 'drizzle-orm';

import { organizationMemberRoles } from '../../schema/authorization/organization-member-role';

/**
 * Matches every role assignment belonging to an organization membership.
 *
 * This includes both active and expired assignments.
 */
export function organizationMemberRolesByMemberId(
  organizationMemberId: string,
) {
  return eq(organizationMemberRoles.organizationMemberId, organizationMemberId);
}

/**
 * Matches a specific organization-member role assignment.
 *
 * The assignment table uses the composite identity:
 *
 *   organizationMemberId + roleId
 */
export function organizationMemberRole(
  organizationMemberId: string,
  roleId: string,
) {
  return and(
    eq(organizationMemberRoles.organizationMemberId, organizationMemberId),
    eq(organizationMemberRoles.roleId, roleId),
  );
}

/**
 * Matches active role assignments belonging to an organization membership.
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
 *
 * Note that assignment activity alone does not grant organization
 * authorization. The associated organization membership must also be active.
 */
export function activeOrganizationMemberRolesByMemberId(
  organizationMemberId: string,
  now: Date = new Date(),
) {
  return and(
    organizationMemberRolesByMemberId(organizationMemberId),
    activeOrganizationMemberRoleExpiration(now),
  );
}

/**
 * Matches a specific active organization-member role assignment.
 *
 * The caller must separately ensure the corresponding organization
 * membership is active before treating the assignment as authoritative.
 */
export function activeOrganizationMemberRole(
  organizationMemberId: string,
  roleId: string,
  now: Date = new Date(),
) {
  return and(
    organizationMemberRole(organizationMemberId, roleId),
    activeOrganizationMemberRoleExpiration(now),
  );
}

/**
 * Matches organization-member role assignments created by a specific user.
 *
 * assignedByUserId is provenance only and does not itself confer
 * authorization.
 */
export function organizationMemberRolesByAssigner(assignedByUserId: string) {
  return eq(organizationMemberRoles.assignedByUserId, assignedByUserId);
}

/**
 * Matches every organization-member assignment for a specific role.
 *
 * This includes active and expired assignments and may span multiple
 * organizations because roles are currently globally defined by scope.
 */
export function organizationMemberRolesByRoleId(roleId: string) {
  return eq(organizationMemberRoles.roleId, roleId);
}

/**
 * Matches active organization-member assignments for a specific role.
 *
 * Membership activity must still be checked separately.
 */
export function activeOrganizationMemberRolesByRoleId(
  roleId: string,
  now: Date = new Date(),
) {
  return and(
    organizationMemberRolesByRoleId(roleId),
    activeOrganizationMemberRoleExpiration(now),
  );
}

/**
 * Matches assignments that have no expiration or expire after the supplied
 * timestamp.
 */
function activeOrganizationMemberRoleExpiration(now: Date) {
  return or(
    isNull(organizationMemberRoles.expiresAt),
    gt(organizationMemberRoles.expiresAt, now),
  );
}
