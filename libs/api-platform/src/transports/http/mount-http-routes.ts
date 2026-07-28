import { Hono } from 'hono';

import type { ApiEnv } from '../../app/api-env.type';
import type { HttpMountOptions } from './http-route-registrar.type';

/** Mounts one or more ordinary Hono route registrars. */
export function mountHttpRoutes<TEnv extends ApiEnv>(
  app: Hono<TEnv>,
  options: HttpMountOptions<TEnv>,
): Hono<TEnv> {
  const router = new Hono<TEnv>();
  const registrars = Array.isArray(options.register)
    ? options.register
    : [options.register];
  for (const register of registrars) register(router);
  app.route(options.basePath ?? '/', router);
  return app;
}
