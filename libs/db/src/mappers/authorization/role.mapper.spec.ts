import { describe, expect, it } from 'vitest';

import {
  normalizeRoleSlug,
  roleAdministrativeRank,
  toNewRoleRow,
  toRole,
  toRoleUpdateRow,
} from './role.mapper';

const createdAt = new Date('2026-08-13T12:00:00.000Z');
const updatedAt = new Date('2026-08-13T13:00:00.000Z');

function createRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'role-1',
    name: 'Platform Administrator',
    slug: 'platform-admin',
    scope: 'platform',
    description: 'Administrates the platform.',
    isSystem: true,
    isDefault: false,
    createdAt,
    updatedAt,
    ...overrides,
  } as never;
}

describe('role mapper', () => {
  it('maps normalized rows with compatibility properties', () => {
    expect(toRole(createRow())).toEqual({
      id: 'role-1',
      key: 'platform-admin',
      displayName: 'Platform Administrator',
      description: 'Administrates the platform.',
      system: true,
      assignable: true,
      administrativeRank: 100,
      enabled: true,
      createdAt,
      updatedAt,
    });
    expect(toRole(createRow({ description: null }))).not.toHaveProperty(
      'description',
    );
  });

  it.each([
    [{ scope: 'platform', isSystem: true }, 100],
    [{ scope: 'organization', isSystem: true }, 50],
    [{ scope: 'organization', isSystem: false }, 0],
  ])('projects administrative rank for %j', (row, expected) => {
    expect(roleAdministrativeRank(row as never)).toBe(expected);
  });

  it('normalizes role inserts and organization defaults', () => {
    expect(
      toNewRoleRow(
        {
          key: ' SUPPORT_ENGINEER ',
          displayName: ' Support Engineer ',
          description: 'Support access.',
          system: true,
          assignable: true,
          administrativeRank: 10,
          enabled: true,
        },
        { scope: 'organization', isDefault: true },
      ),
    ).toEqual({
      name: 'Support Engineer',
      slug: 'support-engineer',
      scope: 'organization',
      description: 'Support access.',
      isSystem: true,
      isDefault: true,
    });
    expect(normalizeRoleSlug(' --SUPER__Admin-- ')).toBe('super-admin');
  });

  it('rejects default platform roles on inserts and explicit updates', () => {
    const input = {
      key: 'member',
      displayName: 'Member',
      system: true,
      assignable: true,
      administrativeRank: 0,
      enabled: true,
    };
    expect(() =>
      toNewRoleRow(input, { scope: 'platform', isDefault: true }),
    ).toThrow('Platform roles cannot be default roles.');
    expect(() =>
      toRoleUpdateRow({}, { scope: 'platform', isDefault: true }),
    ).toThrow('Platform roles cannot be default roles.');
  });

  it('maps only supplied role updates', () => {
    expect(toRoleUpdateRow({})).toEqual({});
    expect(
      toRoleUpdateRow(
        {
          key: ' Team_Manager ',
          displayName: ' Team Manager ',
          description: 'Manages a team.',
          system: false,
        },
        { scope: 'organization', isDefault: false },
      ),
    ).toEqual({
      name: 'Team Manager',
      slug: 'team-manager',
      description: 'Manages a team.',
      isSystem: false,
      scope: 'organization',
      isDefault: false,
    });
  });
});
