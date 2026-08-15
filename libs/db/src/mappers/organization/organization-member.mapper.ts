// libs/db/src/mappers/organization/organization-member.mapper.ts

import { OrganizationMemberStatus } from '../../schema/organization/organization-member.table';

import type {
  NewOrganizationMember,
  OrganizationMember,
  OrganizationMemberStatus as OrganizationMemberStatusType,
} from '../../schema/organization/organization-member.table';

/**
 * Persistence-neutral representation of an organization membership.
 *
 * A membership establishes that a user belongs to an organization.
 *
 * Authorization roles are intentionally not represented here.
 * Organization roles are assigned separately through
 * organization_member_roles.
 */
export interface OrganizationMemberRecord {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly status: OrganizationMemberStatusType;
  readonly addedByUserId?: string;
  readonly joinedAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Input used when creating an organization membership.
 *
 * organizationId + userId identify the membership relationship.
 *
 * Role assignment is intentionally separate and must be performed through
 * the authorization layer.
 */
export interface CreateOrganizationMemberRecord {
  readonly organizationId: string;
  readonly userId: string;
  readonly status?: OrganizationMemberStatusType;
  readonly addedByUserId?: string;
}

/**
 * Mutable organization-membership properties.
 *
 * organizationId and userId are intentionally excluded because changing
 * either would change the identity of the membership itself.
 */
export interface UpdateOrganizationMemberRecord {
  readonly status?: OrganizationMemberStatusType;
}

/**
 * Converts a database organization-member row into a persistence-neutral
 * membership record.
 */
export function toOrganizationMemberRecord(
  row: OrganizationMember,
): OrganizationMemberRecord {
  const record: OrganizationMemberRecord = {
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId,
    status: toOrganizationMemberStatus(row.status),
    joinedAt: row.joinedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...(row.addedByUserId
      ? {
          addedByUserId: row.addedByUserId,
        }
      : {}),
  };

  return record;
}

/**
 * Converts membership creation input into a database insert row.
 *
 * Database-generated fields such as:
 *
 *   id
 *   joinedAt
 *   createdAt
 *   updatedAt
 *
 * are intentionally omitted so database defaults remain authoritative.
 */
export function toNewOrganizationMemberRow(
  input: CreateOrganizationMemberRecord,
): NewOrganizationMember {
  return {
    organizationId: input.organizationId,
    userId: input.userId,
    status: input.status ?? OrganizationMemberStatus.Active,
    ...(input.addedByUserId
      ? {
          addedByUserId: input.addedByUserId,
        }
      : {}),
  };
}

/**
 * Converts a partial organization-membership mutation into fields suitable
 * for a Drizzle update.
 *
 * updatedAt is intentionally excluded. The repository should attach the
 * mutation timestamp when performing the database update.
 */
export function toOrganizationMemberUpdateRow(
  input: UpdateOrganizationMemberRecord,
): Partial<Pick<NewOrganizationMember, 'status'>> {
  const values: Partial<Pick<NewOrganizationMember, 'status'>> = {};

  if (input.status !== undefined) {
    values.status = input.status;
  }

  return values;
}

/**
 * Returns whether an organization membership currently grants membership
 * participation.
 *
 * This does not determine whether the user has a specific permission.
 * Authorization still resolves through:
 *
 *   organization_members
 *       ↓
 *   organization_member_roles
 *       ↓
 *   roles
 *       ↓
 *   role_permissions
 *       ↓
 *   permissions
 */
export function isActiveOrganizationMember(
  member: OrganizationMember | OrganizationMemberRecord,
): boolean {
  return member.status === OrganizationMemberStatus.Active;
}

/**
 * Returns whether a membership has been suspended.
 *
 * Suspended memberships remain persisted so membership and role-assignment
 * state can be retained while organization-scoped authorization is denied.
 */
export function isSuspendedOrganizationMember(
  member: OrganizationMember | OrganizationMemberRecord,
): boolean {
  return member.status === OrganizationMemberStatus.Suspended;
}

/**
 * Validates an organization-member status read from persistence.
 *
 * The database constrains this value as well, but validation here prevents
 * invalid persistence state from entering higher layers.
 */
function toOrganizationMemberStatus(
  value: string,
): OrganizationMemberStatusType {
  const statuses: readonly OrganizationMemberStatusType[] = Object.values(
    OrganizationMemberStatus,
  );

  if (statuses.includes(value as OrganizationMemberStatusType)) {
    return value as OrganizationMemberStatusType;
  }

  throw new Error(`Invalid organization member status in database: ${value}`);
}
