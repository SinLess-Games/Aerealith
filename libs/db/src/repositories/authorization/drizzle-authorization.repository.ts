// libs/db/src/repositories/authorization/drizzle-authorization.repository.ts

import { and, count, eq, isNull, or, sql } from 'drizzle-orm';

import type {
  AuthorizationManagementRepository,
  AuthorizationPrincipal,
  CreatePermissionRecord,
  CreateRoleAssignmentRecord,
  CreateRoleRecord,
  EffectiveAuthorization,
  Permission,
  RevokeRoleAssignmentRecord,
  Role,
  RoleAssignment,
  RoleConflict,
} from '@aerealith-ai/authorization';

import type { DatabaseClient } from '../../client';

import {
  principalAuthorizationVersionsTable,
  roleConflictsTable,
  roleInheritanceTable,
} from '../../schema/authorization/authorization.table';

import { organizationMemberRoles } from '../../schema/authorization/organization-member-role';
import { permissions } from '../../schema/authorization/permissions';
import { platformRoleAssignments } from '../../schema/authorization/platform-role-assignment';
import { rolePermissions } from '../../schema/authorization/role-permissions';
import { roles } from '../../schema/authorization/roles';

import {
  OrganizationMemberStatus,
  organizationMembers,
} from '../../schema/organization/organization-member.table';

type PermissionRow = typeof permissions.$inferSelect;

type RoleRow = typeof roles.$inferSelect;

type PlatformRoleAssignmentRow = typeof platformRoleAssignments.$inferSelect;

type OrganizationMemberRoleRow = typeof organizationMemberRoles.$inferSelect;

interface OrganizationAssignmentRow extends OrganizationMemberRoleRow {
  organizationId: string;
  userId: string;
}

const DomainProjectionDefaults = {
  RoleAssignable: true,
  RoleEnabled: true,
  PermissionEnabled: true,
  CustomRoleAdministrativeRank: 0,
  OrganizationSystemRoleAdministrativeRank: 50,
  PlatformSystemRoleAdministrativeRank: 100,
} as const;

const ORGANIZATION_ROLE_SLUGS = new Set<string>([
  'owner',
  'admin',
  'manager',
  'member',
  'viewer',
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class DrizzleAuthorizationRepository implements AuthorizationManagementRepository {
  constructor(private readonly database: DatabaseClient) {}

  async getPrincipalVersion(
    principal: AuthorizationPrincipal,
  ): Promise<number> {
    const [row] = await this.database
      .select({
        version: principalAuthorizationVersionsTable.version,
      })
      .from(principalAuthorizationVersionsTable)
      .where(this.principalVersionCondition(principal))
      .limit(1);

    return row?.version ?? 0;
  }

  async loadEffectiveAuthorization(
    principal: AuthorizationPrincipal,
  ): Promise<EffectiveAuthorization> {
    const [version, assignments, roleRows, inheritanceRows, grantRows] =
      await Promise.all([
        this.getPrincipalVersion(principal),

        this.loadAssignmentsForPrincipal(principal),

        this.database.select().from(roles),

        this.database.select().from(roleInheritanceTable),

        this.database
          .select({
            roleId: rolePermissions.roleId,

            permission: permissions,
          })
          .from(rolePermissions)
          .innerJoin(
            permissions,
            eq(rolePermissions.permissionId, permissions.id),
          ),
      ]);

    const permissionsByRole: Record<string, Permission[]> = {};

    for (const grant of grantRows) {
      const currentPermissions = permissionsByRole[grant.roleId] ?? [];

      currentPermissions.push(toPermission(grant.permission));

      permissionsByRole[grant.roleId] = currentPermissions;
    }

    const parentRoleIdsByRole: Record<string, string[]> = {};

    for (const edge of inheritanceRows) {
      const currentParentIds = parentRoleIdsByRole[edge.roleId] ?? [];

      currentParentIds.push(edge.parentRoleId);

      parentRoleIdsByRole[edge.roleId] = currentParentIds;
    }

    return {
      principal,
      version,
      assignments,
      roles: roleRows.map(toRole),
      permissionsByRole,
      parentRoleIdsByRole,
    };
  }

  async findPermissionByKey(key: string): Promise<Permission | undefined> {
    const [row] = await this.database
      .select()
      .from(permissions)
      .where(eq(permissions.key, key))
      .limit(1);

    return row ? toPermission(row) : undefined;
  }

  async findRoleById(id: string): Promise<Role | undefined> {
    const [row] = await this.database
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    return row ? toRole(row) : undefined;
  }

  async findAssignments(
    principal: AuthorizationPrincipal,
  ): Promise<readonly RoleAssignment[]> {
    return this.loadAssignmentsForPrincipal(principal);
  }

  async findAssignmentById(id: string): Promise<RoleAssignment | undefined> {
    const parsed = parseAssignmentId(id);

    if (!parsed) {
      return undefined;
    }

    if (parsed.type === 'platform') {
      const [row] = await this.database
        .select()
        .from(platformRoleAssignments)
        .where(
          and(
            eq(platformRoleAssignments.userId, parsed.userId),

            eq(platformRoleAssignments.roleId, parsed.roleId),
          ),
        )
        .limit(1);

      return row ? toPlatformRoleAssignment(row) : undefined;
    }

    const [row] = await this.database
      .select({
        organizationMemberId: organizationMemberRoles.organizationMemberId,

        roleId: organizationMemberRoles.roleId,

        assignedByUserId: organizationMemberRoles.assignedByUserId,

        assignedAt: organizationMemberRoles.assignedAt,

        expiresAt: organizationMemberRoles.expiresAt,

        organizationId: organizationMembers.organizationId,

        userId: organizationMembers.userId,
      })
      .from(organizationMemberRoles)
      .innerJoin(
        organizationMembers,
        eq(
          organizationMemberRoles.organizationMemberId,
          organizationMembers.id,
        ),
      )
      .where(
        and(
          eq(
            organizationMemberRoles.organizationMemberId,
            parsed.organizationMemberId,
          ),

          eq(organizationMemberRoles.roleId, parsed.roleId),
        ),
      )
      .limit(1);

    return row ? toOrganizationRoleAssignment(row) : undefined;
  }

  async findRoleConflicts(roleId: string): Promise<readonly RoleConflict[]> {
    const rows = await this.database
      .select()
      .from(roleConflictsTable)
      .where(
        or(
          eq(roleConflictsTable.roleId, roleId),

          eq(roleConflictsTable.conflictingRoleId, roleId),
        ),
      );

    return rows.map((row) => ({
      roleId,

      conflictingRoleId:
        row.roleId === roleId ? row.conflictingRoleId : row.roleId,

      reason: row.reason,
    }));
  }

  async hasRolePermission(
    roleId: string,
    permissionId: string,
  ): Promise<boolean> {
    const [row] = await this.database
      .select({
        roleId: rolePermissions.roleId,
      })
      .from(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),

          eq(rolePermissions.permissionId, permissionId),
        ),
      )
      .limit(1);

    return row !== undefined;
  }

  async createRole(input: CreateRoleRecord): Promise<Role> {
    const [row] = await this.database
      .insert(roles)
      .values({
        name: input.displayName,

        slug: input.key,

        scope: inferRoleScope(input.key),

        ...(input.description !== undefined
          ? {
              description: input.description,
            }
          : {}),

        isSystem: input.system,

        isDefault: false,
      })
      .returning();

    if (!row) {
      throw new Error('Failed to create role.');
    }

    return toRole(row);
  }

  async updateRole(
    id: string,
    input: Partial<CreateRoleRecord>,
  ): Promise<Role> {
    const values: {
      name?: string;
      slug?: string;
      scope?: RoleRow['scope'];
      description?: string;
      isSystem?: boolean;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (input.displayName !== undefined) {
      values.name = input.displayName;
    }

    if (input.key !== undefined) {
      values.slug = input.key;

      values.scope = inferRoleScope(input.key);
    }

    if (input.description !== undefined) {
      values.description = input.description;
    }

    if (input.system !== undefined) {
      values.isSystem = input.system;
    }

    const [row] = await this.database
      .update(roles)
      .set(values)
      .where(eq(roles.id, id))
      .returning();

    if (!row) {
      throw new Error('Role not found.');
    }

    return toRole(row);
  }

  async createPermission(input: CreatePermissionRecord): Promise<Permission> {
    const [row] = await this.database
      .insert(permissions)
      .values({
        key: input.key,

        scope: inferPermissionScope(input.key),

        resource: input.resource,

        action: input.action,

        ...(input.description !== undefined
          ? {
              description: input.description,
            }
          : {}),

        isSystem: input.system,
      })
      .returning();

    if (!row) {
      throw new Error('Failed to create permission.');
    }

    return toPermission(row);
  }

  async updatePermission(
    id: string,
    input: Partial<CreatePermissionRecord>,
  ): Promise<Permission> {
    const values: {
      key?: string;
      scope?: PermissionRow['scope'];
      resource?: string;
      action?: string;
      description?: string;
      isSystem?: boolean;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (input.key !== undefined) {
      values.key = input.key;

      values.scope = inferPermissionScope(input.key);
    }

    if (input.resource !== undefined) {
      values.resource = input.resource;
    }

    if (input.action !== undefined) {
      values.action = input.action;
    }

    if (input.description !== undefined) {
      values.description = input.description;
    }

    if (input.system !== undefined) {
      values.isSystem = input.system;
    }

    const [row] = await this.database
      .update(permissions)
      .set(values)
      .where(eq(permissions.id, id))
      .returning();

    if (!row) {
      throw new Error('Permission not found.');
    }

    return toPermission(row);
  }

  async addRolePermission(roleId: string, permissionId: string): Promise<void> {
    const [role, permission] = await Promise.all([
      this.findRoleRowById(roleId),

      this.findPermissionRowById(permissionId),
    ]);

    if (!role) {
      throw new Error('Role not found.');
    }

    if (!permission) {
      throw new Error('Permission not found.');
    }

    if (role.scope !== permission.scope) {
      throw new Error('Role and permission scopes must match.');
    }

    await this.database
      .insert(rolePermissions)
      .values({
        roleId,
        permissionId,
      })
      .onConflictDoNothing();
  }

  async removeRolePermission(
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    await this.database.delete(rolePermissions).where(
      and(
        eq(rolePermissions.roleId, roleId),

        eq(rolePermissions.permissionId, permissionId),
      ),
    );
  }

  async addRoleParent(
    roleId: string,
    parentRoleId: string,
    actorId: string,
  ): Promise<void> {
    const [role, parentRole] = await Promise.all([
      this.findRoleRowById(roleId),

      this.findRoleRowById(parentRoleId),
    ]);

    if (!role || !parentRole) {
      throw new Error('Role not found.');
    }

    if (role.scope !== parentRole.scope) {
      throw new Error('Role inheritance cannot cross authorization scopes.');
    }

    await this.database
      .insert(roleInheritanceTable)
      .values({
        roleId,
        parentRoleId,
        createdBy: actorId,
      })
      .onConflictDoNothing();
  }

  async getParentRoleIds(roleId: string): Promise<readonly string[]> {
    const rows = await this.database
      .select({
        id: roleInheritanceTable.parentRoleId,
      })
      .from(roleInheritanceTable)
      .where(eq(roleInheritanceTable.roleId, roleId));

    return rows.map(({ id }) => id);
  }

  async assignRole(input: CreateRoleAssignmentRecord): Promise<RoleAssignment> {
    if (input.principal.type !== 'user') {
      throw new Error(
        'Role assignments currently support user principals only.',
      );
    }

    if (!isUuid(input.principal.id)) {
      throw new Error('User principal ID must be a UUID.');
    }

    const role = await this.findRoleRowById(input.roleId);

    if (!role) {
      throw new Error('Role not found.');
    }

    if (input.scope.type === 'global') {
      if (role.scope !== 'platform') {
        throw new Error('Organization roles cannot be assigned globally.');
      }

      return this.assignPlatformRole(input);
    }

    if (input.scope.type === 'organization') {
      if (role.scope !== 'organization') {
        throw new Error(
          'Platform roles cannot be assigned to an organization.',
        );
      }

      return this.assignOrganizationRole(input);
    }

    throw new Error(`Unsupported role assignment scope: ${input.scope.type}.`);
  }

  async revokeRole(input: RevokeRoleAssignmentRecord): Promise<void> {
    if (input.principal.type !== 'user') {
      throw new Error(
        'Role assignments currently support user principals only.',
      );
    }

    const parsed = parseAssignmentId(input.assignmentId);

    if (!parsed) {
      throw new Error('Active role assignment not found.');
    }

    if (parsed.type === 'platform') {
      if (parsed.userId !== input.principal.id) {
        throw new Error('Active role assignment not found.');
      }

      const [deleted] = await this.database
        .delete(platformRoleAssignments)
        .where(
          and(
            eq(platformRoleAssignments.userId, parsed.userId),

            eq(platformRoleAssignments.roleId, parsed.roleId),
          ),
        )
        .returning({
          roleId: platformRoleAssignments.roleId,
        });

      if (!deleted) {
        throw new Error('Active role assignment not found.');
      }

      return;
    }

    const [member] = await this.database
      .select({
        id: organizationMembers.id,

        userId: organizationMembers.userId,
      })
      .from(organizationMembers)
      .where(eq(organizationMembers.id, parsed.organizationMemberId))
      .limit(1);

    if (member?.userId !== input.principal.id) {
      throw new Error('Active role assignment not found.');
    }

    const [deleted] = await this.database
      .delete(organizationMemberRoles)
      .where(
        and(
          eq(
            organizationMemberRoles.organizationMemberId,
            parsed.organizationMemberId,
          ),

          eq(organizationMemberRoles.roleId, parsed.roleId),
        ),
      )
      .returning({
        roleId: organizationMemberRoles.roleId,
      });

    if (!deleted) {
      throw new Error('Active role assignment not found.');
    }
  }

  async incrementPrincipalVersion(
    principal: AuthorizationPrincipal,
  ): Promise<number> {
    const [row] = await this.database
      .insert(principalAuthorizationVersionsTable)
      .values({
        principalType: principal.type,

        principalId: principal.id,

        version: 1,
      })
      .onConflictDoUpdate({
        target: [
          principalAuthorizationVersionsTable.principalType,
          principalAuthorizationVersionsTable.principalId,
        ],

        set: {
          version: sql`
              ${principalAuthorizationVersionsTable.version} + 1
            `,

          updatedAt: new Date(),
        },
      })
      .returning({
        version: principalAuthorizationVersionsTable.version,
      });

    if (!row) {
      throw new Error('Failed to update authorization version.');
    }

    return row.version;
  }

  async countActiveRoleAssignments(roleKey: string): Promise<number> {
    const [role] = await this.database
      .select()
      .from(roles)
      .where(eq(roles.slug, roleKey))
      .limit(1);

    if (!role) {
      return 0;
    }

    if (role.scope === 'platform') {
      const [row] = await this.database
        .select({
          value: count(),
        })
        .from(platformRoleAssignments)
        .where(
          and(
            eq(platformRoleAssignments.roleId, role.id),

            or(
              isNull(platformRoleAssignments.expiresAt),

              sql`
                  ${platformRoleAssignments.expiresAt}
                  > now()
                `,
            ),
          ),
        );

      return Number(row?.value ?? 0);
    }

    const [row] = await this.database
      .select({
        value: count(),
      })
      .from(organizationMemberRoles)
      .innerJoin(
        organizationMembers,
        eq(
          organizationMemberRoles.organizationMemberId,
          organizationMembers.id,
        ),
      )
      .where(
        and(
          eq(organizationMemberRoles.roleId, role.id),

          eq(organizationMembers.status, OrganizationMemberStatus.Active),

          or(
            isNull(organizationMemberRoles.expiresAt),

            sql`
                ${organizationMemberRoles.expiresAt}
                > now()
              `,
          ),
        ),
      );

    return Number(row?.value ?? 0);
  }

  async transaction<T>(
    work: (repository: AuthorizationManagementRepository) => Promise<T>,
  ): Promise<T> {
    return this.database.transaction(async (transaction) =>
      work(
        new DrizzleAuthorizationRepository(
          transaction as unknown as DatabaseClient,
        ),
      ),
    );
  }

  private async loadAssignmentsForPrincipal(
    principal: AuthorizationPrincipal,
  ): Promise<RoleAssignment[]> {
    if (principal.type !== 'user' || !isUuid(principal.id)) {
      return [];
    }

    const [platformRows, organizationRows] = await Promise.all([
      this.database
        .select()
        .from(platformRoleAssignments)
        .where(eq(platformRoleAssignments.userId, principal.id)),

      this.database
        .select({
          organizationMemberId: organizationMemberRoles.organizationMemberId,

          roleId: organizationMemberRoles.roleId,

          assignedByUserId: organizationMemberRoles.assignedByUserId,

          assignedAt: organizationMemberRoles.assignedAt,

          expiresAt: organizationMemberRoles.expiresAt,

          organizationId: organizationMembers.organizationId,

          userId: organizationMembers.userId,
        })
        .from(organizationMemberRoles)
        .innerJoin(
          organizationMembers,
          eq(
            organizationMemberRoles.organizationMemberId,
            organizationMembers.id,
          ),
        )
        .where(
          and(
            eq(organizationMembers.userId, principal.id),

            eq(organizationMembers.status, OrganizationMemberStatus.Active),
          ),
        ),
    ]);

    return [
      ...platformRows.map(toPlatformRoleAssignment),

      ...organizationRows.map(toOrganizationRoleAssignment),
    ];
  }

  private async assignPlatformRole(
    input: CreateRoleAssignmentRecord,
  ): Promise<RoleAssignment> {
    const values = {
      userId: input.principal.id,

      roleId: input.roleId,

      assignedByUserId: normalizeUserActorId(input.assignedBy),

      ...(input.expiresAt
        ? {
            expiresAt: input.expiresAt,
          }
        : {}),
    };

    const [created] = await this.database
      .insert(platformRoleAssignments)
      .values(values)
      .onConflictDoNothing()
      .returning();

    if (created) {
      return toPlatformRoleAssignment(created);
    }

    const [existing] = await this.database
      .select()
      .from(platformRoleAssignments)
      .where(
        and(
          eq(platformRoleAssignments.userId, input.principal.id),

          eq(platformRoleAssignments.roleId, input.roleId),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new Error('Failed to assign platform role.');
    }

    return toPlatformRoleAssignment(existing);
  }

  private async assignOrganizationRole(
    input: CreateRoleAssignmentRecord,
  ): Promise<RoleAssignment> {
    const organizationId = input.scope.id;

    if (!organizationId || !isUuid(organizationId)) {
      throw new Error(
        'Organization role assignments require a valid organization UUID.',
      );
    }

    const [member] = await this.database
      .select({
        id: organizationMembers.id,

        organizationId: organizationMembers.organizationId,

        userId: organizationMembers.userId,

        status: organizationMembers.status,
      })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),

          eq(organizationMembers.userId, input.principal.id),
        ),
      )
      .limit(1);

    if (member?.status !== OrganizationMemberStatus.Active) {
      throw new Error('Active organization membership not found.');
    }

    const [created] = await this.database
      .insert(organizationMemberRoles)
      .values({
        organizationMemberId: member.id,

        roleId: input.roleId,

        assignedByUserId: normalizeUserActorId(input.assignedBy),

        ...(input.expiresAt
          ? {
              expiresAt: input.expiresAt,
            }
          : {}),
      })
      .onConflictDoNothing()
      .returning();

    if (created) {
      return toOrganizationRoleAssignment({
        ...created,

        organizationId: member.organizationId,

        userId: member.userId,
      });
    }

    const [existing] = await this.database
      .select()
      .from(organizationMemberRoles)
      .where(
        and(
          eq(organizationMemberRoles.organizationMemberId, member.id),

          eq(organizationMemberRoles.roleId, input.roleId),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new Error('Failed to assign organization role.');
    }

    return toOrganizationRoleAssignment({
      ...existing,

      organizationId: member.organizationId,

      userId: member.userId,
    });
  }

  private async findRoleRowById(id: string): Promise<RoleRow | undefined> {
    const [row] = await this.database
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    return row;
  }

  private async findPermissionRowById(
    id: string,
  ): Promise<PermissionRow | undefined> {
    const [row] = await this.database
      .select()
      .from(permissions)
      .where(eq(permissions.id, id))
      .limit(1);

    return row;
  }

  private principalVersionCondition(principal: AuthorizationPrincipal) {
    return and(
      eq(principalAuthorizationVersionsTable.principalType, principal.type),

      eq(principalAuthorizationVersionsTable.principalId, principal.id),
    );
  }
}

function toPermission(row: PermissionRow): Permission {
  return {
    id: row.id,

    key: row.key,

    resource: row.resource,

    action: row.action,

    displayName: permissionDisplayName(row.key),

    ...(row.description
      ? {
          description: row.description,
        }
      : {}),

    system: row.isSystem,

    enabled: DomainProjectionDefaults.PermissionEnabled,

    createdAt: row.createdAt,

    updatedAt: row.updatedAt,
  };
}

function toRole(row: RoleRow): Role {
  return {
    id: row.id,

    key: row.slug,

    displayName: row.name,

    ...(row.description
      ? {
          description: row.description,
        }
      : {}),

    system: row.isSystem,

    assignable: DomainProjectionDefaults.RoleAssignable,

    administrativeRank: projectedAdministrativeRank(row),

    enabled: DomainProjectionDefaults.RoleEnabled,

    createdAt: row.createdAt,

    updatedAt: row.updatedAt,
  };
}

function toPlatformRoleAssignment(
  row: PlatformRoleAssignmentRow,
): RoleAssignment {
  return {
    id: platformAssignmentId(row.userId, row.roleId),

    principal: {
      id: row.userId,

      type: 'user',
    },

    roleId: row.roleId,

    scope: {
      type: 'global',
    },

    assignedBy: row.assignedByUserId ?? 'system',

    assignedAt: row.assignedAt,

    ...(row.expiresAt
      ? {
          expiresAt: row.expiresAt,
        }
      : {}),

    metadata: {},
  };
}

function toOrganizationRoleAssignment(
  row: OrganizationAssignmentRow,
): RoleAssignment {
  return {
    id: organizationAssignmentId(row.organizationMemberId, row.roleId),

    principal: {
      id: row.userId,

      type: 'user',
    },

    roleId: row.roleId,

    scope: {
      type: 'organization',

      id: row.organizationId,
    },

    assignedBy: row.assignedByUserId ?? 'system',

    assignedAt: row.assignedAt,

    ...(row.expiresAt
      ? {
          expiresAt: row.expiresAt,
        }
      : {}),

    metadata: {},
  };
}

function projectedAdministrativeRank(row: RoleRow): number {
  if (!row.isSystem) {
    return DomainProjectionDefaults.CustomRoleAdministrativeRank;
  }

  if (row.scope === 'platform') {
    return DomainProjectionDefaults.PlatformSystemRoleAdministrativeRank;
  }

  return DomainProjectionDefaults.OrganizationSystemRoleAdministrativeRank;
}

function inferRoleScope(key: string): RoleRow['scope'] {
  const normalized = key.trim().toLowerCase();

  if (
    ORGANIZATION_ROLE_SLUGS.has(normalized) ||
    normalized.startsWith('organization.') ||
    normalized.startsWith('organization-') ||
    normalized.startsWith('organization_') ||
    normalized.startsWith('org.') ||
    normalized.startsWith('org-') ||
    normalized.startsWith('org_')
  ) {
    return 'organization';
  }

  return 'platform';
}

function inferPermissionScope(key: string): PermissionRow['scope'] {
  const normalized = key.trim().toLowerCase();

  if (
    normalized.startsWith('organization.') ||
    normalized.startsWith('organization_') ||
    normalized.startsWith('organization-') ||
    normalized.startsWith('org.')
  ) {
    return 'organization';
  }

  return 'platform';
}

function permissionDisplayName(key: string): string {
  return key
    .split('.')
    .map((segment) =>
      segment
        .replace(/[_-]+/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
    )
    .join(' · ');
}

function platformAssignmentId(userId: string, roleId: string): string {
  return ['platform', userId, roleId].join(':');
}

function organizationAssignmentId(
  organizationMemberId: string,
  roleId: string,
): string {
  return ['organization', organizationMemberId, roleId].join(':');
}

type ParsedAssignmentId =
  | {
      type: 'platform';
      userId: string;
      roleId: string;
    }
  | {
      type: 'organization';
      organizationMemberId: string;
      roleId: string;
    };

function parseAssignmentId(value: string): ParsedAssignmentId | undefined {
  const parts = value.split(':');

  if (parts.length !== 3) {
    return undefined;
  }

  const type = parts[0];

  const subjectId = parts[1];

  const roleId = parts[2];

  if (!subjectId || !roleId) {
    return undefined;
  }

  if (!isUuid(subjectId) || !isUuid(roleId)) {
    return undefined;
  }

  if (type === 'platform') {
    return {
      type: 'platform',

      userId: subjectId,

      roleId,
    };
  }

  if (type === 'organization') {
    return {
      type: 'organization',

      organizationMemberId: subjectId,

      roleId,
    };
  }

  return undefined;
}

function normalizeUserActorId(actorId: string): string | null {
  return isUuid(actorId) ? actorId : null;
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
