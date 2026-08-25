import { describe, expect, it } from 'vitest';

import { RoleHierarchyCycleError } from './errors';
import type { Role } from './models';
import {
  DefaultAuthorizationScopeMatcher,
  isPermissionKey,
  resolveRoleIds,
} from './utilities';

describe('authorization utilities', () => {
  it('validates namespaced permission keys', () => {
    expect(isPermissionKey('users.read')).toBe(true);
    expect(isPermissionKey('discord.guild.manage')).toBe(true);
    expect(isPermissionKey('Users.Read')).toBe(false);
    expect(isPermissionKey('users')).toBe(false);
  });

  it('matches global and exact scopes only', () => {
    const matcher = new DefaultAuthorizationScopeMatcher();
    expect(
      matcher.matches({ type: 'global' }, { type: 'project', id: 'project-1' }),
    ).toBe(true);
    expect(
      matcher.matches(
        { type: 'project', id: 'project-1' },
        { type: 'project', id: 'project-2' },
      ),
    ).toBe(false);
  });

  it('resolves inheritance and rejects cycles and unknown roles', () => {
    const roles = ['a', 'b', 'c'].map(role);
    expect([...resolveRoleIds(['a'], roles, { a: ['b'], b: ['c'] })]).toEqual([
      'c',
      'b',
      'a',
    ]);
    expect(() => resolveRoleIds(['a'], roles, { a: ['b'], b: ['a'] })).toThrow(
      RoleHierarchyCycleError,
    );
    expect(() => resolveRoleIds(['missing'], roles, {})).toThrow(
      RoleHierarchyCycleError,
    );
    expect(() =>
      resolveRoleIds(['a'], roles, { a: ['b'], b: ['c'] }, 1),
    ).toThrow(RoleHierarchyCycleError);
  });
});

function role(id: string): Role {
  const date = new Date(0);
  return {
    id,
    key: id,
    displayName: id,
    system: false,
    assignable: true,
    administrativeRank: 0,
    enabled: true,
    createdAt: date,
    updatedAt: date,
  };
}
