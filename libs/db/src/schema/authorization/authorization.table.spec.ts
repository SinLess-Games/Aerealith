import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import {
  organizationMemberRolesTable,
  permissionsTable,
  platformRoleAssignmentsTable,
  principalAuthorizationVersionsTable,
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
        platformRoleAssignmentsTable,
        organizationMemberRolesTable,
        roleConflictsTable,
        principalAuthorizationVersionsTable,
      ].map((table) => getTableConfig(table).name),
    ).toEqual([
      'permissions',
      'roles',
      'role_permissions',
      'role_inheritance',
      'platform_role_assignments',
      'organization_member_roles',
      'role_conflicts',
      'principal_authorization_versions',
    ]);
  });

  it('enforces unique permission keys and normalized assignment keys', () => {
    expect(
      getTableConfig(permissionsTable).indexes.some(
        (index) => index.config.name === 'permissions_key_unique',
      ),
    ).toBe(true);
    expect(
      getTableConfig(platformRoleAssignmentsTable).primaryKeys.map(
        (key) => key.name,
      ),
    ).toContain('platform_role_assignments_pk');
    expect(
      getTableConfig(organizationMemberRolesTable).primaryKeys.map(
        (key) => key.name,
      ),
    ).toContain('organization_member_roles_pk');
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
