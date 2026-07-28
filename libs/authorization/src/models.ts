export type PrincipalType = 'user' | 'service';
export type AuthorizationScopeType =
  | 'global'
  | 'organization'
  | 'workspace'
  | 'project'
  | 'discord_guild'
  | 'resource';

export interface AuthorizationPrincipal {
  readonly id: string;
  readonly type: PrincipalType;
}

export interface AuthorizationScope {
  readonly type: AuthorizationScopeType;
  readonly id?: string;
}

export interface Permission {
  readonly id: string;
  readonly key: string;
  readonly resource: string;
  readonly action: string;
  readonly displayName: string;
  readonly description?: string;
  readonly system: boolean;
  readonly enabled: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt?: Date;
}

export interface Role {
  readonly id: string;
  readonly key: string;
  readonly displayName: string;
  readonly description?: string;
  readonly system: boolean;
  readonly assignable: boolean;
  readonly administrativeRank: number;
  readonly enabled: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt?: Date;
}

export interface RoleAssignment {
  readonly id: string;
  readonly principal: AuthorizationPrincipal;
  readonly roleId: string;
  readonly scope: AuthorizationScope;
  readonly assignedBy: string;
  readonly assignedAt: Date;
  readonly expiresAt?: Date;
  readonly revokedBy?: string;
  readonly revokedAt?: Date;
  readonly revocationReason?: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface RoleConflict {
  readonly roleId: string;
  readonly conflictingRoleId: string;
  readonly reason: string;
}

export type AuthorizationDecisionReason =
  | 'permission_granted'
  | 'principal_missing'
  | 'permission_missing'
  | 'assignment_missing'
  | 'assignment_expired'
  | 'assignment_revoked'
  | 'scope_mismatch'
  | 'role_disabled'
  | 'permission_disabled'
  | 'authorization_unavailable';

export interface AuthorizationDecision {
  readonly allowed: boolean;
  readonly permission: string;
  readonly principalId: string;
  readonly scope: AuthorizationScope;
  readonly reason: AuthorizationDecisionReason;
  readonly evaluatedAt: Date;
}

export interface EffectiveAuthorization {
  readonly principal: AuthorizationPrincipal;
  readonly version: number;
  readonly assignments: readonly RoleAssignment[];
  readonly roles: readonly Role[];
  readonly permissionsByRole: Readonly<Record<string, readonly Permission[]>>;
  readonly parentRoleIdsByRole: Readonly<Record<string, readonly string[]>>;
}

export interface AuthorizeInput {
  readonly principal: AuthorizationPrincipal | undefined;
  readonly permission: string;
  readonly scope: AuthorizationScope;
  readonly resource?: Readonly<Record<string, unknown>>;
}

export interface AuthorizationEvent {
  readonly type: AuthorizationEventType;
  readonly occurredAt: Date;
  readonly actorId?: string;
  readonly targetPrincipalId?: string;
  readonly roleId?: string;
  readonly permissionKey?: string;
  readonly scope?: AuthorizationScope;
  readonly reason?: string;
  readonly requestId?: string;
}

export type AuthorizationEventType =
  | 'authorization.decision.denied'
  | 'authorization.role.created'
  | 'authorization.role.updated'
  | 'authorization.role.disabled'
  | 'authorization.role.deleted'
  | 'authorization.permission.assigned'
  | 'authorization.permission.removed'
  | 'authorization.role.assigned'
  | 'authorization.role.revoked'
  | 'authorization.role.assignment_failed'
  | 'authorization.role_hierarchy.created'
  | 'authorization.role_hierarchy.removed'
  | 'authorization.role_conflict.detected'
  | 'authorization.privilege_escalation.prevented';
