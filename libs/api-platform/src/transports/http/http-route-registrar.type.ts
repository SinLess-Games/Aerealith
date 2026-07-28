import type { Hono } from 'hono';

import type { ApiEnv } from '../../app/api-env.type';

export type HttpRouteRegistrar<TEnv extends ApiEnv> = (app: Hono<TEnv>) => void;

export interface HttpMountOptions<TEnv extends ApiEnv> {
  readonly basePath?: string;
  readonly register:
    HttpRouteRegistrar<TEnv> | readonly HttpRouteRegistrar<TEnv>[];
}
