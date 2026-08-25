import { RoleHierarchyCycleError } from './errors';
import type { AuthorizationScope, Role } from './models';

const PermissionPattern = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/;
export function isPermissionKey(value: string): boolean {
  return value.length <= 128 && PermissionPattern.test(value);
}
export function assertPermissionKey(value: string): void {
  if (!isPermissionKey(value)) throw new Error('Invalid permission key.');
}
export function authorizationCacheKey(
  principalId: string,
  principalType: string,
  version: number,
): string {
  return `authorization:${principalType}:${principalId}:v${version}`;
}
export class DefaultAuthorizationScopeMatcher {
  matches(
    assignment: AuthorizationScope,
    requested: AuthorizationScope,
  ): boolean {
    return (
      assignment.type === 'global' ||
      (assignment.type === requested.type && assignment.id === requested.id)
    );
  }
}
export function resolveRoleIds(
  directRoleIds: readonly string[],
  roles: readonly Role[],
  parents: Readonly<Record<string, readonly string[]>>,
  maximumDepth = 32,
): ReadonlySet<string> {
  const known = new Set(roles.map((role) => role.id));
  const resolved = new Set<string>();
  const visiting = new Set<string>();
  const visit = (id: string, depth: number) => {
    if (depth > maximumDepth || visiting.has(id))
      throw new RoleHierarchyCycleError();
    if (resolved.has(id)) return;
    if (!known.has(id)) throw new RoleHierarchyCycleError();
    visiting.add(id);
    for (const parent of parents[id] ?? []) visit(parent, depth + 1);
    visiting.delete(id);
    resolved.add(id);
  };
  for (const id of directRoleIds) visit(id, 0);
  return resolved;
}
