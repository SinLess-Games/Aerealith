// libs/db/src/mappers/authorization/role.mapper.ts

import type { CreateRoleRecord, Role } from '@aerealith-ai/authorization';

import type {
  NewRoleRow,
  RoleRow,
} from '../../schema/authorization/authorization.table';
import type { PermissionScope } from '../../schema/authorization/permissions';

/**
 * The normalized role table no longer persists these legacy domain-level
 * properties directly.
 *
 * Until the authorization domain model is updated to match the normalized
 * persistence model, they are projected deterministically here.
 */
const ROLE_ENABLED = true;
const ROLE_ASSIGNABLE = true;

const ADMINISTRATIVE_RANK = {
  Custom: 0,
  OrganizationSystem: 50,
  PlatformSystem: 100,
} as const;

export interface NewRoleMappingOptions {
  /**
   * Authorization boundary in which the role may be assigned.
   */
  readonly scope: PermissionScope;

  /**
   * Whether this role should automatically be assigned when a new member is
   * provisioned within its scope.
   *
   * Platform roles should not be default roles.
   */
  readonly isDefault?: boolean;
}

export interface RoleUpdateMappingOptions {
  /**
   * Supply this only when intentionally moving/changing the role scope.
   *
   * Scope should never be inferred from the role slug.
   */
  readonly scope?: PermissionScope;

  /**
   * Supply this only when intentionally changing default-role behavior.
   */
  readonly isDefault?: boolean;
}

/**
 * Converts a database role row into the transport-neutral authorization
 * domain representation.
 *
 * Database representation:
 *
 *   id
 *   name
 *   slug
 *   scope
 *   description
 *   isSystem
 *   isDefault
 *   createdAt
 *   updatedAt
 *
 * Current authorization domain representation additionally expects:
 *
 *   key
 *   displayName
 *   system
 *   assignable
 *   administrativeRank
 *   enabled
 *
 * Those compatibility properties are projected here rather than leaking
 * persistence differences into repositories.
 */
export function toRole(row: RoleRow): Role {
  return {
    id: row.id,

    key: row.slug,

    displayName: row.name,

    ...(row.description
      ? {
          description: row.description,
        }
      : {}),

    system: row.isSystem,

    assignable: ROLE_ASSIGNABLE,

    administrativeRank: roleAdministrativeRank(row),

    enabled: ROLE_ENABLED,

    createdAt: row.createdAt,

    updatedAt: row.updatedAt,
  };
}

/**
 * Converts a role creation record into a database insert row.
 *
 * Scope is intentionally explicit.
 *
 * Do not infer role scope from role names or slugs. A role named "admin",
 * for example, is not enough information to decide whether it is a platform
 * administrator or organization administrator.
 */
export function toNewRoleRow(
  input: CreateRoleRecord,
  options: NewRoleMappingOptions,
): NewRoleRow {
  assertValidDefaultRole(options.scope, options.isDefault ?? false);

  return {
    name: normalizeRoleName(input.displayName),

    slug: normalizeRoleSlug(input.key),

    scope: options.scope,

    ...(input.description !== undefined
      ? {
          description: input.description,
        }
      : {}),

    isSystem: input.system,

    isDefault: options.isDefault ?? false,
  };
}

/**
 * Converts a partial authorization-domain role update into fields suitable
 * for updating the normalized roles table.
 *
 * updatedAt is intentionally not included. Mutation timestamps belong to
 * repository/database mutation logic rather than domain mapping.
 */
export function toRoleUpdateRow(
  input: Partial<CreateRoleRecord>,
  options: RoleUpdateMappingOptions = {},
): Partial<Omit<NewRoleRow, 'id' | 'createdAt' | 'updatedAt'>> {
  const values: Partial<Omit<NewRoleRow, 'id' | 'createdAt' | 'updatedAt'>> =
    {};

  if (input.displayName !== undefined) {
    values.name = normalizeRoleName(input.displayName);
  }

  if (input.key !== undefined) {
    values.slug = normalizeRoleSlug(input.key);
  }

  if (input.description !== undefined) {
    values.description = input.description;
  }

  if (input.system !== undefined) {
    values.isSystem = input.system;
  }

  if (options.scope !== undefined) {
    values.scope = options.scope;
  }

  if (options.isDefault !== undefined) {
    if (options.scope !== undefined) {
      assertValidDefaultRole(options.scope, options.isDefault);
    }

    values.isDefault = options.isDefault;
  }

  return values;
}

/**
 * Calculates the compatibility administrative rank expected by the current
 * authorization domain.
 *
 * This value is not persisted by the normalized role schema.
 */
export function roleAdministrativeRank(
  row: Pick<RoleRow, 'scope' | 'isSystem'>,
): number {
  if (!row.isSystem) {
    return ADMINISTRATIVE_RANK.Custom;
  }

  if (row.scope === 'platform') {
    return ADMINISTRATIVE_RANK.PlatformSystem;
  }

  return ADMINISTRATIVE_RANK.OrganizationSystem;
}

/**
 * Normalizes the stable role slug used by persistence.
 *
 * Examples:
 *
 *   "Super Admin"
 *       -> "super-admin"
 *
 *   " SUPPORT_ENGINEER "
 *       -> "support-engineer"
 */
export function normalizeRoleSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Role names are presentation-oriented, so casing is preserved.
 */
function normalizeRoleName(value: string): string {
  return value.trim();
}

/**
 * Platform roles must never be implicit/default assignments.
 *
 * This mirrors the database invariant while also failing earlier at the
 * mapper boundary.
 */
function assertValidDefaultRole(
  scope: PermissionScope,
  isDefault: boolean,
): void {
  if (scope === 'platform' && isDefault) {
    throw new Error('Platform roles cannot be default roles.');
  }
}
