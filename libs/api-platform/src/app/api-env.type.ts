import type { Env } from 'hono';

import type { ApiRequestContext } from '../context/api-request-context.interface';

/** Hono environment carrying the platform request context. */
export type ApiEnv<
  TContext extends ApiRequestContext = ApiRequestContext,
  TBindings extends object = Record<string, unknown>,
> = Env & {
  Bindings: TBindings;
  Variables: {
    apiContext: TContext;
  };
};

export type ApiContextOf<TEnv extends ApiEnv> = TEnv['Variables']['apiContext'];
