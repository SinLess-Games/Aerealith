// libs/db/seeds/authorization/role-permissions.seed.ts

import { eq } from 'drizzle-orm';

import type { DatabaseClient } from '../../src/client';

import {
  permissions,
  PermissionScope,
} from '../../src/schema/authorization/permissions';
import { rolePermissions } from '../../src/schema/authorization/role-permissions';
import { roles } from '../../src/schema/authorization/roles';

import { authorizationPermissionSeeds } from './permissions.seed';

const PLATFORM_OWNER_ROLE = 'platform-owner';
const ENGINEER_ROLE = 'engineer';
const SUPPORT_ROLE = 'support';
const MODERATOR_ROLE = 'moderator';
const PLATFORM_USER_ROLE = 'user';

const ORGANIZATION_OWNER_ROLE = 'owner';
const ORGANIZATION_ADMIN_ROLE = 'admin';
const ORGANIZATION_MANAGER_ROLE = 'manager';
const ORGANIZATION_MEMBER_ROLE = 'member';
const ORGANIZATION_VIEWER_ROLE = 'viewer';

/**
 * Every platform permission belongs to the platform owner.
 *
 * Deriving this list from the canonical permission seed means newly added
 * platform permissions automatically become available to the platform owner.
 */
const ALL_PLATFORM_PERMISSIONS = authorizationPermissionSeeds
  .filter((permission) => permission.scope === PermissionScope.Platform)
  .map((permission) => permission.key);

/**
 * Every organization permission belongs to an organization owner.
 */
const ALL_ORGANIZATION_PERMISSIONS = authorizationPermissionSeeds
  .filter((permission) => permission.scope === PermissionScope.Organization)
  .map((permission) => permission.key);

/**
 * Canonical role-to-permission mapping.
 *
 * System roles are intentionally least-privilege by default.
 *
 * A role should only receive permissions required for its responsibility.
 */
export const authorizationRolePermissionSeeds = [
  // ---------------------------------------------------------------------------
  // Platform owner
  // ---------------------------------------------------------------------------

  {
    scope: PermissionScope.Platform,
    roleSlug: PLATFORM_OWNER_ROLE,
    permissionKeys: ALL_PLATFORM_PERMISSIONS,
  },

  // ---------------------------------------------------------------------------
  // Engineer / Developer
  //
  // Engineers need broad observability and operational control, but should
  // not automatically receive account deletion, moderation enforcement, or
  // role-assignment authority.
  // ---------------------------------------------------------------------------

  {
    scope: PermissionScope.Platform,
    roleSlug: ENGINEER_ROLE,
    permissionKeys: [
      'platform.access',

      'platform.settings.read',

      'platform.user.read',

      'platform.organization.read',

      'platform.role.read',
      'platform.permission.read',

      'platform.support.read',

      'platform.system.read',
      'platform.system.manage',

      'platform.feature.read',
      'platform.feature.manage',

      'platform.audit.read',
    ],
  },

  // ---------------------------------------------------------------------------
  // Support
  //
  // Support may inspect users and organizations and perform limited account
  // recovery operations, but cannot ban users, administer platform roles,
  // modify platform configuration, or delete accounts.
  // ---------------------------------------------------------------------------

  {
    scope: PermissionScope.Platform,
    roleSlug: SUPPORT_ROLE,
    permissionKeys: [
      'platform.access',

      'platform.user.read',
      'platform.user.update',
      'platform.user.restore',

      'platform.organization.read',

      'platform.support.read',
      'platform.support.manage',

      'platform.audit.read',
    ],
  },

  // ---------------------------------------------------------------------------
  // Moderator
  //
  // Moderators may enforce platform safety policies against users and process
  // moderation cases. They do not receive general platform administration,
  // engineering, support-management, or RBAC authority.
  // ---------------------------------------------------------------------------

  {
    scope: PermissionScope.Platform,
    roleSlug: MODERATOR_ROLE,
    permissionKeys: [
      'platform.access',

      'platform.user.read',
      'platform.user.suspend',
      'platform.user.restore',
      'platform.user.ban',
      'platform.user.unban',

      'platform.organization.read',

      'platform.moderation.read',
      'platform.moderation.review',
      'platform.moderation.resolve',

      'platform.audit.read',
    ],
  },

  // ---------------------------------------------------------------------------
  // Standard platform user
  //
  // This role intentionally receives no internal administration permissions.
  //
  // Normal product functionality such as:
  //
  //   managing your own account
  //   managing your own profile
  //   creating an organization
  //   using normal application features
  //
  // should not require internal platform-admin permissions such as
  // platform.user.update.
  //
  // Those permissions mean "administer platform users", not "edit myself".
  //
  // If normal product actions later require RBAC, add dedicated permissions
  // such as user.profile.update or platform.organization.create-self rather
  // than granting administrative permissions to every user.
  // ---------------------------------------------------------------------------

  {
    scope: PermissionScope.Platform,
    roleSlug: PLATFORM_USER_ROLE,
    permissionKeys: [],
  },

  // ---------------------------------------------------------------------------
  // Organization owner
  //
  // The owner receives the complete organization permission set.
  // ---------------------------------------------------------------------------

  {
    scope: PermissionScope.Organization,
    roleSlug: ORGANIZATION_OWNER_ROLE,
    permissionKeys: ALL_ORGANIZATION_PERMISSIONS,
  },

  // ---------------------------------------------------------------------------
  // Organization admin
  //
  // Administrators can manage nearly all organization operations but cannot
  // delete the organization itself.
  // ---------------------------------------------------------------------------

  {
    scope: PermissionScope.Organization,
    roleSlug: ORGANIZATION_ADMIN_ROLE,
    permissionKeys: [
      'organization.read',
      'organization.update',

      'organization.member.read',
      'organization.member.invite',
      'organization.member.update',
      'organization.member.suspend',
      'organization.member.restore',
      'organization.member.remove',

      'organization.role.read',
      'organization.role.assign',
      'organization.role.revoke',

      'organization.audit.read',

      'organization.billing.read',
      'organization.billing.manage',
    ],
  },

  // ---------------------------------------------------------------------------
  // Organization manager
  //
  // Managers handle day-to-day membership operations but cannot manage RBAC,
  // billing, ownership, or organization lifecycle.
  // ---------------------------------------------------------------------------

  {
    scope: PermissionScope.Organization,
    roleSlug: ORGANIZATION_MANAGER_ROLE,
    permissionKeys: [
      'organization.read',

      'organization.member.read',
      'organization.member.invite',
      'organization.member.update',
      'organization.member.suspend',
      'organization.member.restore',
      'organization.member.remove',

      'organization.role.read',
    ],
  },

  // ---------------------------------------------------------------------------
  // Organization member
  //
  // Standard members may view their organization and its membership roster.
  // ---------------------------------------------------------------------------

  {
    scope: PermissionScope.Organization,
    roleSlug: ORGANIZATION_MEMBER_ROLE,
    permissionKeys: ['organization.read', 'organization.member.read'],
  },

  // ---------------------------------------------------------------------------
  // Organization viewer
  //
  // Viewer is intentionally the smallest organization role.
  // ---------------------------------------------------------------------------

  {
    scope: PermissionScope.Organization,
    roleSlug: ORGANIZATION_VIEWER_ROLE,
    permissionKeys: ['organization.read'],
  },
] as const;

/**
 * Seeds canonical role-to-permission relationships.
 *
 * System-role mappings are synchronized rather than merely appended:
 *
 *   1. resolve the canonical role
 *   2. remove its existing role-permission relationships
 *   3. resolve every canonical permission
 *   4. recreate the expected relationships
 *
 * This means removing a permission from this seed actually removes that
 * permission from the system role the next time the seed runs.
 */
export async function seedAuthorizationRolePermissions(
  database: DatabaseClient,
): Promise<void> {
  const roleRows = await database
    .select({
      id: roles.id,
      slug: roles.slug,
      scope: roles.scope,
      isSystem: roles.isSystem,
    })
    .from(roles);

  const permissionRows = await database
    .select({
      id: permissions.id,
      key: permissions.key,
      scope: permissions.scope,
    })
    .from(permissions);

  const roleByIdentity = new Map(
    roleRows.map((role) => [roleIdentity(role.scope, role.slug), role]),
  );

  const permissionByKey = new Map(
    permissionRows.map((permission) => [permission.key, permission]),
  );

  for (const seed of authorizationRolePermissionSeeds) {
    const role = roleByIdentity.get(roleIdentity(seed.scope, seed.roleSlug));

    if (!role) {
      throw new Error(
        `Authorization role not found: ${seed.scope}/${seed.roleSlug}`,
      );
    }

    if (!role.isSystem) {
      throw new Error(
        `Authorization role is not a system role: ${seed.scope}/${seed.roleSlug}`,
      );
    }

    /**
     * System-role permissions are canonical.
     *
     * Removing old mappings first prevents stale permissions from surviving
     * after this seed definition changes.
     */
    await database
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, role.id));

    if (seed.permissionKeys.length === 0) {
      continue;
    }

    const mappings = seed.permissionKeys.map((permissionKey) => {
      const permission = permissionByKey.get(permissionKey);

      if (!permission) {
        throw new Error(`Authorization permission not found: ${permissionKey}`);
      }

      if (permission.scope !== seed.scope) {
        throw new Error(
          [
            'Authorization role-permission scope mismatch:',
            `${seed.scope}/${seed.roleSlug}`,
            'cannot receive',
            `${permission.scope}/${permission.key}`,
          ].join(' '),
        );
      }

      return {
        roleId: role.id,

        permissionId: permission.id,
      };
    });

    await database
      .insert(rolePermissions)
      .values(mappings)
      .onConflictDoNothing();
  }
}

function roleIdentity(scope: string, slug: string): string {
  return `${scope}:${slug}`;
}
