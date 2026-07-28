import type { Hono } from 'hono';

import type { ApiEnv } from '../../app/api-env.type';
import type { WebSocketRoute } from './websocket-route.interface';

export interface WebSocketAdapter<TEnv extends ApiEnv> {
  register(
    app: Hono<TEnv>,
    route: WebSocketRoute<TEnv['Variables']['apiContext'], unknown>,
  ): void;
}
