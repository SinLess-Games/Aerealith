// libs/db/src/queries/organization/organization-member.queries.ts

import { and, eq } from 'drizzle-orm';

import {
  OrganizationMemberStatus,
  organizationMembers,
  type OrganizationMemberStatus as OrganizationMemberStatusType,
} from '../../schema/organization/organization-member.table';

/**
 * Builds a query condition for an organization membership by its ID.
 *
 * Membership status is not considered.
 */
export function organizationMemberById(id: string) {
  return eq(organizationMembers.id, id);
}

/**
 * Builds a query condition for an active organization membership by ID.
 *
 * Suspended memberships are excluded.
 */
export function activeOrganizationMemberById(id: string) {
  return and(
    eq(organizationMembers.id, id),
    eq(organizationMembers.status, OrganizationMemberStatus.Active),
  );
}

/**
 * Builds a query condition for the membership connecting a specific user
 * to a specific organization.
 *
 * Membership status is not considered.
 *
 * The database guarantees that a user may have only one membership row
 * per organization.
 */
export function organizationMemberByOrganizationAndUser(
  organizationId: string,
  userId: string,
) {
  return and(
    eq(organizationMembers.organizationId, organizationId),
    eq(organizationMembers.userId, userId),
  );
}

/**
 * Builds a query condition for the active membership connecting a specific
 * user to a specific organization.
 *
 * Suspended memberships are excluded.
 *
 * This is one of the primary authorization membership conditions because
 * organization-scoped role assignments should only apply through an active
 * organization membership.
 */
export function activeOrganizationMemberByOrganizationAndUser(
  organizationId: string,
  userId: string,
) {
  return and(
    eq(organizationMembers.organizationId, organizationId),
    eq(organizationMembers.userId, userId),
    eq(organizationMembers.status, OrganizationMemberStatus.Active),
  );
}

/**
 * Builds a query condition for every membership belonging to an
 * organization.
 *
 * Active and suspended memberships are included.
 */
export function organizationMembersByOrganizationId(organizationId: string) {
  return eq(organizationMembers.organizationId, organizationId);
}

/**
 * Builds a query condition for every active membership belonging to an
 * organization.
 *
 * Suspended memberships are excluded.
 */
export function activeOrganizationMembersByOrganizationId(
  organizationId: string,
) {
  return and(
    eq(organizationMembers.organizationId, organizationId),
    eq(organizationMembers.status, OrganizationMemberStatus.Active),
  );
}

/**
 * Builds a query condition for every organization membership belonging to
 * a user.
 *
 * Active and suspended memberships are included.
 *
 * This is useful for administrative and account-management views where the
 * caller needs to see the complete membership history/state.
 */
export function organizationMembersByUserId(userId: string) {
  return eq(organizationMembers.userId, userId);
}

/**
 * Builds a query condition for every active organization membership
 * belonging to a user.
 *
 * This is useful for determining the organizations a user may currently
 * participate in.
 */
export function activeOrganizationMembersByUserId(userId: string) {
  return and(
    eq(organizationMembers.userId, userId),
    eq(organizationMembers.status, OrganizationMemberStatus.Active),
  );
}

/**
 * Builds a query condition for memberships with a particular lifecycle
 * status.
 */
export function organizationMembersByStatus(
  status: OrganizationMemberStatusType,
) {
  return eq(organizationMembers.status, status);
}

/**
 * Builds a query condition for organization memberships with a particular
 * status.
 *
 * Example:
 *
 *   organizationId + suspended
 *
 * can be used by an organization administrator to list suspended members.
 */
export function organizationMembersByOrganizationAndStatus(
  organizationId: string,
  status: OrganizationMemberStatusType,
) {
  return and(
    eq(organizationMembers.organizationId, organizationId),
    eq(organizationMembers.status, status),
  );
}

/**
 * Builds a query condition for active memberships.
 */
export function activeOrganizationMembers() {
  return eq(organizationMembers.status, OrganizationMemberStatus.Active);
}

/**
 * Builds a query condition for suspended memberships.
 *
 * Suspended memberships remain persisted so their role assignments and
 * membership history can be preserved while authorization access is denied.
 */
export function suspendedOrganizationMembers() {
  return eq(organizationMembers.status, OrganizationMemberStatus.Suspended);
}

/**
 * Builds a query condition for memberships originally added by a specific
 * user.
 *
 * This is an audit/provenance query.
 *
 * addedByUserId does not grant authority over the membership and should not
 * be used for authorization decisions.
 */
export function organizationMembersAddedByUserId(addedByUserId: string) {
  return eq(organizationMembers.addedByUserId, addedByUserId);
}

/**
 * Builds a query condition for memberships in a particular organization
 * that were originally added by a specific user.
 *
 * Membership status is not considered.
 */
export function organizationMembersByOrganizationAndAdder(
  organizationId: string,
  addedByUserId: string,
) {
  return and(
    eq(organizationMembers.organizationId, organizationId),
    eq(organizationMembers.addedByUserId, addedByUserId),
  );
}

/**
 * Builds a query condition for active memberships in an organization that
 * were originally added by a specific user.
 */
export function activeOrganizationMembersByOrganizationAndAdder(
  organizationId: string,
  addedByUserId: string,
) {
  return and(
    eq(organizationMembers.organizationId, organizationId),
    eq(organizationMembers.addedByUserId, addedByUserId),
    eq(organizationMembers.status, OrganizationMemberStatus.Active),
  );
}
