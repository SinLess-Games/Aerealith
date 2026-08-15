import { describe, expect, it } from 'vitest';

import { authorizationPermissionSeeds } from '../../seeds/authorization/permissions.seed';
import { authorizationRolePermissionSeeds } from '../../seeds/authorization/role-permissions.seed';
import { PermissionScope } from '../schema/authorization/permissions';

const platformPermissionKeys = authorizationPermissionSeeds
  .filter((permission) => permission.scope === PermissionScope.Platform)
  .map((permission) => permission.key)
  .sort();

describe('canonical authorization role permissions', () => {
  it('grants the platform owner every canonical platform capability', () => {
    const owner = authorizationRolePermissionSeeds.find(
      (mapping) =>
        mapping.scope === PermissionScope.Platform &&
        mapping.roleSlug === 'platform-owner',
    );

    expect(owner).toBeDefined();
    if (!owner) throw new Error('Expected the platform-owner role mapping.');
    expect([...owner.permissionKeys].sort()).toEqual(platformPermissionKeys);
    for (const resource of [
      'settings',
      'user',
      'organization',
      'role',
      'permission',
      'moderation',
      'support',
      'system',
      'feature',
      'audit',
    ]) {
      expect(
        owner.permissionKeys.some((key) =>
          key.startsWith(`platform.${resource}.`),
        ),
      ).toBe(true);
    }
  });

  it('grants the normal platform user no internal administration permission', () => {
    const normalUser = authorizationRolePermissionSeeds.find(
      (mapping) =>
        mapping.scope === PermissionScope.Platform &&
        mapping.roleSlug === 'user',
    );

    expect(normalUser).toBeDefined();
    if (!normalUser)
      throw new Error('Expected the platform user role mapping.');
    expect(normalUser.permissionKeys).toEqual([]);
  });

  it('contains no duplicate canonical platform permissions', () => {
    expect(new Set(platformPermissionKeys).size).toBe(
      platformPermissionKeys.length,
    );
  });
});
