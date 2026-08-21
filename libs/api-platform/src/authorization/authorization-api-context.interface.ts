import type {
  AuthorizationPrincipal,
  AuthorizationScope,
  AuthorizationService,
} from '@aerealith-ai/authorization';

import type { ApiRequestContext } from '../context/api-request-context.interface';

export const GLOBAL_AUTHORIZATION_SCOPE: AuthorizationScope = Object.freeze({
  type: 'global',
});

export interface AuthorizationApiContext extends ApiRequestContext<AuthorizationPrincipal> {
  readonly authorization: AuthorizationService;
}

export type AuthorizationScopeResolver<TContext> = (
  context: TContext,
) => AuthorizationScope | Promise<AuthorizationScope>;
