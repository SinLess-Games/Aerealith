// libs/db/seeds/authorization/roles.seed.ts

import type { DatabaseClient } from '../../src/client';

import {
  PermissionScope,
  type PermissionScope as PermissionScopeType,
} from '../../src/schema/authorization/permissions';

import { roles } from '../../src/schema/authorization/roles';

export interface AuthorizationRoleSeed {
  readonly name: string;
  readonly slug: string;
  readonly scope: PermissionScopeType;
  readonly description: string;
  readonly isSystem: boolean;
  readonly isDefault: boolean;
}

/**
 * Canonical authorization role catalog.
 *
 * Platform roles:
 *
 *   platform-owner
 *   engineer
 *   support
 *   moderator
 *   user
 *
 * Organization roles:
 *
 *   owner
 *   admin
 *   manager
 *   member
 *   viewer
 *
 * IMPORTANT:
 *
 * Platform roles cannot use roles.isDefault because the authorization schema
 * deliberately prevents platform-scoped roles from being database defaults.
 *
 * The platform "user" role is therefore assigned explicitly during signup.
 *
 * Organization defaults may use isDefault because their assignment happens
 * within an organization membership boundary.
 */
export const authorizationRoleSeeds = [
  // ---------------------------------------------------------------------------
  // Platform internal roles
  // ---------------------------------------------------------------------------

  {
    name: 'Platform Owner',
    slug: 'platform-owner',
    scope: PermissionScope.Platform,
    description:
      'Highest-trust internal platform role with complete administrative authority.',
    isSystem: true,
    isDefault: false,
  },

  {
    name: 'Engineer / Developer',
    slug: 'engineer',
    scope: PermissionScope.Platform,
    description:
      'Internal engineering role for platform development, diagnostics, features, and operational tooling.',
    isSystem: true,
    isDefault: false,
  },

  {
    name: 'Support',
    slug: 'support',
    scope: PermissionScope.Platform,
    description:
      'Internal support role for assisting users and organizations without unrestricted platform administration.',
    isSystem: true,
    isDefault: false,
  },

  {
    name: 'Moderator',
    slug: 'moderator',
    scope: PermissionScope.Platform,
    description:
      'Internal moderation role for reviewing reports and enforcing platform safety policies.',
    isSystem: true,
    isDefault: false,
  },

  // ---------------------------------------------------------------------------
  // Platform public/default user role
  // ---------------------------------------------------------------------------

  {
    name: 'User',
    slug: 'user',
    scope: PermissionScope.Platform,
    description:
      'Standard platform role assigned to users when they create an account.',
    isSystem: true,

    /**
     * Platform roles cannot be database-default roles.
     *
     * Signup must explicitly assign this role through:
     *
     *   platform_role_assignments
     *
     * after the user account has been created.
     */
    isDefault: false,
  },

  // ---------------------------------------------------------------------------
  // Organization roles
  // ---------------------------------------------------------------------------

  {
    name: 'Owner',
    slug: 'owner',
    scope: PermissionScope.Organization,
    description:
      'Highest-authority organization role with ownership and administrative control.',
    isSystem: true,
    isDefault: false,
  },

  {
    name: 'Admin',
    slug: 'admin',
    scope: PermissionScope.Organization,
    description:
      'Organization administrator with broad management authority excluding ownership-only operations.',
    isSystem: true,
    isDefault: false,
  },

  {
    name: 'Manager',
    slug: 'manager',
    scope: PermissionScope.Organization,
    description:
      'Organization manager with operational and member-management capabilities.',
    isSystem: true,
    isDefault: false,
  },

  {
    name: 'Member',
    slug: 'member',
    scope: PermissionScope.Organization,
    description:
      'Standard organization membership role for normal organization participation.',
    isSystem: true,

    /**
     * New ordinary organization memberships may use the member role as their
     * default authorization role.
     */
    isDefault: true,
  },

  {
    name: 'Viewer',
    slug: 'viewer',
    scope: PermissionScope.Organization,
    description:
      'Read-oriented organization role with minimal mutation authority.',
    isSystem: true,
    isDefault: false,
  },
] as const satisfies readonly AuthorizationRoleSeed[];

/**
 * Seeds the canonical authorization role catalog.
 *
 * This operation is idempotent.
 *
 * Role identity is defined by:
 *
 *   scope + slug
 *
 * Existing system roles are updated to match the canonical role definition,
 * while their database-generated IDs remain stable.
 */
export async function seedAuthorizationRoles(
  database: DatabaseClient,
): Promise<void> {
  for (const role of authorizationRoleSeeds) {
    await database
      .insert(roles)
      .values(role)
      .onConflictDoUpdate({
        target: [roles.scope, roles.slug],

        set: {
          name: role.name,

          description: role.description,

          isSystem: role.isSystem,

          isDefault: role.isDefault,

          updatedAt: new Date(),
        },
      });
  }
}
