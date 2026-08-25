import type { Context } from 'hono';

import type { ApiEnv } from '../app/api-env.type';
import type { ApiRequestContext } from './api-request-context.interface';

export type MaybePromise<T> = T | Promise<T>;

/** Adds service dependencies to the base context created by the platform. */
export type ApiContextFactory<
  TEnv extends ApiEnv,
  TContext extends ApiRequestContext = TEnv['Variables']['apiContext'],
> = (
  context: ApiRequestContext<NonNullable<TContext['principal']>>,
  honoContext: Context<TEnv>,
) => MaybePromise<TContext>;

/** Resolves authentication once before transport handlers execute. */
export type ResolvePrincipal<TPrincipal> = (
  request: Request,
  context: ApiRequestContext,
) => MaybePromise<TPrincipal | undefined>;
