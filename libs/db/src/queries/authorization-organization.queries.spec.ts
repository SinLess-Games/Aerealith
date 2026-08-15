import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import {
  principalAuthorizationVersion,
  roleChildrenByParentRoleId,
  roleConflict,
  roleConflictsByRoleId,
  roleInheritance,
  roleParentsByRoleId,
  rolePermission,
  rolePermissionsByPermissionId,
  rolePermissionsByRoleId,
} from './authorization/authorization.queries';
import {
  activeOrganizationMemberRole,
  activeOrganizationMemberRolesByMemberId,
  activeOrganizationMemberRolesByRoleId,
  organizationMemberRole,
  organizationMemberRolesByAssigner,
  organizationMemberRolesByMemberId,
  organizationMemberRolesByRoleId,
} from './authorization/organization-member-role.queries';
import {
  permissionByKey,
  permissionByScopeResourceAction,
  permissionsByScope,
  systemPermissions,
  systemPermissionsByScope,
} from './authorization/permission.queries';
import {
  activePlatformRoleAssignment,
  activePlatformRoleAssignmentsByRoleId,
  activePlatformRoleAssignmentsByUserId,
  platformRoleAssignment,
  platformRoleAssignmentsByAssigner,
  platformRoleAssignmentsByRoleId,
  platformRoleAssignmentsByUserId,
} from './authorization/platform-role-assignment.queries';
import {
  defaultRolesByScope,
  roleById,
  roleByScopeSlug,
  rolesByScope,
  systemRoles,
  systemRolesByScope,
} from './authorization/role.queries';
import {
  activeOrganizationMemberById,
  activeOrganizationMemberByOrganizationAndUser,
  activeOrganizationMembers,
  activeOrganizationMembersByOrganizationAndAdder,
  activeOrganizationMembersByOrganizationId,
  activeOrganizationMembersByUserId,
  organizationMemberById,
  organizationMemberByOrganizationAndUser,
  organizationMembersAddedByUserId,
  organizationMembersByOrganizationAndAdder,
  organizationMembersByOrganizationAndStatus,
  organizationMembersByOrganizationId,
  organizationMembersByStatus,
  organizationMembersByUserId,
  suspendedOrganizationMembers,
} from './organization/organization-member.queries';
import {
  activeOrganizationById,
  activeOrganizationBySlug,
  activeOrganizations,
  activeOrganizationsCreatedByUserId,
  archivedOrganizations,
  existingOrganizationById,
  existingOrganizationBySlug,
  existingOrganizations,
  existingOrganizationsByStatus,
  existingOrganizationsCreatedByUserId,
  organizationById,
  organizationBySlug,
  organizationsByStatus,
  organizationsCreatedByUserId,
  suspendedOrganizations,
} from './organization/organization.queries';

const dialect = new PgDialect();
const now = new Date('2026-08-13T12:00:00.000Z');

function compile(condition: SQL | undefined) {
  if (!condition) throw new Error('Expected a SQL condition.');
  return dialect.sqlToQuery(condition);
}

type QueryCase = readonly [
  name: string,
  condition: SQL | undefined,
  table: string,
  parameters: readonly unknown[],
];

const authorizationCases: readonly QueryCase[] = [
  [
    'role permission',
    rolePermission('role-1', 'permission-1'),
    'role_permissions',
    ['role-1', 'permission-1'],
  ],
  [
    'permissions by role',
    rolePermissionsByRoleId('role-1'),
    'role_permissions',
    ['role-1'],
  ],
  [
    'roles by permission',
    rolePermissionsByPermissionId('permission-1'),
    'role_permissions',
    ['permission-1'],
  ],
  [
    'role parents',
    roleParentsByRoleId('role-1'),
    'role_inheritance',
    ['role-1'],
  ],
  [
    'role children',
    roleChildrenByParentRoleId('parent-1'),
    'role_inheritance',
    ['parent-1'],
  ],
  [
    'role inheritance',
    roleInheritance('role-1', 'parent-1'),
    'role_inheritance',
    ['role-1', 'parent-1'],
  ],
  [
    'role conflicts',
    roleConflictsByRoleId('role-1'),
    'role_conflicts',
    ['role-1', 'role-1'],
  ],
  [
    'symmetric role conflict',
    roleConflict('role-1', 'role-2'),
    'role_conflicts',
    ['role-1', 'role-2', 'role-2', 'role-1'],
  ],
  [
    'principal version',
    principalAuthorizationVersion('user', 'user-1'),
    'principal_authorization_versions',
    ['user', 'user-1'],
  ],
  [
    'member roles',
    organizationMemberRolesByMemberId('member-1'),
    'organization_member_roles',
    ['member-1'],
  ],
  [
    'member role',
    organizationMemberRole('member-1', 'role-1'),
    'organization_member_roles',
    ['member-1', 'role-1'],
  ],
  [
    'active member roles',
    activeOrganizationMemberRolesByMemberId('member-1', now),
    'organization_member_roles',
    ['member-1', now.toISOString()],
  ],
  [
    'active member role',
    activeOrganizationMemberRole('member-1', 'role-1', now),
    'organization_member_roles',
    ['member-1', 'role-1', now.toISOString()],
  ],
  [
    'member roles by assigner',
    organizationMemberRolesByAssigner('user-1'),
    'organization_member_roles',
    ['user-1'],
  ],
  [
    'member roles by role',
    organizationMemberRolesByRoleId('role-1'),
    'organization_member_roles',
    ['role-1'],
  ],
  [
    'active member roles by role',
    activeOrganizationMemberRolesByRoleId('role-1', now),
    'organization_member_roles',
    ['role-1', now.toISOString()],
  ],
  [
    'permission key',
    permissionByKey(' Platform User Read '),
    'permissions',
    ['platform.user.read'],
  ],
  [
    'permissions by scope',
    permissionsByScope('platform'),
    'permissions',
    ['platform'],
  ],
  [
    'permission semantic identity',
    permissionByScopeResourceAction('organization', ' User_Profile ', ' READ '),
    'permissions',
    ['organization', 'user.profile', 'read'],
  ],
  ['system permissions', systemPermissions(), 'permissions', [true]],
  [
    'system permissions by scope',
    systemPermissionsByScope('organization'),
    'permissions',
    ['organization', true],
  ],
  [
    'platform assignments by user',
    platformRoleAssignmentsByUserId('user-1'),
    'platform_role_assignments',
    ['user-1'],
  ],
  [
    'platform assignment',
    platformRoleAssignment('user-1', 'role-1'),
    'platform_role_assignments',
    ['user-1', 'role-1'],
  ],
  [
    'active platform assignments',
    activePlatformRoleAssignmentsByUserId('user-1', now),
    'platform_role_assignments',
    ['user-1', now.toISOString()],
  ],
  [
    'active platform assignment',
    activePlatformRoleAssignment('user-1', 'role-1', now),
    'platform_role_assignments',
    ['user-1', 'role-1', now.toISOString()],
  ],
  [
    'platform assignments by assigner',
    platformRoleAssignmentsByAssigner('admin-1'),
    'platform_role_assignments',
    ['admin-1'],
  ],
  [
    'platform assignments by role',
    platformRoleAssignmentsByRoleId('role-1'),
    'platform_role_assignments',
    ['role-1'],
  ],
  [
    'active platform assignments by role',
    activePlatformRoleAssignmentsByRoleId('role-1', now),
    'platform_role_assignments',
    ['role-1', now.toISOString()],
  ],
  ['role by id', roleById('role-1'), 'roles', ['role-1']],
  [
    'role by scope and slug',
    roleByScopeSlug('organization', ' Team_Owner '),
    'roles',
    ['organization', 'team-owner'],
  ],
  ['roles by scope', rolesByScope('platform'), 'roles', ['platform']],
  ['system roles', systemRoles(), 'roles', [true]],
  [
    'system roles by scope',
    systemRolesByScope('organization'),
    'roles',
    ['organization', true],
  ],
  [
    'default roles by scope',
    defaultRolesByScope('organization'),
    'roles',
    ['organization', true],
  ],
];

const organizationMemberCases: readonly QueryCase[] = [
  [
    'member by id',
    organizationMemberById('member-1'),
    'organization_members',
    ['member-1'],
  ],
  [
    'active member by id',
    activeOrganizationMemberById('member-1'),
    'organization_members',
    ['member-1', 'active'],
  ],
  [
    'member by organization and user',
    organizationMemberByOrganizationAndUser('organization-1', 'user-1'),
    'organization_members',
    ['organization-1', 'user-1'],
  ],
  [
    'active member by organization and user',
    activeOrganizationMemberByOrganizationAndUser('organization-1', 'user-1'),
    'organization_members',
    ['organization-1', 'user-1', 'active'],
  ],
  [
    'members by organization',
    organizationMembersByOrganizationId('organization-1'),
    'organization_members',
    ['organization-1'],
  ],
  [
    'active members by organization',
    activeOrganizationMembersByOrganizationId('organization-1'),
    'organization_members',
    ['organization-1', 'active'],
  ],
  [
    'members by user',
    organizationMembersByUserId('user-1'),
    'organization_members',
    ['user-1'],
  ],
  [
    'active members by user',
    activeOrganizationMembersByUserId('user-1'),
    'organization_members',
    ['user-1', 'active'],
  ],
  [
    'members by status',
    organizationMembersByStatus('suspended'),
    'organization_members',
    ['suspended'],
  ],
  [
    'members by organization and status',
    organizationMembersByOrganizationAndStatus('organization-1', 'suspended'),
    'organization_members',
    ['organization-1', 'suspended'],
  ],
  [
    'active members',
    activeOrganizationMembers(),
    'organization_members',
    ['active'],
  ],
  [
    'suspended members',
    suspendedOrganizationMembers(),
    'organization_members',
    ['suspended'],
  ],
  [
    'members by adder',
    organizationMembersAddedByUserId('admin-1'),
    'organization_members',
    ['admin-1'],
  ],
  [
    'members by organization and adder',
    organizationMembersByOrganizationAndAdder('organization-1', 'admin-1'),
    'organization_members',
    ['organization-1', 'admin-1'],
  ],
  [
    'active members by organization and adder',
    activeOrganizationMembersByOrganizationAndAdder(
      'organization-1',
      'admin-1',
    ),
    'organization_members',
    ['organization-1', 'admin-1', 'active'],
  ],
];

const organizationCases: readonly QueryCase[] = [
  [
    'active organization by id',
    activeOrganizationById('organization-1'),
    'organizations',
    ['organization-1', 'active'],
  ],
  [
    'active organization by slug',
    activeOrganizationBySlug(' Aerealith-AI '),
    'organizations',
    ['aerealith-ai', 'active'],
  ],
  [
    'organization by id',
    organizationById('organization-1'),
    'organizations',
    ['organization-1'],
  ],
  [
    'organization by slug',
    organizationBySlug(' Aerealith-AI '),
    'organizations',
    ['aerealith-ai'],
  ],
  [
    'existing organization by id',
    existingOrganizationById('organization-1'),
    'organizations',
    ['organization-1'],
  ],
  [
    'existing organization by slug',
    existingOrganizationBySlug(' Aerealith-AI '),
    'organizations',
    ['aerealith-ai'],
  ],
  [
    'organizations by status',
    organizationsByStatus('suspended'),
    'organizations',
    ['suspended'],
  ],
  [
    'existing organizations by status',
    existingOrganizationsByStatus('archived'),
    'organizations',
    ['archived'],
  ],
  ['active organizations', activeOrganizations(), 'organizations', ['active']],
  ['existing organizations', existingOrganizations(), 'organizations', []],
  [
    'organizations by creator',
    organizationsCreatedByUserId('user-1'),
    'organizations',
    ['user-1'],
  ],
  [
    'existing organizations by creator',
    existingOrganizationsCreatedByUserId('user-1'),
    'organizations',
    ['user-1'],
  ],
  [
    'active organizations by creator',
    activeOrganizationsCreatedByUserId('user-1'),
    'organizations',
    ['user-1', 'active'],
  ],
  [
    'suspended organizations',
    suspendedOrganizations(),
    'organizations',
    ['suspended'],
  ],
  [
    'archived organizations',
    archivedOrganizations(),
    'organizations',
    ['archived'],
  ],
];

describe.each([
  ['authorization', authorizationCases],
  ['organization membership', organizationMemberCases],
  ['organization', organizationCases],
] as const)('%s query helpers', (_group, cases) => {
  it.each(cases)(
    'builds the %s predicate',
    (_name, condition, table, parameters) => {
      const query = compile(condition);
      expect(query.sql).toContain(`"${table}"`);
      expect(query.params).toEqual(parameters);
    },
  );
});
