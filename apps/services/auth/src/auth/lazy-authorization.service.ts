import {
  AuthorizationService,
  type AuthorizeInput,
} from '@aerealith-ai/authorization';
import {
  createDatabaseClient,
  DrizzleAuthorizationRepository,
} from '@aerealith-ai/db';

export class LazyAuthorizationService extends AuthorizationService {
  private service: AuthorizationService | undefined;

  constructor() {
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
    return this.getService().can(input);
  }

  override require(input: AuthorizeInput) {
    return this.getService().require(input);
  }

  private getService(): AuthorizationService {
    this.service ??= new AuthorizationService({
      repository: new DrizzleAuthorizationRepository(createDatabaseClient()),
    });
    return this.service;
  }
}
