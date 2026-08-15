import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { organizationMemberRoles } from './authorization/organization-member-role';
import { PermissionScope, permissions } from './authorization/permissions';
import { platformRoleAssignments } from './authorization/platform-role-assignment';
import { rolePermissions } from './authorization/role-permissions';
import { roles } from './authorization/roles';
import {
  OrganizationMemberStatus,
  organizationMembers,
} from './organization/organization-member.table';
import {
  OrganizationStatus,
  organizationsTable,
} from './organization/organization.table';
import { newsletterRecipientsTable } from './system/newsletter-recipient.table';

describe('normalized authorization and organization schema', () => {
  it('defines each normalized table at the expected database boundary', () => {
    expect(
      [
        permissions,
        roles,
        rolePermissions,
        platformRoleAssignments,
        organizationMemberRoles,
        organizationsTable,
        organizationMembers,
        newsletterRecipientsTable,
      ].map((table) => getTableConfig(table).name),
    ).toEqual([
      'permissions',
      'roles',
      'role_permissions',
      'platform_role_assignments',
      'organization_member_roles',
      'organizations',
      'organization_members',
      'newsletter_recipients',
    ]);
  });

  it('exposes only supported scope and lifecycle values', () => {
    expect(Object.values(PermissionScope)).toEqual([
      'platform',
      'organization',
    ]);
    expect(Object.values(OrganizationStatus)).toEqual([
      'active',
      'suspended',
      'archived',
    ]);
    expect(Object.values(OrganizationMemberStatus)).toEqual([
      'active',
      'suspended',
    ]);
  });

  it('enforces permission and role uniqueness and safe platform defaults', () => {
    const permissionConfig = getTableConfig(permissions);
    expect(permissionConfig.indexes.map((index) => index.config.name)).toEqual(
      expect.arrayContaining([
        'permissions_key_unique',
        'permissions_scope_resource_action_unique',
      ]),
    );
    expect(permissionConfig.checks.map((check) => check.name)).toContain(
      'permissions_scope_check',
    );

    const roleConfig = getTableConfig(roles);
    expect(roleConfig.indexes.map((index) => index.config.name)).toContain(
      'roles_scope_slug_unique',
    );
    expect(roleConfig.checks.map((check) => check.name)).toEqual(
      expect.arrayContaining([
        'roles_scope_check',
        'roles_platform_not_default_check',
      ]),
    );
  });

  it('uses composite assignment identities and relationship indexes', () => {
    expect(
      getTableConfig(rolePermissions).primaryKeys.map((key) => key.name),
    ).toContain('role_permissions_pk');
    expect(
      getTableConfig(platformRoleAssignments).primaryKeys.map(
        (key) => key.name,
      ),
    ).toContain('platform_role_assignments_pk');
    expect(
      getTableConfig(organizationMemberRoles).primaryKeys.map(
        (key) => key.name,
      ),
    ).toContain('organization_member_roles_pk');
  });

  it('protects organization slugs, memberships, status, and newsletter identity', () => {
    const organizationConfig = getTableConfig(organizationsTable);
    expect(
      organizationConfig.indexes.map((index) => index.config.name),
    ).toContain('organizations_slug_unique');
    expect(organizationConfig.checks.length).toBeGreaterThanOrEqual(3);

    const memberConfig = getTableConfig(organizationMembers);
    expect(memberConfig.indexes.map((index) => index.config.name)).toContain(
      'organization_members_organization_user_unique',
    );
    expect(memberConfig.checks.map((check) => check.name)).toContain(
      'organization_members_status_check',
    );

    expect(
      getTableConfig(newsletterRecipientsTable).indexes.map(
        (index) => index.config.name,
      ),
    ).toContain('newsletter_recipients_email_unique');
  });
});
