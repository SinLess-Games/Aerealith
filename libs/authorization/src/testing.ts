import type {
  AuthorizationCache,
  AuthorizationEventPublisher,
  AuthorizationRepository,
} from './contracts';
import type {
  AuthorizationEvent,
  AuthorizationPrincipal,
  EffectiveAuthorization,
  Permission,
} from './models';

export class InMemoryAuthorizationRepository implements AuthorizationRepository {
  readonly permissions = new Map<string, Permission>();
  readonly authorizations = new Map<string, EffectiveAuthorization>();
  unavailable = false;

  async getPrincipalVersion(
    principal: AuthorizationPrincipal,
  ): Promise<number> {
    this.assertAvailable();
    return this.authorizations.get(principal.id)?.version ?? 0;
  }

  async loadEffectiveAuthorization(
    principal: AuthorizationPrincipal,
  ): Promise<EffectiveAuthorization> {
    this.assertAvailable();
    const authorization = this.authorizations.get(principal.id);
    if (!authorization) {
      return {
        principal,
        version: 0,
        assignments: [],
        roles: [],
        permissionsByRole: {},
        parentRoleIdsByRole: {},
      };
    }
    return authorization;
  }

  async findPermissionByKey(key: string): Promise<Permission | undefined> {
    this.assertAvailable();
    return this.permissions.get(key);
  }

  private assertAvailable(): void {
    if (this.unavailable) throw new Error('Repository unavailable');
  }
}

export class InMemoryAuthorizationCache implements AuthorizationCache {
  readonly values = new Map<string, EffectiveAuthorization>();

  async get(key: string): Promise<EffectiveAuthorization | undefined> {
    return this.values.get(key);
  }

  async set(key: string, value: EffectiveAuthorization): Promise<void> {
    this.values.set(key, value);
  }

  async deleteByPrincipal(
    principalId: string,
    principalType: AuthorizationPrincipal['type'],
  ): Promise<void> {
    const prefix = `authorization:${principalType}:${principalId}:`;
    for (const key of this.values.keys()) {
      if (key.startsWith(prefix)) this.values.delete(key);
    }
  }
}

export class FakeAuthorizationEventPublisher implements AuthorizationEventPublisher {
  readonly events: AuthorizationEvent[] = [];

  async publish(event: AuthorizationEvent): Promise<void> {
    this.events.push(event);
  }
}
