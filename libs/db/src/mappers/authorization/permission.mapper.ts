// libs/db/src/mappers/authorization/permission.mapper.ts

import type {
  CreatePermissionRecord,
  Permission,
} from '@aerealith-ai/authorization';

import type {
  NewPermissionRow,
  PermissionRow,
} from '../../schema/authorization/authorization.table';
import type { PermissionScope } from '../../schema/authorization/permissions';

/**
 * The current authorization domain still exposes an enabled flag while the
 * normalized permissions table represents every persisted permission as an
 * enabled permission.
 *
 * If permission disabling is added back to persistence later, this projection
 * should be replaced with the actual database value.
 */
const PERMISSION_ENABLED = true;

/**
 * Converts a database permission row into the transport-neutral authorization
 * domain model.
 *
 * The database stores:
 *
 *   key
 *   scope
 *   resource
 *   action
 *   description
 *   isSystem
 *
 * The current authorization domain additionally expects:
 *
 *   displayName
 *   enabled
 *
 * displayName is derived deterministically from the stable permission key.
 * enabled is projected as true because the normalized schema currently has no
 * disabled-permission state.
 */
export function toPermission(row: PermissionRow): Permission {
  return {
    id: row.id,

    key: row.key,

    resource: row.resource,

    action: row.action,

    displayName: permissionDisplayName(row.key),

    ...(row.description
      ? {
          description: row.description,
        }
      : {}),

    system: row.isSystem,

    enabled: PERMISSION_ENABLED,

    createdAt: row.createdAt,

    updatedAt: row.updatedAt,
  };
}

/**
 * Converts an authorization permission creation record into a database
 * insert row.
 *
 * Permission scope is supplied explicitly rather than inferred here.
 *
 * Scope determination is an authorization/business concern and should happen
 * before the persistence mapper is called.
 */
export function toNewPermissionRow(
  input: CreatePermissionRecord,
  scope: PermissionScope,
): NewPermissionRow {
  return {
    key: normalizePermissionKey(input.key),

    scope,

    resource: normalizePermissionPart(input.resource),

    action: normalizePermissionPart(input.action),

    ...(input.description !== undefined
      ? {
          description: input.description,
        }
      : {}),

    isSystem: input.system,
  };
}

/**
 * Builds the subset of persisted permission fields that may be updated.
 *
 * The caller is responsible for applying updatedAt because that is mutation
 * metadata rather than permission-domain data.
 *
 * Scope is optional because changing the key does not automatically imply
 * changing authorization scope.
 */
export function toPermissionUpdateRow(
  input: Partial<CreatePermissionRecord>,
  scope?: PermissionScope,
): Partial<Omit<NewPermissionRow, 'id' | 'createdAt' | 'updatedAt'>> {
  const values: Partial<
    Omit<NewPermissionRow, 'id' | 'createdAt' | 'updatedAt'>
  > = {};

  if (input.key !== undefined) {
    values.key = normalizePermissionKey(input.key);
  }

  if (scope !== undefined) {
    values.scope = scope;
  }

  if (input.resource !== undefined) {
    values.resource = normalizePermissionPart(input.resource);
  }

  if (input.action !== undefined) {
    values.action = normalizePermissionPart(input.action);
  }

  if (input.description !== undefined) {
    values.description = input.description;
  }

  if (input.system !== undefined) {
    values.isSystem = input.system;
  }

  return values;
}

/**
 * Generates a human-readable permission label from the stable permission key.
 *
 * Examples:
 *
 *   platform.user.read
 *     -> Platform · User · Read
 *
 *   organization.member.invite
 *     -> Organization · Member · Invite
 *
 *   platform.session.revoke_all
 *     -> Platform · Session · Revoke All
 */
export function permissionDisplayName(key: string): string {
  return normalizePermissionKey(key)
    .split('.')
    .map(humanizePermissionSegment)
    .join(' · ');
}

/**
 * Normalizes a permission key before persistence or presentation.
 */
function normalizePermissionKey(key: string): string {
  return key.trim().toLowerCase();
}

/**
 * Normalizes the resource or action portion of a permission.
 */
function normalizePermissionPart(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Converts a permission-key segment into a readable label.
 */
function humanizePermissionSegment(segment: string): string {
  return segment
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(capitalizeWord)
    .join(' ');
}

function capitalizeWord(word: string): string {
  if (!word) {
    return word;
  }

  return word.charAt(0).toUpperCase() + word.slice(1);
}
