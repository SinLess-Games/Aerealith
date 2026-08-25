import type {
  AuthorizationCache,
  AuthorizationEventPublisher,
  AuthorizationPolicy,
  AuthorizationRepository,
  AuthorizationScopeMatcher,
} from './contracts';
import { AuthorizationDeniedError } from './errors';
import type {
  AuthorizationDecision,
  AuthorizationDecisionReason,
  AuthorizeInput,
  EffectiveAuthorization,
} from './models';
import {
  assertPermissionKey,
  authorizationCacheKey,
  DefaultAuthorizationScopeMatcher,
  resolveRoleIds,
} from './utilities';

export interface AuthorizationServiceOptions {
  readonly repository: AuthorizationRepository;
  readonly cache?: AuthorizationCache;
  readonly eventPublisher?: AuthorizationEventPublisher;
  readonly scopeMatcher?: AuthorizationScopeMatcher;
  readonly policies?: readonly AuthorizationPolicy[];
  readonly cacheTtlMs?: number;
  readonly now?: () => Date;
}

export class AuthorizationService {
  private readonly scopeMatcher: AuthorizationScopeMatcher;
  private readonly now: () => Date;
  constructor(private readonly options: AuthorizationServiceOptions) {
    this.scopeMatcher =
      options.scopeMatcher ?? new DefaultAuthorizationScopeMatcher();
    this.now = options.now ?? (() => new Date());
  }

  async can(input: AuthorizeInput): Promise<AuthorizationDecision> {
    if (!input.principal) return this.deny(input, 'principal_missing', '');
    try {
      assertPermissionKey(input.permission);
      const permission = await this.options.repository.findPermissionByKey(
        input.permission,
      );
      if (!permission)
        return this.deny(input, 'permission_missing', input.principal.id);
      if (!permission.enabled || permission.deletedAt)
        return this.deny(input, 'permission_disabled', input.principal.id);

      const effective = await this.load(input.principal);
      const now = this.now();
      let hadAssignment = false;
      let hadScopeMismatch = false;
      let hadRevokedAssignment = false;
      let hadExpiredAssignment = false;
      let hadDisabledRole = false;
      for (const assignment of effective.assignments) {
        if (assignment.revokedAt) {
          hadRevokedAssignment = true;
          continue;
        }
        if (assignment.expiresAt && assignment.expiresAt <= now) {
          hadExpiredAssignment = true;
          continue;
        }
        hadAssignment = true;
        if (!(await this.scopeMatcher.matches(assignment.scope, input.scope))) {
          hadScopeMismatch = true;
          continue;
        }
        const roleIds = resolveRoleIds(
          [assignment.roleId],
          effective.roles,
          effective.parentRoleIdsByRole,
        );
        for (const roleId of roleIds) {
          const role = effective.roles.find(
            (candidate) => candidate.id === roleId,
          );
          if (!role?.enabled || role.deletedAt) {
            hadDisabledRole = true;
            continue;
          }
          const granted = (effective.permissionsByRole[roleId] ?? []).some(
            (candidate) =>
              candidate.key === input.permission &&
              candidate.enabled &&
              !candidate.deletedAt,
          );
          if (!granted) continue;
          for (const policy of this.options.policies ?? []) {
            if (
              !(await policy.evaluate({ ...input, principal: input.principal }))
                .allowed
            )
              return this.deny(input, 'assignment_missing', input.principal.id);
          }
          return this.decision(
            input,
            true,
            'permission_granted',
            input.principal.id,
          );
        }
      }
      return this.deny(
        input,
        hadScopeMismatch
          ? 'scope_mismatch'
          : hadDisabledRole
            ? 'role_disabled'
            : hadRevokedAssignment
              ? 'assignment_revoked'
              : hadExpiredAssignment
                ? 'assignment_expired'
                : hadAssignment
                  ? 'permission_missing'
                  : 'assignment_missing',
        input.principal.id,
      );
    } catch {
      return this.deny(input, 'authorization_unavailable', input.principal.id);
    }
  }

  async require(input: AuthorizeInput): Promise<void> {
    if (!(await this.can(input)).allowed) throw new AuthorizationDeniedError();
  }

  async canAny(
    input: Omit<AuthorizeInput, 'permission'> & {
      readonly permissions: readonly string[];
    },
  ): Promise<AuthorizationDecision> {
    let last: AuthorizationDecision | undefined;
    for (const permission of input.permissions) {
      last = await this.can({ ...input, permission });
      if (last.allowed) return last;
    }
    return (
      last ??
      this.deny(
        { ...input, permission: '' },
        'permission_missing',
        input.principal?.id ?? '',
      )
    );
  }

  async canAll(
    input: Omit<AuthorizeInput, 'permission'> & {
      readonly permissions: readonly string[];
    },
  ): Promise<AuthorizationDecision> {
    let last: AuthorizationDecision | undefined;
    for (const permission of input.permissions) {
      last = await this.can({ ...input, permission });
      if (!last.allowed) return last;
    }
    return (
      last ??
      this.deny(
        { ...input, permission: '' },
        'permission_missing',
        input.principal?.id ?? '',
      )
    );
  }

  private async load(
    principal: NonNullable<AuthorizeInput['principal']>,
  ): Promise<EffectiveAuthorization> {
    const version =
      await this.options.repository.getPrincipalVersion(principal);
    const key = authorizationCacheKey(principal.id, principal.type, version);
    try {
      const cached = await this.options.cache?.get(key);
      if (cached?.version === version) return cached;
    } catch {
      /* persistence remains authoritative */
    }
    const loaded =
      await this.options.repository.loadEffectiveAuthorization(principal);
    try {
      await this.options.cache?.set(
        key,
        loaded,
        this.options.cacheTtlMs ?? 60_000,
      );
    } catch {
      /* cache availability never grants or denies */
    }
    return loaded;
  }

  private deny(
    input: AuthorizeInput,
    reason: AuthorizationDecisionReason,
    principalId: string,
  ) {
    const decision = this.decision(input, false, reason, principalId);
    void this.options.eventPublisher
      ?.publish({
        type: 'authorization.decision.denied',
        occurredAt: decision.evaluatedAt,
        actorId: principalId || undefined,
        permissionKey: input.permission,
        scope: input.scope,
        reason,
      })
      .catch(() => undefined);
    return decision;
  }

  private decision(
    input: AuthorizeInput,
    allowed: boolean,
    reason: AuthorizationDecisionReason,
    principalId: string,
  ): AuthorizationDecision {
    return {
      allowed,
      permission: input.permission,
      principalId,
      scope: input.scope,
      reason,
      evaluatedAt: this.now(),
    };
  }
}
