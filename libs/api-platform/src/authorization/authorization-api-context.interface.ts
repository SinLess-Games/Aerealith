import type {
  AuthorizationPrincipal,
  AuthorizationScope,
  AuthorizationService,
} from '@aerealith-ai/authorization';

import type { ApiRequestContext } from '../context/api-request-context.interface';

export interface AuthorizationApiContext extends ApiRequestContext<AuthorizationPrincipal> {
  readonly authorization: AuthorizationService;
}

export type AuthorizationScopeResolver<TContext> = (
  context: TContext,
) => AuthorizationScope | Promise<AuthorizationScope>;
