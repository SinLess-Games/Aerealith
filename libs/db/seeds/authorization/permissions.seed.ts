// libs/db/seeds/authorization/permissions.seed.ts

import type { DatabaseClient } from '../../src/client';

import {
  PermissionScope,
  permissions,
  type PermissionScope as PermissionScopeType,
} from '../../src/schema/authorization/permissions';

export interface AuthorizationPermissionSeed {
  readonly key: string;
  readonly scope: PermissionScopeType;
  readonly resource: string;
  readonly action: string;
  readonly description: string;
  readonly isSystem: boolean;
}

/**
 * Canonical authorization permission catalog.
 *
 * Permission naming convention:
 *
 *   <scope>.<resource>.<action>
 *
 * Examples:
 *
 *   platform.user.read
 *   platform.organization.suspend
 *   organization.member.invite
 *
 * Platform permissions govern internal Aerealith operations.
 *
 * Organization permissions govern actions performed inside a specific
 * organization.
 */
export const authorizationPermissionSeeds = [
  // ---------------------------------------------------------------------------
  // Platform
  // ---------------------------------------------------------------------------

  {
    key: 'platform.access',
    scope: PermissionScope.Platform,
    resource: 'platform',
    action: 'access',
    description: 'Access internal platform administration functionality.',
    isSystem: true,
  },
  {
    key: 'platform.settings.read',
    scope: PermissionScope.Platform,
    resource: 'settings',
    action: 'read',
    description: 'View platform-wide settings and configuration.',
    isSystem: true,
  },
  {
    key: 'platform.settings.update',
    scope: PermissionScope.Platform,
    resource: 'settings',
    action: 'update',
    description: 'Update platform-wide settings and configuration.',
    isSystem: true,
  },

  // ---------------------------------------------------------------------------
  // Platform users
  // ---------------------------------------------------------------------------

  {
    key: 'platform.user.read',
    scope: PermissionScope.Platform,
    resource: 'user',
    action: 'read',
    description: 'View platform user accounts and account details.',
    isSystem: true,
  },
  {
    key: 'platform.user.create',
    scope: PermissionScope.Platform,
    resource: 'user',
    action: 'create',
    description: 'Create platform user accounts.',
    isSystem: true,
  },
  {
    key: 'platform.user.update',
    scope: PermissionScope.Platform,
    resource: 'user',
    action: 'update',
    description: 'Update platform user account information.',
    isSystem: true,
  },
  {
    key: 'platform.user.suspend',
    scope: PermissionScope.Platform,
    resource: 'user',
    action: 'suspend',
    description: 'Suspend a platform user account.',
    isSystem: true,
  },
  {
    key: 'platform.user.restore',
    scope: PermissionScope.Platform,
    resource: 'user',
    action: 'restore',
    description: 'Restore a suspended platform user account.',
    isSystem: true,
  },
  {
    key: 'platform.user.ban',
    scope: PermissionScope.Platform,
    resource: 'user',
    action: 'ban',
    description: 'Ban a user from the platform.',
    isSystem: true,
  },
  {
    key: 'platform.user.unban',
    scope: PermissionScope.Platform,
    resource: 'user',
    action: 'unban',
    description: 'Remove a platform ban from a user.',
    isSystem: true,
  },
  {
    key: 'platform.user.delete',
    scope: PermissionScope.Platform,
    resource: 'user',
    action: 'delete',
    description: 'Delete a platform user account.',
    isSystem: true,
  },

  // ---------------------------------------------------------------------------
  // Platform organizations
  //
  // These permissions govern organizations from the platform/internal side.
  // They are different from organization.* permissions, which govern actions
  // performed by members inside one organization.
  // ---------------------------------------------------------------------------

  {
    key: 'platform.organization.read',
    scope: PermissionScope.Platform,
    resource: 'organization',
    action: 'read',
    description: 'View organizations across the platform.',
    isSystem: true,
  },
  {
    key: 'platform.organization.create',
    scope: PermissionScope.Platform,
    resource: 'organization',
    action: 'create',
    description: 'Create organizations from platform administration.',
    isSystem: true,
  },
  {
    key: 'platform.organization.update',
    scope: PermissionScope.Platform,
    resource: 'organization',
    action: 'update',
    description: 'Update organizations from platform administration.',
    isSystem: true,
  },
  {
    key: 'platform.organization.suspend',
    scope: PermissionScope.Platform,
    resource: 'organization',
    action: 'suspend',
    description: 'Suspend an organization across the platform.',
    isSystem: true,
  },
  {
    key: 'platform.organization.restore',
    scope: PermissionScope.Platform,
    resource: 'organization',
    action: 'restore',
    description: 'Restore a suspended organization.',
    isSystem: true,
  },
  {
    key: 'platform.organization.archive',
    scope: PermissionScope.Platform,
    resource: 'organization',
    action: 'archive',
    description: 'Archive an organization.',
    isSystem: true,
  },
  {
    key: 'platform.organization.delete',
    scope: PermissionScope.Platform,
    resource: 'organization',
    action: 'delete',
    description: 'Delete an organization from the platform.',
    isSystem: true,
  },

  // ---------------------------------------------------------------------------
  // Platform authorization
  // ---------------------------------------------------------------------------

  {
    key: 'platform.role.read',
    scope: PermissionScope.Platform,
    resource: 'role',
    action: 'read',
    description: 'View platform roles and their configuration.',
    isSystem: true,
  },
  {
    key: 'platform.role.create',
    scope: PermissionScope.Platform,
    resource: 'role',
    action: 'create',
    description: 'Create platform authorization roles.',
    isSystem: true,
  },
  {
    key: 'platform.role.update',
    scope: PermissionScope.Platform,
    resource: 'role',
    action: 'update',
    description: 'Update platform authorization roles.',
    isSystem: true,
  },
  {
    key: 'platform.role.delete',
    scope: PermissionScope.Platform,
    resource: 'role',
    action: 'delete',
    description: 'Delete platform authorization roles.',
    isSystem: true,
  },
  {
    key: 'platform.role.assign',
    scope: PermissionScope.Platform,
    resource: 'role',
    action: 'assign',
    description: 'Assign platform roles to users.',
    isSystem: true,
  },
  {
    key: 'platform.role.revoke',
    scope: PermissionScope.Platform,
    resource: 'role',
    action: 'revoke',
    description: 'Revoke platform roles from users.',
    isSystem: true,
  },
  {
    key: 'platform.permission.read',
    scope: PermissionScope.Platform,
    resource: 'permission',
    action: 'read',
    description: 'View the platform permission catalog.',
    isSystem: true,
  },
  {
    key: 'platform.permission.manage',
    scope: PermissionScope.Platform,
    resource: 'permission',
    action: 'manage',
    description: 'Manage platform role-to-permission relationships.',
    isSystem: true,
  },

  // ---------------------------------------------------------------------------
  // Platform moderation
  // ---------------------------------------------------------------------------

  {
    key: 'platform.moderation.read',
    scope: PermissionScope.Platform,
    resource: 'moderation',
    action: 'read',
    description: 'View moderation queues, reports, and moderation state.',
    isSystem: true,
  },
  {
    key: 'platform.moderation.review',
    scope: PermissionScope.Platform,
    resource: 'moderation',
    action: 'review',
    description: 'Review moderation reports and cases.',
    isSystem: true,
  },
  {
    key: 'platform.moderation.resolve',
    scope: PermissionScope.Platform,
    resource: 'moderation',
    action: 'resolve',
    description: 'Resolve moderation reports and cases.',
    isSystem: true,
  },

  // ---------------------------------------------------------------------------
  // Platform support
  // ---------------------------------------------------------------------------

  {
    key: 'platform.support.read',
    scope: PermissionScope.Platform,
    resource: 'support',
    action: 'read',
    description: 'View support-related platform information.',
    isSystem: true,
  },
  {
    key: 'platform.support.manage',
    scope: PermissionScope.Platform,
    resource: 'support',
    action: 'manage',
    description: 'Manage support cases and support operations.',
    isSystem: true,
  },

  // ---------------------------------------------------------------------------
  // Platform engineering / operations
  // ---------------------------------------------------------------------------

  {
    key: 'platform.system.read',
    scope: PermissionScope.Platform,
    resource: 'system',
    action: 'read',
    description: 'View internal platform system and operational information.',
    isSystem: true,
  },
  {
    key: 'platform.system.manage',
    scope: PermissionScope.Platform,
    resource: 'system',
    action: 'manage',
    description:
      'Manage internal platform system and operational configuration.',
    isSystem: true,
  },
  {
    key: 'platform.feature.read',
    scope: PermissionScope.Platform,
    resource: 'feature',
    action: 'read',
    description: 'View platform feature configuration.',
    isSystem: true,
  },
  {
    key: 'platform.feature.manage',
    scope: PermissionScope.Platform,
    resource: 'feature',
    action: 'manage',
    description: 'Manage platform feature configuration.',
    isSystem: true,
  },

  // ---------------------------------------------------------------------------
  // Platform audit
  // ---------------------------------------------------------------------------

  {
    key: 'platform.audit.read',
    scope: PermissionScope.Platform,
    resource: 'audit',
    action: 'read',
    description: 'View platform-wide security and audit records.',
    isSystem: true,
  },

  // ---------------------------------------------------------------------------
  // Organization
  // ---------------------------------------------------------------------------

  {
    key: 'organization.read',
    scope: PermissionScope.Organization,
    resource: 'organization',
    action: 'read',
    description: 'View organization information.',
    isSystem: true,
  },
  {
    key: 'organization.update',
    scope: PermissionScope.Organization,
    resource: 'organization',
    action: 'update',
    description: 'Update organization information and settings.',
    isSystem: true,
  },
  {
    key: 'organization.delete',
    scope: PermissionScope.Organization,
    resource: 'organization',
    action: 'delete',
    description: 'Delete the organization.',
    isSystem: true,
  },

  // ---------------------------------------------------------------------------
  // Organization members
  // ---------------------------------------------------------------------------

  {
    key: 'organization.member.read',
    scope: PermissionScope.Organization,
    resource: 'member',
    action: 'read',
    description: 'View organization members.',
    isSystem: true,
  },
  {
    key: 'organization.member.invite',
    scope: PermissionScope.Organization,
    resource: 'member',
    action: 'invite',
    description: 'Invite users to the organization.',
    isSystem: true,
  },
  {
    key: 'organization.member.update',
    scope: PermissionScope.Organization,
    resource: 'member',
    action: 'update',
    description: 'Update organization membership state.',
    isSystem: true,
  },
  {
    key: 'organization.member.suspend',
    scope: PermissionScope.Organization,
    resource: 'member',
    action: 'suspend',
    description: 'Suspend an organization membership.',
    isSystem: true,
  },
  {
    key: 'organization.member.restore',
    scope: PermissionScope.Organization,
    resource: 'member',
    action: 'restore',
    description: 'Restore a suspended organization membership.',
    isSystem: true,
  },
  {
    key: 'organization.member.remove',
    scope: PermissionScope.Organization,
    resource: 'member',
    action: 'remove',
    description: 'Remove a member from the organization.',
    isSystem: true,
  },

  // ---------------------------------------------------------------------------
  // Organization roles
  // ---------------------------------------------------------------------------

  {
    key: 'organization.role.read',
    scope: PermissionScope.Organization,
    resource: 'role',
    action: 'read',
    description: 'View organization roles and role assignments.',
    isSystem: true,
  },
  {
    key: 'organization.role.assign',
    scope: PermissionScope.Organization,
    resource: 'role',
    action: 'assign',
    description: 'Assign organization roles to members.',
    isSystem: true,
  },
  {
    key: 'organization.role.revoke',
    scope: PermissionScope.Organization,
    resource: 'role',
    action: 'revoke',
    description: 'Revoke organization roles from members.',
    isSystem: true,
  },

  // ---------------------------------------------------------------------------
  // Organization audit
  // ---------------------------------------------------------------------------

  {
    key: 'organization.audit.read',
    scope: PermissionScope.Organization,
    resource: 'audit',
    action: 'read',
    description: 'View audit information for the organization.',
    isSystem: true,
  },

  // ---------------------------------------------------------------------------
  // Organization billing
  // ---------------------------------------------------------------------------

  {
    key: 'organization.billing.read',
    scope: PermissionScope.Organization,
    resource: 'billing',
    action: 'read',
    description: 'View organization billing information.',
    isSystem: true,
  },
  {
    key: 'organization.billing.manage',
    scope: PermissionScope.Organization,
    resource: 'billing',
    action: 'manage',
    description: 'Manage organization billing configuration.',
    isSystem: true,
  },
] as const satisfies readonly AuthorizationPermissionSeed[];

/**
 * Seeds the canonical authorization permission catalog.
 *
 * The seed is idempotent:
 *
 *   - new permissions are inserted
 *   - existing permissions are updated to match the canonical definition
 *
 * Permission IDs are intentionally not hard-coded. Roles should resolve
 * permissions by their stable permission key when seeding role-permission
 * relationships.
 */
export async function seedAuthorizationPermissions(
  database: DatabaseClient,
): Promise<void> {
  for (const permission of authorizationPermissionSeeds) {
    await database
      .insert(permissions)
      .values(permission)
      .onConflictDoUpdate({
        target: permissions.key,
        set: {
          scope: permission.scope,
          resource: permission.resource,
          action: permission.action,
          description: permission.description,
          isSystem: permission.isSystem,
          updatedAt: new Date(),
        },
      });
  }
}
