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
  permissionsTable,
  principalAuthorizationVersionsTable,
  principalRolesTable,
  roleConflictsTable,
  roleInheritanceTable,
  rolePermissionsTable,
  rolesTable,
  type PermissionRow,
  type PrincipalRoleRow,
  type RoleRow,
} from '../../schema';

export class DrizzleAuthorizationRepository implements AuthorizationManagementRepository {
  constructor(private readonly database: DatabaseClient) {}

  async getPrincipalVersion(
    principal: AuthorizationPrincipal,
  ): Promise<number> {
    const [row] = await this.database
      .select({ version: principalAuthorizationVersionsTable.version })
      .from(principalAuthorizationVersionsTable)
      .where(this.principalVersionCondition(principal))
      .limit(1);
    return row?.version ?? 0;
  }

  async loadEffectiveAuthorization(
    principal: AuthorizationPrincipal,
  ): Promise<EffectiveAuthorization> {
    const [version, assignmentRows, roleRows, inheritanceRows, grantRows] =
      await Promise.all([
        this.getPrincipalVersion(principal),
        this.database
          .select()
          .from(principalRolesTable)
          .where(
            and(
              eq(principalRolesTable.principalType, principal.type),
              eq(principalRolesTable.principalId, principal.id),
            ),
          ),
        this.database.select().from(rolesTable),
        this.database.select().from(roleInheritanceTable),
        this.database
          .select({
            roleId: rolePermissionsTable.roleId,
            permission: permissionsTable,
          })
          .from(rolePermissionsTable)
          .innerJoin(
            permissionsTable,
            eq(rolePermissionsTable.permissionId, permissionsTable.id),
          ),
      ]);

    const permissionsByRole: Record<string, Permission[]> = {};
    for (const grant of grantRows) {
      (permissionsByRole[grant.roleId] ??= []).push(
        toPermission(grant.permission),
      );
    }
    const parentRoleIdsByRole: Record<string, string[]> = {};
    for (const edge of inheritanceRows) {
      (parentRoleIdsByRole[edge.roleId] ??= []).push(edge.parentRoleId);
    }

    return {
      principal,
      version,
      assignments: assignmentRows.map(toRoleAssignment),
      roles: roleRows.map(toRole),
      permissionsByRole,
      parentRoleIdsByRole,
    };
  }

  async findPermissionByKey(key: string): Promise<Permission | undefined> {
    const [row] = await this.database
      .select()
      .from(permissionsTable)
      .where(eq(permissionsTable.key, key))
      .limit(1);
    return row ? toPermission(row) : undefined;
  }

  async findRoleById(id: string): Promise<Role | undefined> {
    const [row] = await this.database
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.id, id))
      .limit(1);
    return row ? toRole(row) : undefined;
  }

  async findAssignments(
    principal: AuthorizationPrincipal,
  ): Promise<readonly RoleAssignment[]> {
    return (
      await this.database
        .select()
        .from(principalRolesTable)
        .where(
          and(
            eq(principalRolesTable.principalType, principal.type),
            eq(principalRolesTable.principalId, principal.id),
          ),
        )
    ).map(toRoleAssignment);
  }

  async findAssignmentById(id: string): Promise<RoleAssignment | undefined> {
    const [row] = await this.database
      .select()
      .from(principalRolesTable)
      .where(eq(principalRolesTable.id, id))
      .limit(1);
    return row ? toRoleAssignment(row) : undefined;
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
      .select({ roleId: rolePermissionsTable.roleId })
      .from(rolePermissionsTable)
      .where(
        and(
          eq(rolePermissionsTable.roleId, roleId),
          eq(rolePermissionsTable.permissionId, permissionId),
        ),
      )
      .limit(1);
    return row !== undefined;
  }

  async createRole(input: CreateRoleRecord): Promise<Role> {
    const [row] = await this.database
      .insert(rolesTable)
      .values(input)
      .returning();
    if (!row) throw new Error('Failed to create role.');
    return toRole(row);
  }

  async updateRole(
    id: string,
    input: Partial<CreateRoleRecord>,
  ): Promise<Role> {
    const [row] = await this.database
      .update(rolesTable)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(rolesTable.id, id))
      .returning();
    if (!row) throw new Error('Role not found.');
    return toRole(row);
  }

  async createPermission(input: CreatePermissionRecord): Promise<Permission> {
    const [row] = await this.database
      .insert(permissionsTable)
      .values(input)
      .returning();
    if (!row) throw new Error('Failed to create permission.');
    return toPermission(row);
  }

  async updatePermission(
    id: string,
    input: Partial<CreatePermissionRecord>,
  ): Promise<Permission> {
    const [row] = await this.database
      .update(permissionsTable)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(permissionsTable.id, id))
      .returning();
    if (!row) throw new Error('Permission not found.');
    return toPermission(row);
  }

  async addRolePermission(
    roleId: string,
    permissionId: string,
    actorId: string,
  ): Promise<void> {
    await this.database
      .insert(rolePermissionsTable)
      .values({ roleId, permissionId, assignedBy: actorId })
      .onConflictDoNothing();
  }

  async removeRolePermission(
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    await this.database
      .delete(rolePermissionsTable)
      .where(
        and(
          eq(rolePermissionsTable.roleId, roleId),
          eq(rolePermissionsTable.permissionId, permissionId),
        ),
      );
  }

  async addRoleParent(
    roleId: string,
    parentRoleId: string,
    actorId: string,
  ): Promise<void> {
    await this.database
      .insert(roleInheritanceTable)
      .values({ roleId, parentRoleId, createdBy: actorId })
      .onConflictDoNothing();
  }

  async getParentRoleIds(roleId: string): Promise<readonly string[]> {
    return (
      await this.database
        .select({ id: roleInheritanceTable.parentRoleId })
        .from(roleInheritanceTable)
        .where(eq(roleInheritanceTable.roleId, roleId))
    ).map(({ id }) => id);
  }

  async assignRole(input: CreateRoleAssignmentRecord): Promise<RoleAssignment> {
    const activeKey = [
      input.principal.type,
      input.principal.id,
      input.roleId,
      input.scope.type,
      input.scope.id ?? '',
    ].join(':');
    const [row] = await this.database
      .insert(principalRolesTable)
      .values({
        principalType: input.principal.type,
        principalId: input.principal.id,
        roleId: input.roleId,
        scopeType: input.scope.type,
        scopeId: input.scope.id,
        assignedBy: input.assignedBy,
        expiresAt: input.expiresAt,
        metadata: input.metadata ? { ...input.metadata } : {},
        activeKey,
      })
      .returning();
    if (!row) throw new Error('Failed to assign role.');
    return toRoleAssignment(row);
  }

  async revokeRole(input: RevokeRoleAssignmentRecord): Promise<void> {
    const [row] = await this.database
      .update(principalRolesTable)
      .set({
        revokedBy: input.revokedBy,
        revokedAt: new Date(),
        revocationReason: input.reason,
        activeKey: null,
      })
      .where(
        and(
          eq(principalRolesTable.id, input.assignmentId),
          eq(principalRolesTable.principalType, input.principal.type),
          eq(principalRolesTable.principalId, input.principal.id),
          isNull(principalRolesTable.revokedAt),
        ),
      )
      .returning({ id: principalRolesTable.id });
    if (!row) throw new Error('Active role assignment not found.');
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
          version: sql`${principalAuthorizationVersionsTable.version} + 1`,
          updatedAt: new Date(),
        },
      })
      .returning({ version: principalAuthorizationVersionsTable.version });
    if (!row) throw new Error('Failed to update authorization version.');
    return row.version;
  }

  async countActiveRoleAssignments(roleKey: string): Promise<number> {
    const [row] = await this.database
      .select({ value: count() })
      .from(principalRolesTable)
      .innerJoin(rolesTable, eq(principalRolesTable.roleId, rolesTable.id))
      .where(
        and(
          eq(rolesTable.key, roleKey),
          isNull(principalRolesTable.revokedAt),
          or(
            isNull(principalRolesTable.expiresAt),
            sql`${principalRolesTable.expiresAt} > now()`,
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
    displayName: row.displayName,
    ...(row.description ? { description: row.description } : {}),
    system: row.system,
    enabled: row.enabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...(row.deletedAt ? { deletedAt: row.deletedAt } : {}),
  };
}

function toRole(row: RoleRow): Role {
  return {
    id: row.id,
    key: row.key,
    displayName: row.displayName,
    ...(row.description ? { description: row.description } : {}),
    system: row.system,
    assignable: row.assignable,
    administrativeRank: row.administrativeRank,
    enabled: row.enabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...(row.deletedAt ? { deletedAt: row.deletedAt } : {}),
  };
}

function toRoleAssignment(row: PrincipalRoleRow): RoleAssignment {
  return {
    id: row.id,
    principal: {
      id: row.principalId,
      type: row.principalType as AuthorizationPrincipal['type'],
    },
    roleId: row.roleId,
    scope: {
      type: row.scopeType as RoleAssignment['scope']['type'],
      ...(row.scopeId ? { id: row.scopeId } : {}),
    },
    assignedBy: row.assignedBy,
    assignedAt: row.assignedAt,
    ...(row.expiresAt ? { expiresAt: row.expiresAt } : {}),
    ...(row.revokedBy ? { revokedBy: row.revokedBy } : {}),
    ...(row.revokedAt ? { revokedAt: row.revokedAt } : {}),
    ...(row.revocationReason ? { revocationReason: row.revocationReason } : {}),
    metadata: row.metadata,
  };
}
