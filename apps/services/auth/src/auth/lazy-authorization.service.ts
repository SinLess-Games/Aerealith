import {
  AuthorizationService,
  type AuthorizationDecision,
  type AuthorizeInput,
} from '@aerealith-ai/authorization';
import {
  createDatabaseConnection,
  type DatabaseClientConnection,
  DrizzleAuthorizationRepository,
} from '@aerealith-ai/db';

export class LazyAuthorizationService extends AuthorizationService {
  private service: AuthorizationService | undefined;
  private database: DatabaseClientConnection | undefined;

  constructor(private readonly databaseUrl?: string) {
    super({
      repository: {
        getPrincipalVersion: async () => 0,
        loadEffectiveAuthorization: async () => {
          throw new Error('Lazy authorization service is not initialized.');
        },
        findPermissionByKey: async () => undefined,
      },
    });
  }

  override can(input: AuthorizeInput) {
    const selfServiceDecision = authorizeSelfService(input);
    if (selfServiceDecision) return Promise.resolve(selfServiceDecision);
    return this.getService().can(input);
  }

  override require(input: AuthorizeInput) {
    return super.require(input);
  }

  async close(): Promise<void> {
    await this.database?.close();
  }

  private getService(): AuthorizationService {
    this.database ??= createDatabaseConnection(
      this.databaseUrl ? { DATABASE_URL: this.databaseUrl } : process.env,
    );

    this.service ??= new AuthorizationService({
      repository: new DrizzleAuthorizationRepository(this.database.client),
    });
    return this.service;
  }
}

const SelfServicePermissions = new Set([
  'account.read',
  'account.update',
  'sessions.read',
  'sessions.revoke',
  'sessions.revoke_all',
]);

function authorizeSelfService(
  input: AuthorizeInput,
): AuthorizationDecision | undefined {
  const principal = input.principal;
  if (
    principal?.type !== 'user' ||
    !SelfServicePermissions.has(input.permission) ||
    input.scope.type !== 'resource' ||
    input.scope.id !== principal.id
  ) {
    return undefined;
  }

  return {
    allowed: true,
    permission: input.permission,
    principalId: principal.id,
    scope: input.scope,
    reason: 'permission_granted',
    evaluatedAt: new Date(),
  };
}
