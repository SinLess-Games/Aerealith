import type { AuthorizationScope } from '@aerealith-ai/authorization';

import type {
  AuthorizationApiContext,
  AuthorizationScopeResolver,
} from '../../authorization/authorization-api-context.interface';
import { GLOBAL_AUTHORIZATION_SCOPE } from '../../authorization/authorization-api-context.interface';
import { requireAuthorization } from '../../authorization/require-authorization';

export async function requireWebSocketPermission<
  TContext extends AuthorizationApiContext,
>(
  context: TContext,
  permission: string,
  scope:
    | AuthorizationScope
    | AuthorizationScopeResolver<TContext> = GLOBAL_AUTHORIZATION_SCOPE,
): Promise<void> {
  await requireAuthorization({
    authorization: context.authorization,
    principal: context.principal,
    permission,
    scope: typeof scope === 'function' ? await scope(context) : scope,
  });
}
