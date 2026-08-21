import type { AuthorizationScope } from '@aerealith-ai/authorization';

import type {
  AuthorizationApiContext,
  AuthorizationScopeResolver,
} from '../../authorization/authorization-api-context.interface';
import { GLOBAL_AUTHORIZATION_SCOPE } from '../../authorization/authorization-api-context.interface';
import { requireAuthorization } from '../../authorization/require-authorization';

export function createTrpcAuthorizationMiddleware<
  TContext extends AuthorizationApiContext,
>(
  permission: string,
  scope:
    | AuthorizationScope
    | AuthorizationScopeResolver<TContext> = GLOBAL_AUTHORIZATION_SCOPE,
) {
  return async (options: {
    readonly ctx: TContext;
    readonly next: () => Promise<unknown>;
  }): Promise<unknown> => {
    await requireAuthorization({
      authorization: options.ctx.authorization,
      principal: options.ctx.principal,
      permission,
      scope: typeof scope === 'function' ? await scope(options.ctx) : scope,
    });
    return options.next();
  };
}
