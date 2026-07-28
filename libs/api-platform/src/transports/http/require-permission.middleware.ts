import type { MiddlewareHandler } from 'hono';

import type { AuthorizationScope } from '@aerealith-ai/authorization';

import type { ApiEnv } from '../../app/api-env.type';
import type {
  AuthorizationApiContext,
  AuthorizationScopeResolver,
} from '../../authorization/authorization-api-context.interface';
import { requireAuthorization } from '../../authorization/require-authorization';

export function requirePermission<
  TContext extends AuthorizationApiContext,
  TEnv extends ApiEnv<TContext>,
>(
  permission: string,
  scope: AuthorizationScope | AuthorizationScopeResolver<TContext> = {
    type: 'global',
  },
): MiddlewareHandler<TEnv> {
  return async (honoContext, next) => {
    const apiContext = honoContext.get('apiContext');
    await requireAuthorization({
      authorization: apiContext.authorization,
      principal: apiContext.principal,
      permission,
      scope: typeof scope === 'function' ? await scope(apiContext) : scope,
    });
    await next();
  };
}
