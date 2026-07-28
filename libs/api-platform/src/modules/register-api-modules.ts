import type { Hono } from 'hono';

import type { ApiEnv } from '../app/api-env.type';
import { mountGraphql } from '../transports/graphql';
import { mountHttpRoutes } from '../transports/http';
import { mountTrpc } from '../transports/trpc';
import { mountWebSocketRoutes } from '../transports/websocket';
import type { ApiModule } from './api-module.interface';

/** Registers any transport subset exposed by one or more service modules. */
export function registerApiModules<TEnv extends ApiEnv>(
  app: Hono<TEnv>,
  modules: readonly ApiModule<TEnv>[],
): Hono<TEnv> {
  for (const module of modules) {
    if (module.registerHttp) {
      mountHttpRoutes(app, {
        basePath: module.httpBasePath,
        register: module.registerHttp,
      });
    }
    if (module.trpc) mountTrpc(app, module.trpc);
    if (module.graphql) mountGraphql(app, module.graphql);
    if (module.webSockets) mountWebSocketRoutes(app, module.webSockets);
  }
  return app;
}
