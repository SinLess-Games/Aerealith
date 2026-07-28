import type {
  AuthorizationEvent,
  AuthorizationPrincipal,
  AuthorizationScope,
  EffectiveAuthorization,
  Permission,
  PrincipalType,
  Role,
  RoleAssignment,
  RoleConflict,
} from './models';

export interface AuthorizationRepository {
  getPrincipalVersion(principal: AuthorizationPrincipal): Promise<number>;
  loadEffectiveAuthorization(
    principal: AuthorizationPrincipal,
  ): Promise<EffectiveAuthorization>;
  findPermissionByKey(key: string): Promise<Permission | undefined>;
}

export interface AuthorizationManagementRepository extends AuthorizationRepository {
  findRoleById(id: string): Promise<Role | undefined>;
  findAssignments(
    principal: AuthorizationPrincipal,
  ): Promise<readonly RoleAssignment[]>;
  findAssignmentById(id: string): Promise<RoleAssignment | undefined>;
  findRoleConflicts(roleId: string): Promise<readonly RoleConflict[]>;
  hasRolePermission(roleId: string, permissionId: string): Promise<boolean>;
  createRole(input: CreateRoleRecord): Promise<Role>;
  updateRole(id: string, input: Partial<CreateRoleRecord>): Promise<Role>;
  createPermission(input: CreatePermissionRecord): Promise<Permission>;
  updatePermission(
    id: string,
    input: Partial<CreatePermissionRecord>,
  ): Promise<Permission>;
  addRolePermission(
    roleId: string,
    permissionId: string,
    actorId: string,
  ): Promise<void>;
  removeRolePermission(roleId: string, permissionId: string): Promise<void>;
  addRoleParent(
    roleId: string,
    parentRoleId: string,
    actorId: string,
  ): Promise<void>;
  getParentRoleIds(roleId: string): Promise<readonly string[]>;
  assignRole(input: CreateRoleAssignmentRecord): Promise<RoleAssignment>;
  revokeRole(input: RevokeRoleAssignmentRecord): Promise<void>;
  incrementPrincipalVersion(principal: AuthorizationPrincipal): Promise<number>;
  countActiveRoleAssignments(roleKey: string): Promise<number>;
  transaction<T>(
    work: (repository: AuthorizationManagementRepository) => Promise<T>,
  ): Promise<T>;
}

export interface AuthorizationGuard {
  require(input: {
    readonly principal: AuthorizationPrincipal | undefined;
    readonly permission: string;
    readonly scope: AuthorizationScope;
  }): Promise<void>;
}

export interface CreateRoleRecord {
  readonly key: string;
  readonly displayName: string;
  readonly description?: string;
  readonly system: boolean;
  readonly assignable: boolean;
  readonly administrativeRank: number;
  readonly enabled: boolean;
}

export interface CreatePermissionRecord {
  readonly key: string;
  readonly resource: string;
  readonly action: string;
  readonly displayName: string;
  readonly description?: string;
  readonly system: boolean;
  readonly enabled: boolean;
}

export interface CreateRoleAssignmentRecord {
  readonly principal: AuthorizationPrincipal;
  readonly roleId: string;
  readonly scope: AuthorizationScope;
  readonly assignedBy: string;
  readonly expiresAt?: Date;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface RevokeRoleAssignmentRecord {
  readonly assignmentId: string;
  readonly principal: AuthorizationPrincipal;
  readonly revokedBy: string;
  readonly reason: string;
}

export interface AuthorizationScopeMatcher {
  matches(
    assignmentScope: AuthorizationScope,
    requestedScope: AuthorizationScope,
  ): boolean | Promise<boolean>;
}

export interface AuthorizationCache {
  get(key: string): Promise<EffectiveAuthorization | undefined>;
  set(key: string, value: EffectiveAuthorization, ttlMs: number): Promise<void>;
  deleteByPrincipal(
    principalId: string,
    principalType: PrincipalType,
  ): Promise<void>;
}

export interface AuthorizationEventPublisher {
  publish(event: AuthorizationEvent): Promise<void>;
}

export interface AuthorizationPolicyInput {
  readonly principal: AuthorizationPrincipal;
  readonly permission: string;
  readonly scope: AuthorizationScope;
  readonly resource?: Readonly<Record<string, unknown>>;
}

export interface AuthorizationPolicy {
  evaluate(
    input: AuthorizationPolicyInput,
  ): Promise<{ readonly allowed: boolean }>;
}

export interface RoleAssignmentPolicy {
  assertCanAssign(input: {
    readonly actor: AuthorizationPrincipal;
    readonly actorMaximumAdministrativeRank: number;
    readonly target: AuthorizationPrincipal;
    readonly role: Role;
    readonly scope: AuthorizationScope;
    readonly selfAssignmentAllowed: boolean;
    readonly canManageSystemRoles: boolean;
  }): Promise<void> | void;
}
