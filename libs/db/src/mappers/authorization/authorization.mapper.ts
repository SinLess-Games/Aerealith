// libs/db/src/mappers/authorization/authorization.mapper.ts

import type { RoleAssignment } from '@aerealith-ai/authorization';

import type {
  OrganizationMemberRoleRow,
  PlatformRoleAssignmentRow,
} from '../../schema/authorization/authorization.table';

/**
 * Actor identifier used when an authorization assignment was created by
 * provisioning, migration, seeding, or another trusted system process rather
 * than directly by a user.
 */
const SYSTEM_ACTOR_ID = 'system';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Organization role assignments are persisted against an organization
 * membership.
 *
 * Authorization consumers, however, need both:
 *
 *   userId
 *   organizationId
 *
 * Those values come from joining:
 *
 *   organization_member_roles
 *            ↓
 *   organization_members
 */
export interface OrganizationRoleAssignmentRow extends OrganizationMemberRoleRow {
  organizationId: string;
  userId: string;
}

/**
 * Parsed representation of a synthetic authorization assignment ID.
 *
 * The normalized assignment tables use composite primary keys rather than a
 * standalone assignment UUID, while the current authorization domain expects
 * RoleAssignment.id.
 *
 * We therefore expose deterministic IDs:
 *
 *   platform:<userId>:<roleId>
 *
 *   organization:<organizationMemberId>:<roleId>
 *
 * These identifiers are application identifiers only. They are not database
 * primary-key columns.
 */
export type ParsedAuthorizationAssignmentId =
  | {
      readonly type: 'platform';
      readonly userId: string;
      readonly roleId: string;
    }
  | {
      readonly type: 'organization';
      readonly organizationMemberId: string;
      readonly roleId: string;
    };

/**
 * Converts a platform role-assignment row into the transport-neutral
 * authorization-domain representation.
 *
 * Platform role assignments correspond to the authorization domain's global
 * scope.
 */
export function toPlatformRoleAssignment(
  row: PlatformRoleAssignmentRow,
): RoleAssignment {
  return {
    id: platformRoleAssignmentId(row.userId, row.roleId),

    principal: {
      id: row.userId,
      type: 'user',
    },

    roleId: row.roleId,

    scope: {
      type: 'global',
    },

    assignedBy: row.assignedByUserId ?? SYSTEM_ACTOR_ID,

    assignedAt: row.assignedAt,

    ...(row.expiresAt
      ? {
          expiresAt: row.expiresAt,
        }
      : {}),

    /**
     * The normalized assignment tables currently do not persist arbitrary
     * assignment metadata.
     */
    metadata: {},
  };
}

/**
 * Converts an organization-member role assignment into the transport-neutral
 * authorization-domain representation.
 *
 * The persisted role assignment references an organization membership rather
 * than the user directly. The joined membership row provides both the user and
 * organization authorization boundary.
 */
export function toOrganizationRoleAssignment(
  row: OrganizationRoleAssignmentRow,
): RoleAssignment {
  return {
    id: organizationRoleAssignmentId(row.organizationMemberId, row.roleId),

    principal: {
      id: row.userId,
      type: 'user',
    },

    roleId: row.roleId,

    scope: {
      type: 'organization',
      id: row.organizationId,
    },

    assignedBy: row.assignedByUserId ?? SYSTEM_ACTOR_ID,

    assignedAt: row.assignedAt,

    ...(row.expiresAt
      ? {
          expiresAt: row.expiresAt,
        }
      : {}),

    metadata: {},
  };
}

/**
 * Generates the domain-facing identifier for a platform role assignment.
 */
export function platformRoleAssignmentId(
  userId: string,
  roleId: string,
): string {
  return ['platform', userId, roleId].join(':');
}

/**
 * Generates the domain-facing identifier for an organization role
 * assignment.
 */
export function organizationRoleAssignmentId(
  organizationMemberId: string,
  roleId: string,
): string {
  return ['organization', organizationMemberId, roleId].join(':');
}

/**
 * Parses a domain-facing authorization assignment ID.
 *
 * Returns undefined when the identifier is malformed or references an
 * unsupported assignment type.
 */
export function parseAuthorizationAssignmentId(
  value: string,
): ParsedAuthorizationAssignmentId | undefined {
  const [type, subjectId, roleId, ...remaining] = value.split(':');

  if (remaining.length > 0 || !subjectId || !roleId) {
    return undefined;
  }

  if (!isUuid(subjectId) || !isUuid(roleId)) {
    return undefined;
  }

  if (type === 'platform') {
    return {
      type: 'platform',
      userId: subjectId,
      roleId,
    };
  }

  if (type === 'organization') {
    return {
      type: 'organization',
      organizationMemberId: subjectId,
      roleId,
    };
  }

  return undefined;
}

/**
 * Converts a nullable database actor user ID into the actor identifier
 * expected by the authorization domain.
 *
 * Null means the assignment originated from a trusted system process rather
 * than directly from a user.
 */
export function authorizationActorId(userId: string | null): string {
  return userId ?? SYSTEM_ACTOR_ID;
}

/**
 * Converts an authorization-domain actor identifier into the nullable UUID
 * representation accepted by assignment tables.
 *
 * Non-user actors such as "system" intentionally become null because
 * assignedByUserId is a foreign key to users.
 */
export function toAssignedByUserId(actorId: string): string | null {
  return isUuid(actorId) ? actorId : null;
}

/**
 * Returns whether a string has the UUID shape required by the normalized
 * authorization assignment tables.
 */
export function isAuthorizationUuid(value: string): boolean {
  return isUuid(value);
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
