import type { AnyRouter, inferRouterContext } from '@trpc/server';
import type { Context } from 'hono';

import type { ApiEnv } from '../../app/api-env.type';
import type { MaybePromise } from '../../context/api-context-factory.interface';

export interface TrpcMountOptions<
  TEnv extends ApiEnv,
  TRouter extends AnyRouter,
> {
  readonly path?: string;
  readonly router: TRouter;
  readonly createContext: (
    shared: TEnv['Variables']['apiContext'],
    honoContext: Context<TEnv>,
  ) => MaybePromise<inferRouterContext<TRouter>>;
}
