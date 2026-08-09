import {
  AuthorizationService,
  type AuthorizationDecision,
  type AuthorizeInput,
} from '@aerealith-ai/authorization';

/** Authorization policy for process-local development accounts. */
export class LocalAuthorizationService extends AuthorizationService {
  constructor(private readonly evaluatedAt: () => Date = () => new Date()) {
    super({
      repository: {
        getPrincipalVersion: async () => 0,
        loadEffectiveAuthorization: async (principal) => ({
          principal,
          version: 0,
          assignments: [],
          roles: [],
          permissionsByRole: {},
          parentRoleIdsByRole: {},
        }),
        findPermissionByKey: async () => undefined,
      },
    });
  }

  override can(input: AuthorizeInput): Promise<AuthorizationDecision> {
    const principal = input.principal;
    const allowed =
      principal?.type === 'user' &&
      input.permission === 'account.read' &&
      input.scope.type === 'resource' &&
      input.scope.id === principal.id;

    return Promise.resolve({
      allowed,
      permission: input.permission,
      principalId: principal?.id ?? '',
      scope: input.scope,
      reason: allowed
        ? 'permission_granted'
        : principal
          ? 'permission_missing'
          : 'principal_missing',
      evaluatedAt: this.evaluatedAt(),
    });
  }
}
