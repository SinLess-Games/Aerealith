// libs/db/src/queries/organization/organization.queries.ts

import { and, eq, isNull } from 'drizzle-orm';

import {
  OrganizationStatus,
  organizationsTable,
  type OrganizationStatus as OrganizationStatusType,
} from '../../schema/organization/organization.table';

/**
 * Builds a query condition for an active organization by ID.
 *
 * An organization is considered active when:
 *
 *   status = "active"
 *   deletedAt IS NULL
 */
export function activeOrganizationById(id: string) {
  return and(
    eq(organizationsTable.id, id),
    eq(organizationsTable.status, OrganizationStatus.Active),
    isNull(organizationsTable.deletedAt),
  );
}

/**
 * Builds a query condition for an active organization by its canonical slug.
 *
 * Soft-deleted, suspended, and archived organizations are excluded.
 */
export function activeOrganizationBySlug(slug: string) {
  return and(
    eq(organizationsTable.slug, normalizeOrganizationSlug(slug)),
    eq(organizationsTable.status, OrganizationStatus.Active),
    isNull(organizationsTable.deletedAt),
  );
}

/**
 * Builds a query condition for an organization by ID.
 *
 * Soft-deleted organizations are included.
 */
export function organizationById(id: string) {
  return eq(organizationsTable.id, id);
}

/**
 * Builds a query condition for an organization by canonical slug.
 *
 * Soft-deleted organizations are included.
 */
export function organizationBySlug(slug: string) {
  return eq(organizationsTable.slug, normalizeOrganizationSlug(slug));
}

/**
 * Builds a query condition for an organization by ID while excluding
 * soft-deleted organizations.
 *
 * Unlike activeOrganizationById(), this condition allows suspended and
 * archived organizations.
 */
export function existingOrganizationById(id: string) {
  return and(
    eq(organizationsTable.id, id),
    isNull(organizationsTable.deletedAt),
  );
}

/**
 * Builds a query condition for an organization by canonical slug while
 * excluding soft-deleted organizations.
 *
 * Suspended and archived organizations are included.
 */
export function existingOrganizationBySlug(slug: string) {
  return and(
    eq(organizationsTable.slug, normalizeOrganizationSlug(slug)),
    isNull(organizationsTable.deletedAt),
  );
}

/**
 * Builds a query condition for organizations with a particular lifecycle
 * status.
 *
 * Soft-deleted organizations are included.
 */
export function organizationsByStatus(status: OrganizationStatusType) {
  return eq(organizationsTable.status, status);
}

/**
 * Builds a query condition for non-deleted organizations with a particular
 * lifecycle status.
 */
export function existingOrganizationsByStatus(status: OrganizationStatusType) {
  return and(
    eq(organizationsTable.status, status),
    isNull(organizationsTable.deletedAt),
  );
}

/**
 * Builds a query condition for every active organization.
 */
export function activeOrganizations() {
  return and(
    eq(organizationsTable.status, OrganizationStatus.Active),
    isNull(organizationsTable.deletedAt),
  );
}

/**
 * Builds a query condition for every organization that has not been
 * soft-deleted.
 *
 * Active, suspended, and archived organizations are included.
 */
export function existingOrganizations() {
  return isNull(organizationsTable.deletedAt);
}

/**
 * Builds a query condition for organizations originally created by a
 * particular user.
 *
 * This is an audit/provenance query only.
 *
 * createdByUserId does NOT indicate current organization ownership.
 * Ownership is determined through organization membership and role
 * assignment.
 *
 * Soft-deleted organizations are included.
 */
export function organizationsCreatedByUserId(userId: string) {
  return eq(organizationsTable.createdByUserId, userId);
}

/**
 * Builds a query condition for non-deleted organizations originally created
 * by a particular user.
 *
 * Active, suspended, and archived organizations are included.
 */
export function existingOrganizationsCreatedByUserId(userId: string) {
  return and(
    eq(organizationsTable.createdByUserId, userId),
    isNull(organizationsTable.deletedAt),
  );
}

/**
 * Builds a query condition for active organizations originally created by a
 * particular user.
 *
 * This should not be used to determine organization ownership.
 */
export function activeOrganizationsCreatedByUserId(userId: string) {
  return and(
    eq(organizationsTable.createdByUserId, userId),
    eq(organizationsTable.status, OrganizationStatus.Active),
    isNull(organizationsTable.deletedAt),
  );
}

/**
 * Builds a query condition for suspended organizations that have not been
 * soft-deleted.
 */
export function suspendedOrganizations() {
  return and(
    eq(organizationsTable.status, OrganizationStatus.Suspended),
    isNull(organizationsTable.deletedAt),
  );
}

/**
 * Builds a query condition for archived organizations that have not been
 * soft-deleted.
 */
export function archivedOrganizations() {
  return and(
    eq(organizationsTable.status, OrganizationStatus.Archived),
    isNull(organizationsTable.deletedAt),
  );
}

/**
 * Normalizes a canonical organization slug before querying.
 *
 * Organization slugs should be stored lower-case, so callers do not need to
 * repeat normalization behavior.
 */
function normalizeOrganizationSlug(slug: string): string {
  return slug.trim().toLowerCase();
}
