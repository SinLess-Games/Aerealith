import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import {
  permissionsTable,
  principalAuthorizationVersionsTable,
  principalRolesTable,
  roleConflictsTable,
  roleInheritanceTable,
  rolePermissionsTable,
  rolesTable,
} from './authorization.table';

describe('authorization schema', () => {
  it('defines every normalized RBAC table', () => {
    expect(
      [
        permissionsTable,
        rolesTable,
        rolePermissionsTable,
        roleInheritanceTable,
        principalRolesTable,
        roleConflictsTable,
        principalAuthorizationVersionsTable,
      ].map((table) => getTableConfig(table).name),
    ).toEqual([
      'permissions',
      'roles',
      'role_permissions',
      'role_inheritance',
      'principal_roles',
      'role_conflicts',
      'principal_authorization_versions',
    ]);
  });

  it('enforces unique permission keys and active assignments', () => {
    expect(
      getTableConfig(permissionsTable).indexes.some(
        (index) => index.config.name === 'permissions_key_unique',
      ),
    ).toBe(true);
    expect(
      getTableConfig(principalRolesTable).indexes.some(
        (index) => index.config.name === 'principal_roles_active_key_unique',
      ),
    ).toBe(true);
  });

  it('protects hierarchy and conflict integrity with database constraints', () => {
    expect(
      getTableConfig(roleInheritanceTable).checks.map(
        (constraint) => constraint.name,
      ),
    ).toContain('role_inheritance_no_self_reference_check');
    expect(
      getTableConfig(roleConflictsTable).checks.map(
        (constraint) => constraint.name,
      ),
    ).toContain('role_conflicts_no_self_reference_check');
  });
});
