import type { Hono } from 'hono';

import type { ApiEnv } from '../../app/api-env.type';
import type { WebSocketAdapter } from './websocket-adapter.interface';
import type { WebSocketRoute } from './websocket-route.interface';

export interface WebSocketMountOptions<TEnv extends ApiEnv> {
  readonly adapter: WebSocketAdapter<TEnv>;
  readonly routes: readonly WebSocketRoute<
    TEnv['Variables']['apiContext'],
    unknown
  >[];
}

/** Registers runtime-neutral WebSocket definitions through an injected adapter. */
export function mountWebSocketRoutes<TEnv extends ApiEnv>(
  app: Hono<TEnv>,
  options: WebSocketMountOptions<TEnv>,
): Hono<TEnv> {
  for (const route of options.routes) options.adapter.register(app, route);
  return app;
}
