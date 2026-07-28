import type {
  AuthorizationCache,
  AuthorizationEventPublisher,
  AuthorizationGuard,
  AuthorizationManagementRepository,
  CreatePermissionRecord,
  RoleAssignmentPolicy,
} from './contracts';
import {
  LastAdministratorError,
  PermissionNotFoundError,
  PrivilegeEscalationError,
  ProtectedRoleError,
  RoleAssignmentConflictError,
  RoleNotFoundError,
} from './errors';
import type {
  AuthorizationPrincipal,
  AuthorizationScope,
  Role,
} from './models';
import { resolveRoleIds } from './utilities';

const globalScope = { type: 'global' } as const;

export class DefaultRoleAssignmentPolicy implements RoleAssignmentPolicy {
  assertCanAssign(
    input: Parameters<RoleAssignmentPolicy['assertCanAssign']>[0],
  ): void {
    if (input.actor.id === input.target.id && !input.selfAssignmentAllowed)
      throw new PrivilegeEscalationError();
    if (input.role.system && !input.canManageSystemRoles)
      throw new ProtectedRoleError();
    if (input.role.administrativeRank > input.actorMaximumAdministrativeRank)
      throw new PrivilegeEscalationError();
    if (!input.role.assignable || !input.role.enabled)
      throw new ProtectedRoleError();
  }
}

export class RoleManagementService {
  constructor(
    private readonly repository: AuthorizationManagementRepository,
    private readonly authorization: AuthorizationGuard,
    private readonly events: AuthorizationEventPublisher,
  ) {}

  async create(
    actor: AuthorizationPrincipal,
    input: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>,
  ) {
    await this.authorization.require({
      principal: actor,
      permission: 'authorization.roles.create',
      scope: globalScope,
    });
    if (input.system) throw new ProtectedRoleError();
    const role = await this.repository.createRole(input);
    await this.events.publish({
      type: 'authorization.role.created',
      occurredAt: new Date(),
      actorId: actor.id,
      roleId: role.id,
    });
    return role;
  }

  async update(
    actor: AuthorizationPrincipal,
    roleId: string,
    input: Partial<Omit<Role, 'id' | 'createdAt' | 'updatedAt'>>,
  ) {
    await this.authorization.require({
      principal: actor,
      permission: 'authorization.roles.update',
      scope: globalScope,
    });
    const existing = await this.repository.findRoleById(roleId);
    if (!existing) throw new RoleNotFoundError();
    if (existing.system) throw new ProtectedRoleError();
    const role = await this.repository.updateRole(roleId, input);
    await this.events.publish({
      type: role.enabled
        ? 'authorization.role.updated'
        : 'authorization.role.disabled',
      occurredAt: new Date(),
      actorId: actor.id,
      roleId,
    });
    return role;
  }

  async assignPermission(
    actor: AuthorizationPrincipal,
    roleId: string,
    permissionKey: string,
  ) {
    await this.authorization.require({
      principal: actor,
      permission: 'authorization.permissions.manage',
      scope: globalScope,
    });
    const role = await this.repository.findRoleById(roleId);
    if (!role) throw new RoleNotFoundError();
    if (role.system) throw new ProtectedRoleError();
    const permission = await this.repository.findPermissionByKey(permissionKey);
    if (!permission) throw new PermissionNotFoundError();
    if (await this.repository.hasRolePermission(roleId, permission.id))
      throw new RoleAssignmentConflictError();
    await this.repository.addRolePermission(roleId, permission.id, actor.id);
    await this.events.publish({
      type: 'authorization.permission.assigned',
      occurredAt: new Date(),
      actorId: actor.id,
      roleId,
      permissionKey,
    });
  }

  async removePermission(
    actor: AuthorizationPrincipal,
    roleId: string,
    permissionKey: string,
  ) {
    await this.authorization.require({
      principal: actor,
      permission: 'authorization.permissions.manage',
      scope: globalScope,
    });
    const role = await this.repository.findRoleById(roleId);
    if (!role) throw new RoleNotFoundError();
    if (role.system) throw new ProtectedRoleError();
    const permission = await this.repository.findPermissionByKey(permissionKey);
    if (!permission) throw new PermissionNotFoundError();
    await this.repository.removeRolePermission(roleId, permission.id);
    await this.events.publish({
      type: 'authorization.permission.removed',
      occurredAt: new Date(),
      actorId: actor.id,
      roleId,
      permissionKey,
    });
  }
}

export class PermissionManagementService {
  constructor(
    private readonly repository: AuthorizationManagementRepository,
    private readonly authorization: AuthorizationGuard,
  ) {}

  async create(actor: AuthorizationPrincipal, input: CreatePermissionRecord) {
    await this.requireManage(actor);
    if (input.system) throw new ProtectedRoleError();
    return this.repository.createPermission(input);
  }

  async update(
    actor: AuthorizationPrincipal,
    key: string,
    input: Partial<CreatePermissionRecord>,
  ) {
    await this.requireManage(actor);
    const permission = await this.repository.findPermissionByKey(key);
    if (!permission) throw new PermissionNotFoundError();
    if (permission.system) throw new ProtectedRoleError();
    return this.repository.updatePermission(permission.id, input);
  }

  private requireManage(actor: AuthorizationPrincipal) {
    return this.authorization.require({
      principal: actor,
      permission: 'authorization.permissions.manage',
      scope: globalScope,
    });
  }
}

export class RoleHierarchyService {
  constructor(
    private readonly repository: AuthorizationManagementRepository,
    private readonly authorization: AuthorizationGuard,
    private readonly maximumDepth = 32,
  ) {}

  async addParent(
    actor: AuthorizationPrincipal,
    roleId: string,
    parentRoleId: string,
  ) {
    await this.authorization.require({
      principal: actor,
      permission: 'authorization.roles.update',
      scope: globalScope,
    });
    const initialRoles = await Promise.all([
      this.repository.findRoleById(roleId),
      this.repository.findRoleById(parentRoleId),
    ]);
    const role = initialRoles[0];
    const parentRole = initialRoles[1];
    if (!role || !parentRole) throw new RoleNotFoundError();
    if (role.system || parentRole.system) throw new ProtectedRoleError();
    const parents: Record<string, readonly string[]> = {};
    const roleMap = new Map([
      [role.id, role],
      [parentRole.id, parentRole],
    ]);
    const collect = async (id: string): Promise<void> => {
      if (parents[id]) return;
      const found = roleMap.get(id) ?? (await this.repository.findRoleById(id));
      if (!found) throw new RoleNotFoundError();
      roleMap.set(id, found);
      parents[id] = await this.repository.getParentRoleIds(id);
      await Promise.all(parents[id].map(collect));
    };
    await collect(roleId);
    parents[roleId] = [...parents[roleId], parentRoleId];
    await collect(parentRoleId);
    resolveRoleIds([roleId], [...roleMap.values()], parents, this.maximumDepth);
    await this.repository.addRoleParent(roleId, parentRoleId, actor.id);
  }
}

export class RoleAssignmentService {
  constructor(
    private readonly repository: AuthorizationManagementRepository,
    private readonly authorization: AuthorizationGuard,
    private readonly cache: AuthorizationCache,
    private readonly events: AuthorizationEventPublisher,
    private readonly policy: RoleAssignmentPolicy = new DefaultRoleAssignmentPolicy(),
  ) {}

  async assign(input: {
    actor: AuthorizationPrincipal;
    actorMaximumAdministrativeRank: number;
    target: AuthorizationPrincipal;
    roleId: string;
    scope: AuthorizationScope;
    expiresAt?: Date;
    selfAssignmentAllowed?: boolean;
    canManageSystemRoles?: boolean;
  }) {
    await this.authorization.require({
      principal: input.actor,
      permission: 'authorization.roles.assign',
      scope: input.scope,
    });
    const role = await this.repository.findRoleById(input.roleId);
    if (!role) throw new RoleNotFoundError();
    await this.policy.assertCanAssign({
      actor: input.actor,
      actorMaximumAdministrativeRank: input.actorMaximumAdministrativeRank,
      target: input.target,
      role,
      scope: input.scope,
      selfAssignmentAllowed: input.selfAssignmentAllowed ?? false,
      canManageSystemRoles: input.canManageSystemRoles ?? false,
    });
    if (input.expiresAt && input.expiresAt <= new Date())
      throw new RoleAssignmentConflictError();
    const assignments = await this.repository.findAssignments(input.target);
    if (
      assignments.some(
        (item) =>
          item.roleId === role.id &&
          !item.revokedAt &&
          item.scope.type === input.scope.type &&
          item.scope.id === input.scope.id,
      )
    )
      throw new RoleAssignmentConflictError();
    const conflicts = await this.repository.findRoleConflicts(role.id);
    if (
      assignments.some(
        (item) =>
          !item.revokedAt &&
          conflicts.some(
            (conflict) => conflict.conflictingRoleId === item.roleId,
          ),
      )
    )
      throw new RoleAssignmentConflictError();
    const assignment = await this.repository.transaction(async (repository) => {
      const created = await repository.assignRole({
        principal: input.target,
        roleId: role.id,
        scope: input.scope,
        assignedBy: input.actor.id,
        ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
      });
      await repository.incrementPrincipalVersion(input.target);
      return created;
    });
    await this.cache.deleteByPrincipal(input.target.id, input.target.type);
    await this.events.publish({
      type: 'authorization.role.assigned',
      occurredAt: new Date(),
      actorId: input.actor.id,
      targetPrincipalId: input.target.id,
      roleId: role.id,
      scope: input.scope,
    });
    return assignment;
  }

  async revoke(input: {
    actor: AuthorizationPrincipal;
    target: AuthorizationPrincipal;
    assignmentId: string;
    reason: string;
  }) {
    await this.authorization.require({
      principal: input.actor,
      permission: 'authorization.roles.revoke',
      scope: globalScope,
    });
    const assignment = await this.repository.findAssignmentById(
      input.assignmentId,
    );
    if (
      !assignment ||
      assignment.principal.id !== input.target.id ||
      assignment.principal.type !== input.target.type
    )
      throw new RoleAssignmentConflictError();
    const role = await this.repository.findRoleById(assignment.roleId);
    if (!role) throw new RoleNotFoundError();
    if (
      role.key === 'platform_owner' &&
      (await this.repository.countActiveRoleAssignments('platform_owner')) <= 1
    )
      throw new LastAdministratorError();
    await this.repository.transaction(async (repository) => {
      await repository.revokeRole({
        assignmentId: input.assignmentId,
        principal: input.target,
        revokedBy: input.actor.id,
        reason: input.reason,
      });
      await repository.incrementPrincipalVersion(input.target);
    });
    await this.cache.deleteByPrincipal(input.target.id, input.target.type);
    await this.events.publish({
      type: 'authorization.role.revoked',
      occurredAt: new Date(),
      actorId: input.actor.id,
      targetPrincipalId: input.target.id,
      reason: input.reason,
    });
  }
}
